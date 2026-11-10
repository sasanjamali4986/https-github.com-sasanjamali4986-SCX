import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  ScanBarcode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { GymMember, AttendanceRecord, UserRole } from '../data/gymData';

interface ReceptionCheckInDeskProps {
  members: GymMember[];
  attendances: AttendanceRecord[];
  currentRole: UserRole;
  onCheckInSuccess: (
    updatedMember: GymMember,
    attendanceRecord: AttendanceRecord,
    warningText: string | null
  ) => Promise<void>;
  onCheckInDenied: (attendanceRecord: AttendanceRecord) => Promise<void>;
  onQuickRenewMember: (member: GymMember, addedSessions: number, amountTomans: number) => Promise<void>;
}

interface CheckInGateOutcome {
  allowed: boolean;
  errorCode: string;
  message: string;
  warning: string | null;
  member?: GymMember;
  deducted?: number;
  remainingAfter?: number;
  lockerAssigned?: string;
  daysLeft?: number;
  timestampShamsi: string;
}

export const ReceptionCheckInDesk: React.FC<ReceptionCheckInDeskProps> = ({
  members,
  attendances,
  currentRole,
  onCheckInSuccess,
  onCheckInDenied,
  onQuickRenewMember,
}) => {
  const [identifierInput, setIdentifierInput] = useState('');
  const [lockerInput, setLockerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gateOutcome, setGateOutcome] = useState<CheckInGateOutcome | null>(null);
  const [logFilter, setLogFilter] = useState<'ALL' | 'Allowed' | 'Denied'>('ALL');
  const [searchLog, setSearchLog] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const canOperateGate = currentRole === 'SuperAdmin' || currentRole === 'Receptionist';

  const getCurrentShamsiTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `۱۴۰۵/۰۸/۱۸ - ${hours}:${mins}`;
  };

  const executeCheckIn = async (rawCodeToScan: string) => {
    const code = rawCodeToScan.trim().toUpperCase();
    if (!code) return;

    if (!canOperateGate) {
      setGateOutcome({
        allowed: false,
        errorCode: 'RBAC_FORBIDDEN',
        message: `سطح دسترسی فعلی شما (${currentRole}) مجوز ثبت ورود و کسر جلسه در گیت پذیرش را ندارد. لطفاً نقش «مدیر کل» یا «منشی پذیرش» را انتخاب کنید.`,
        warning: null,
        timestampShamsi: getCurrentShamsiTime(),
      });
      return;
    }

    setIsSubmitting(true);

    // Find matching member in local/Firestore state to send snapshot to Axios API
    const matchedMember = members.find(
      (m) =>
        m.membershipCode.toUpperCase() === code ||
        m.nationalCode === code ||
        m.id.toUpperCase() === code
    );

    const shamsiNow = getCurrentShamsiTime();

    try {
      const response = await axios.post('/api/attendance/check-in', {
        identifier: code,
        memberSnapshot: matchedMember,
        requestedLocker: lockerInput.trim() || undefined,
      });

      const data = response.data;
      const updatedMember: GymMember = data.member;

      const newAttendance: AttendanceRecord = {
        id: `att_${Date.now()}`,
        memberId: updatedMember.id,
        memberName: updatedMember.fullName,
        membershipCode: updatedMember.membershipCode,
        planTitle: updatedMember.planTitle,
        checkInShamsi: shamsiNow,
        remainingSessionsAfter: data.remainingSessionsAfter,
        lockerAssigned: data.lockerAssigned || updatedMember.lockerNumber || 'A-15',
        status: 'Allowed',
        notes: data.warning
          ? `ورود موفق (۱ جلسه کسر شد) · ${data.warning}`
          : 'ورود موفق با اسکن بارکد · ۱ جلسه از اشتراک کسر گردید',
      };

      await onCheckInSuccess(updatedMember, newAttendance, data.warning || null);

      setGateOutcome({
        allowed: true,
        errorCode: 'OK',
        message: data.message,
        warning: data.warning || null,
        member: updatedMember,
        deducted: 1,
        remainingAfter: data.remainingSessionsAfter,
        lockerAssigned: data.lockerAssigned,
        daysLeft: data.daysRemaining,
        timestampShamsi: shamsiNow,
      });

      setIdentifierInput('');
      setLockerInput('');
      barcodeInputRef.current?.focus();
    } catch (err: any) {
      const errData = err.response?.data;
      const rejectedMember: GymMember | undefined = errData?.member || matchedMember;
      const errMessage =
        errData?.message || `خطا در بررسی کارت عضویت «${code}». لطفاً وضعیت اشتراک را بررسی نمایید.`;

      if (rejectedMember) {
        const deniedAttendance: AttendanceRecord = {
          id: `att_${Date.now()}`,
          memberId: rejectedMember.id,
          memberName: rejectedMember.fullName,
          membershipCode: rejectedMember.membershipCode,
          planTitle: rejectedMember.planTitle,
          checkInShamsi: shamsiNow,
          remainingSessionsAfter: rejectedMember.remainingSessions,
          lockerAssigned: '-',
          status: 'Denied',
          notes: `جلوگیری از ورود: ${errMessage}`,
        };
        await onCheckInDenied(deniedAttendance);
      }

      setGateOutcome({
        allowed: false,
        errorCode: errData?.errorCode || 'CHECKIN_DENIED',
        message: errMessage,
        warning: null,
        member: rejectedMember,
        remainingAfter: rejectedMember?.remainingSessions ?? 0,
        timestampShamsi: shamsiNow,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeCheckIn(identifierInput);
  };

  const filteredAttendances = attendances.filter((item) => {
    const matchesStatus = logFilter === 'ALL' || item.status === logFilter;
    const matchesQuery =
      !searchLog.trim() ||
      item.memberName.includes(searchLog.trim()) ||
      item.membershipCode.toLowerCase().includes(searchLog.trim().toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Main Scanner & Gate Control Panel */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              میز پذیرش، اسکن بارکد و کسر خودکار جلسات (Check-In Gate)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              با اسکن بارکد کارت عضویت یا وارد کردن کد ملی ۱۰ رقمی، اعتبار زمانی و سقف جلسات بررسی شده و دقیقاً ۱ جلسه به صورت تراکنشی کسر می‌گردد.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0">
            API Endpoint: POST /api/attendance/check-in · نقش فعال: {currentRole}
          </div>
        </div>

        {/* Quick Barcode Simulation Presets for Testing All Business Rules */}
        <div className="mt-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
            شبیه‌ساز سریع بارکدخوان (جهت تست قوانین تجاری کسر جلسه و کنترل خطاها):
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {members.map((m) => {
              const isZero = m.remainingSessions <= 0;
              const isExp = m.status === 'Expired';
              const isLow = !isZero && !isExp && m.remainingSessions <= 3;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setIdentifierInput(m.membershipCode);
                    executeCheckIn(m.membershipCode);
                  }}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    isExp || isZero
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                      : isLow
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ScanBarcode className="w-3.5 h-3.5 shrink-0" />
                  <span>{m.fullName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{m.membershipCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {isExp
                      ? 'منقضی‌شده'
                      : `${m.remainingSessions}/${m.totalSessions} جلسه`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barcode / National ID Form */}
        <form onSubmit={handleFormSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              شناسه بارکد / QR کارت عضویت یا کد ملی ۱۰ رقمی ورزشکار
            </label>
            <input
              ref={barcodeInputRef}
              type="text"
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder="مثال: GYM-1405-1001 یا 0018492031"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              تخصیص شماره کمد (اختیاری)
            </label>
            <input
              type="text"
              value={lockerInput}
              onChange={(e) => setLockerInput(e.target.value)}
              placeholder="مثال: VIP-04 یا A-14"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || !identifierInput.trim()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'در حال بررسی و کسر جلسه...' : 'ثبت ورود و کسر ۱ جلسه'}</span>
            </button>
          </div>
        </form>

        {/* Gate Verification Outcome Panel */}
        {gateOutcome && (
          <div
            className={`mt-6 p-5 rounded-xl border ${
              gateOutcome.allowed
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {gateOutcome.allowed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`text-base font-bold ${
                        gateOutcome.allowed
                          ? 'text-emerald-900 dark:text-emerald-100'
                          : 'text-rose-900 dark:text-rose-100'
                      }`}
                    >
                      {gateOutcome.allowed ? 'مجوز تردد صادر شد — گیت ورودی باز است' : 'عدم صدور مجوز ورود — گیت قفل است'}
                    </h3>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {gateOutcome.errorCode}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {gateOutcome.timestampShamsi}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-200 mt-1.5 font-medium">
                    {gateOutcome.message}
                  </p>

                  {gateOutcome.warning && (
                    <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{gateOutcome.warning}</span>
                    </div>
                  )}

                  {gateOutcome.member && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-700 dark:text-slate-300">
                      <span>
                        ورزشکار: <strong className="font-semibold">{gateOutcome.member.fullName}</strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        کد ملی: {gateOutcome.member.nationalCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>دوره: {gateOutcome.member.planTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span>مربی: {gateOutcome.member.coachName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        انقضا: {gateOutcome.member.expirationShamsi}
                      </span>
                      {gateOutcome.lockerAssigned && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">
                            <KeyRound className="w-3.5 h-3.5" />
                            کمد تحویلی: {gateOutcome.lockerAssigned}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {gateOutcome.member?.medicalNotes && (
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      پرونده پزشکی / آسیب‌ها: {gateOutcome.member.medicalNotes} (گروه خونی:{' '}
                      <span className="font-mono">{gateOutcome.member.bloodType}</span>)
                    </div>
                  )}
                </div>
              </div>

              {/* Session Counter & Instant Renewal Action when Denied or Low */}
              {gateOutcome.member && (
                <div className="shrink-0 flex flex-col items-end justify-between gap-3 bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 min-w-[220px]">
                  <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>اعتبار جلسات باقی‌مانده</span>
                    <span className="font-mono tabular-nums font-bold text-base text-slate-900 dark:text-slate-100">
                      {gateOutcome.member.remainingSessions} از {gateOutcome.member.totalSessions}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        gateOutcome.member.remainingSessions === 0
                          ? 'bg-rose-500'
                          : gateOutcome.member.remainingSessions <= 3
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (gateOutcome.member.remainingSessions /
                              Math.max(1, gateOutcome.member.totalSessions)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  {(!gateOutcome.allowed || gateOutcome.member.remainingSessions <= 3) && (
                    <button
                      type="button"
                      onClick={() =>
                        gateOutcome.member &&
                        onQuickRenewMember(gateOutcome.member, 16, 2850000)
                      }
                      className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span>تمدید آنی ۱۶ جلسه (۲,۸۵۰,۰۰۰ ت)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Live Attendance Log Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              لاگ تراکنشی حضور و غیاب و کسر جلسات امروز
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تمامی رکوردهای ورود موفق و موارد ردشده به دلیل اتمام جلسه یا انقضای تاریخ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="جستجوی نام یا بارکد..."
                className="pr-9 pl-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['ALL', 'Allowed', 'Denied'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setLogFilter(st)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    logFilter === st
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'همه ترددها' : st === 'Allowed' ? 'ورود مجاز' : 'رد شده'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3">نام ورزشکار</th>
                <th className="py-3 px-3">بارکد عضویت</th>
                <th className="py-3 px-3">دوره / رشته</th>
                <th className="py-3 px-3">زمان ثبت (شمسی)</th>
                <th className="py-3 px-3 text-left">جلسات باقی‌مانده</th>
                <th className="py-3 px-3">کمد</th>
                <th className="py-3 px-3">وضعیت گیت و توضیحات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    هیچ رکورد ترددی مطابق با فیلتر انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att) => (
                  <tr
                    key={att.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {att.memberName}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {att.membershipCode}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {att.planTitle}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {att.checkInShamsi}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-left font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {att.remainingSessionsAfter} جلسه
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {att.lockerAssigned}
                    </td>
                    <td className="py-3 px-3 text-xs">
                      <div className="flex items-center gap-2">
                        {att.status === 'Allowed' ? (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                            مجاز (کسر ۱ جلسه)
                          </span>
                        ) : (
                          <span className="font-semibold text-rose-700 dark:text-rose-400 inline-flex items-center gap-1 whitespace-nowrap">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            عدم مجوز ورود
                          </span>
                        )}
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="text-slate-600 dark:text-slate-400">{att.notes}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
