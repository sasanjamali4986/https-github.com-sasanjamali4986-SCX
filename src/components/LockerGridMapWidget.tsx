import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Unlock,
  Wrench,
  Clock,
  CheckCircle2,
  UserCheck,
  RotateCcw,
  Search,
  Sparkles,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { LockerItem, GymMember, UserRole } from '../data/gymData';

interface LockerGridMapWidgetProps {
  lockers: LockerItem[];
  members: GymMember[];
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onUpdateLocker: (lockerId: string, updates: Partial<LockerItem>) => void;
}

const RENTAL_DURATIONS = [
  { label: 'امروز (تحویل موقت روزانه)', expiresShamsi: '۱۴۰۵/۰۸/۱۸ (روزانه)' },
  { label: '۱ ماهه (تا ۱۴۰۵/۰۹/۱۸)', expiresShamsi: '۱۴۰۵/۰۹/۱۸' },
  { label: '۳ ماهه (تا ۱۴۰۵/۱۱/۱۸)', expiresShamsi: '۱۴۰۵/۱۱/۱۸' },
  { label: '۶ ماهه VIP (تا ۱۴۰۶/۰۲/۱۸)', expiresShamsi: '۱۴۰۶/۰۲/۱۸' },
];

export const LockerGridMapWidget: React.FC<LockerGridMapWidgetProps> = ({
  lockers,
  members,
  currentRole,
  onSwitchRole,
  onUpdateLocker,
}) => {
  // Quick-assign toolbar state for Receptionist
  const [quickMemberId, setQuickMemberId] = useState<string>(members[0]?.id || 'mem_1001');
  const [quickDurationExpires, setQuickDurationExpires] = useState<string>('۱۴۰۵/۰۹/۱۸');

  // Filter & Search state
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'VIP' | 'Standard'>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'Available' | 'Occupied' | 'ExpiringSoon' | 'Maintenance'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected locker for detailed contract inspector
  const [selectedLockerId, setSelectedLockerId] = useState<string>(lockers[0]?.id || 'loc_1');
  const [customExpiresInput, setCustomExpiresInput] = useState<string>('۱۴۰۵/۱۰/۳۰');
  const [customMemberId, setCustomMemberId] = useState<string>(members[0]?.id || 'mem_1001');
  const [feedbackToast, setFeedbackToast] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  const canManageLockers = currentRole === 'Receptionist' || currentRole === 'SuperAdmin';

  const quickSelectedMember =
    members.find((m) => m.id === quickMemberId) || members[0];

  const selectedLocker =
    lockers.find((l) => l.id === selectedLockerId) || lockers[0] || null;

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackToast({ type, text });
    setTimeout(() => {
      setFeedbackToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Handler: 1-Click Quick Reserve by Receptionist directly from Grid Cell
  const handleQuickReserveLocker = (locker: LockerItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!quickSelectedMember) return;

    onUpdateLocker(locker.id, {
      status: 'Occupied',
      assignedMemberName: quickSelectedMember.fullName,
      assignedMemberCode: quickSelectedMember.membershipCode,
      expiresAtShamsi: quickDurationExpires,
    });
    setSelectedLockerId(locker.id);
    showToast(
      `کمد ${locker.lockerNumber} به نام «${quickSelectedMember.fullName}» (${quickSelectedMember.membershipCode}) تا تاریخ ${quickDurationExpires} رزرو شد.`
    );
  };

  // Handler: 1-Click Quick Release by Receptionist directly from Grid Cell
  const handleQuickReleaseLocker = (locker: LockerItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prevHolder = locker.assignedMemberName;

    onUpdateLocker(locker.id, {
      status: 'Available',
      assignedMemberName: '-',
      assignedMemberCode: '-',
      expiresAtShamsi: '-',
    });
    setSelectedLockerId(locker.id);
    showToast(
      `کمد ${locker.lockerNumber} (در اختیار ${prevHolder}) آزادسازی شد و اکنون آماده واگذاری مجدد است.`,
      'info'
    );
  };

  // Handler: Auto-assign first available locker in chosen zone
  const handleAutoAssignNextAvailable = (preferredZone: 'VIP' | 'Standard') => {
    const candidate = lockers.find(
      (l) => l.zone === preferredZone && l.status === 'Available'
    );
    if (!candidate) {
      showToast(`هیچ کمد خالی در بخش ${preferredZone} یافت نشد.`, 'info');
      return;
    }
    handleQuickReserveLocker(candidate);
  };

  // Counts for KPI bar
  const totalCount = lockers.length;
  const availableCount = lockers.filter((l) => l.status === 'Available').length;
  const occupiedCount = lockers.filter((l) => l.status === 'Occupied').length;
  const expiringCount = lockers.filter((l) => l.status === 'ExpiringSoon').length;
  const maintenanceCount = lockers.filter((l) => l.status === 'Maintenance').length;
  const occupancyRate =
    totalCount > 0 ? Math.round(((occupiedCount + expiringCount) / totalCount) * 100) : 0;

  // Filtered lockers
  const filteredLockers = lockers.filter((l) => {
    if (zoneFilter !== 'ALL' && l.zone !== zoneFilter) return false;
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNum = l.lockerNumber.toLowerCase().includes(q);
      const matchName = l.assignedMemberName.toLowerCase().includes(q);
      const matchCode = l.assignedMemberCode.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchCode) return false;
    }
    return true;
  });

  const vipLockers = filteredLockers.filter((l) => l.zone === 'VIP');
  const standardLockers = filteredLockers.filter((l) => l.zone === 'Standard');

  const renderLockerDoorCell = (locker: LockerItem) => {
    const isSelected = selectedLocker?.id === locker.id;

    const cardColors =
      locker.status === 'Available'
        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/35 dark:bg-emerald-950/20 hover:border-emerald-500'
        : locker.status === 'Occupied'
        ? 'border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-900/90 hover:border-slate-500'
        : locker.status === 'ExpiringSoon'
        ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/25 hover:border-amber-500'
        : 'border-rose-300 dark:border-rose-800/80 bg-rose-50/35 dark:bg-rose-950/25 hover:border-rose-500';

    const dotColor =
      locker.status === 'Available'
        ? 'bg-emerald-500'
        : locker.status === 'Occupied'
        ? 'bg-sky-500'
        : locker.status === 'ExpiringSoon'
        ? 'bg-amber-500'
        : 'bg-rose-500';

    const statusLabel =
      locker.status === 'Available'
        ? 'خالی (آماده رزرو)'
        : locker.status === 'Occupied'
        ? 'اشغال / در اجاره'
        : locker.status === 'ExpiringSoon'
        ? 'سررسید نزدیک'
        : 'در دست تعمیر';

    return (
      <div
        key={locker.id}
        onClick={() => {
          setSelectedLockerId(locker.id);
          if (locker.expiresAtShamsi && locker.expiresAtShamsi !== '-') {
            setCustomExpiresInput(locker.expiresAtShamsi);
          }
        }}
        className={`relative rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between min-h-[168px] ${cardColors} ${
          isSelected ? 'ring-2 ring-emerald-500 shadow-sm' : ''
        }`}
      >
        {/* Top Locker Door Hardware: Vent Slits + Number + Lock Icon */}
        <div>
          {/* Physical Locker Door Louver Vents */}
          <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/70 dark:border-slate-800/80">
            <div className="flex flex-col gap-1 w-10" aria-hidden="true">
              <span className="h-0.5 w-full rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="h-0.5 w-full rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="h-0.5 w-full rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {locker.monthlyRate.toLocaleString('fa-IR')} ت
            </span>
          </div>

          {/* Locker Number & Lock State */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
              <span className="font-mono tabular-nums font-bold text-base text-slate-900 dark:text-slate-100">
                {locker.lockerNumber}
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              {locker.status === 'Available' && (
                <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              {locker.status === 'Occupied' && (
                <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              )}
              {locker.status === 'ExpiringSoon' && (
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              )}
              {locker.status === 'Maintenance' && (
                <Wrench className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              )}
            </div>
          </div>

          {/* Status Text & Occupant Details */}
          <div className="mt-2 space-y-1">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {statusLabel}
            </div>

            {locker.status === 'Available' ? (
              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                کلید در پذیرش موجود است
              </div>
            ) : locker.status === 'Maintenance' ? (
              <div className="text-xs text-rose-600 dark:text-rose-400 truncate">
                {locker.assignedMemberName}
              </div>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {locker.assignedMemberName}
                </div>
                <div className="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                  انقضا: {locker.expiresAtShamsi}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Direct 1-Click Receptionist Action Button on Each Grid Cell */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70">
          {canManageLockers ? (
            locker.status === 'Available' ? (
              <button
                type="button"
                onClick={(e) => handleQuickReserveLocker(locker, e)}
                className="w-full py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                title={`رزرو سریع برای ${quickSelectedMember?.fullName || 'ورزشکار انتخابی'}`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>رزرو سریع کمد</span>
              </button>
            ) : locker.status === 'Occupied' || locker.status === 'ExpiringSoon' ? (
              <button
                type="button"
                onClick={(e) => handleQuickReleaseLocker(locker, e)}
                className="w-full py-1.5 px-2.5 bg-white hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800/70 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>آزادسازی سریع</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => handleQuickReleaseLocker(locker, e)}
                className="w-full py-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>رفع خرابی و فعال‌سازی</span>
              </button>
            )
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              ویژه منشی پذیرش
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Occupancy Summary Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                ویجت نقشه گرافیکی کمدها (Grid) و پنل رزرو / آزادسازی سریع منشی
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              نمای شماتیک رختکن باشگاه در دو ردیف اختصاصی VIP و استاندارد. منشی می‌تواند با یک کلیک هر کمد خالی را برای ورزشکار رزرو کرده یا کمدهای اشغال را آزادسازی کند.
            </p>
          </div>

          {!canManageLockers && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 px-3.5 py-2 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>برای رزرو یا آزادسازی سریع کمد، سطح دسترسی منشی لازم است:</span>
              <button
                type="button"
                onClick={() => onSwitchRole('Receptionist')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-md whitespace-nowrap cursor-pointer"
              >
                ورود به حالت منشی پذیرش
              </button>
            </div>
          )}
        </div>

        {/* Visual Legend & Live Occupancy Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>کمدهای خالی (آماده)</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {availableCount} کمد
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>در اجاره ورزشکار</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {occupiedCount} کمد
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>در آستانه سررسید</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {expiringCount} کمد
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>خراب / تعمیرات</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {maintenanceCount} کمد
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>ضریب اشغال رختکن</span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {occupancyRate}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Receptionist Quick-Assignment Bar (پنل تخصیص سریع منشی) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>تنظیمات رزرو سریع منشی (یک کلیک روی هر کمد خالی در نقشه زیر):</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              ورزشکار و مدت اجاره را انتخاب کنید و سپس روی دکمه «رزرو سریع کمد» در هر خانه کلیک نمایید
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-xs">
            <div className="md:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 mb-1">
                ۱. ورزشکار متقاضی کمد:
              </label>
              <select
                value={quickMemberId}
                onChange={(e) => setQuickMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} — ({m.membershipCode}) {m.lockerNumber !== '-' ? `[کمد فعلی: ${m.lockerNumber}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 mb-1">
                ۲. بازه زمانی قرارداد / سررسید کمد:
              </label>
              <select
                value={quickDurationExpires}
                onChange={(e) => setQuickDurationExpires(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100"
              >
                {RENTAL_DURATIONS.map((d) => (
                  <option key={d.expiresShamsi} value={d.expiresShamsi}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!canManageLockers}
                onClick={() => handleAutoAssignNextAvailable('VIP')}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer text-center"
              >
                تخصیص خودکار اولین VIP خالی
              </button>
              <button
                type="button"
                disabled={!canManageLockers}
                onClick={() => handleAutoAssignNextAvailable('Standard')}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer text-center"
              >
                تخصیص خودکار استاندارد
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Toast Banner */}
        {feedbackToast && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{feedbackToast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              بستن
            </button>
          </div>
        )}

        {/* Filter & Search Bar for the Grid Map */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>فیلتر بخش:</span>
            </div>
            {(
              [
                { id: 'ALL', label: 'همه بخش‌ها' },
                { id: 'VIP', label: 'ردیف VIP' },
                { id: 'Standard', label: 'ردیف استاندارد' },
              ] as const
            ).map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZoneFilter(z.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  zoneFilter === z.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {z.label}
              </button>
            ))}

            <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

            {(
              [
                { id: 'ALL', label: 'همه وضعیت‌ها' },
                { id: 'Available', label: 'فقط خالی' },
                { id: 'Occupied', label: 'اشغال' },
                { id: 'ExpiringSoon', label: 'سررسید نزدیک' },
                { id: 'Maintenance', label: 'تعمیرات' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === s.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی شماره کمد یا نام ورزشکار..."
              className="w-full pr-8 pl-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </section>

      {/* GRAPHICAL LOCKER ROOM GRID MAP (نقشه گرافیکی ردیف‌های رختکن) */}
      <div className="space-y-6">
        {/* Zone 1: VIP Locker Wall Grid */}
        {(zoneFilter === 'ALL' || zoneFilter === 'VIP') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ردیف الف — قفسه‌بندی کمدهای اختصاصی VIP (مجهز به قفل دیجیتال RFID و شارژر)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تعرفه اجاره ماهانه هر واحد: ۶۵۰,۰۰۰ تومان · کدهای VIP-01 تا VIP-08
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                خالی در این ردیف: {vipLockers.filter((l) => l.status === 'Available').length} از{' '}
                {vipLockers.length}
              </span>
            </div>

            {vipLockers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                هیچ کمدی در بخش VIP با فیلتر انتخابی مطابقت ندارد.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {vipLockers.map((locker) => renderLockerDoorCell(locker))}
              </div>
            )}
          </section>
        )}

        {/* Zone 2: Standard Locker Wall Grid */}
        {(zoneFilter === 'ALL' || zoneFilter === 'Standard') && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ردیف ب — قفسه‌بندی کمدهای سالن عمومی استاندارد (بخش A)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تعرفه اجاره ماهانه هر واحد: ۳۰۰,۰۰۰ تومان · کدهای A-10 تا A-17
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                خالی در این ردیف: {standardLockers.filter((l) => l.status === 'Available').length} از{' '}
                {standardLockers.length}
              </span>
            </div>

            {standardLockers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                هیچ کمدی در بخش استاندارد با فیلتر انتخابی مطابقت ندارد.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {standardLockers.map((locker) => renderLockerDoorCell(locker))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Selected Locker Detailed Inspector & Contract Editor */}
      {selectedLocker && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedLocker.lockerNumber}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  پرونده و تنظیمات دستی کمد انتخاب‌شده (بخش {selectedLocker.zone})
                </h4>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-4">
                <span>
                  وضعیت فعلی:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {selectedLocker.status === 'Available'
                      ? 'خالی (آماده واگذاری)'
                      : selectedLocker.status === 'Occupied'
                      ? 'اشغال / در اجاره ورزشکار'
                      : selectedLocker.status === 'ExpiringSoon'
                      ? 'در آستانه سررسید'
                      : 'خراب / در دست تعمیر'}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  تحویل‌گیرنده فعلی:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {selectedLocker.assignedMemberName}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  سررسید: {selectedLocker.expiresAtShamsi}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-xs flex-1 max-w-2xl">
              <div>
                <label className="block text-slate-500 mb-1">انتخاب ورزشکار جهت ثبت قرارداد</label>
                <select
                  value={customMemberId}
                  onChange={(e) => setCustomMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.membershipCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">تاریخ انقضای دلخواه (شمسی)</label>
                <input
                  type="text"
                  value={customExpiresInput}
                  onChange={(e) => setCustomExpiresInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!canManageLockers}
                  onClick={() => {
                    const targetMem =
                      members.find((m) => m.id === customMemberId) || members[0];
                    if (!targetMem) return;
                    onUpdateLocker(selectedLocker.id, {
                      status: 'Occupied',
                      assignedMemberName: targetMem.fullName,
                      assignedMemberCode: targetMem.membershipCode,
                      expiresAtShamsi: customExpiresInput.trim() || '۱۴۰۵/۱۰/۳۰',
                    });
                    showToast(
                      `قرارداد کمد ${selectedLocker.lockerNumber} برای «${targetMem.fullName}» ثبت شد.`
                    );
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  ثبت قرارداد
                </button>

                <button
                  type="button"
                  disabled={!canManageLockers}
                  onClick={() => handleQuickReleaseLocker(selectedLocker)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-slate-200 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  آزادسازی
                </button>

                <button
                  type="button"
                  disabled={!canManageLockers}
                  onClick={() => {
                    onUpdateLocker(selectedLocker.id, {
                      status: 'Maintenance',
                      assignedMemberName: 'قفل در دست تعمیر فنی',
                      assignedMemberCode: '-',
                      expiresAtShamsi: '-',
                    });
                    showToast(
                      `کمد ${selectedLocker.lockerNumber} در وضعیت «تعمیرات فنی» قرار گرفت.`,
                      'info'
                    );
                  }}
                  className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 disabled:opacity-40 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-lg whitespace-nowrap cursor-pointer"
                  title="ثبت خرابی قفل کمد"
                >
                  ثبت خرابی
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
