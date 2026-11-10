import React, { useState } from 'react';
import {
  UserPlus,
  QrCode,
  RefreshCw,
  Search,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { GymMember, UserRole } from '../data/gymData';

interface MembersAndCardsViewProps {
  members: GymMember[];
  currentRole: UserRole;
  onAddMember: (newMember: Omit<GymMember, 'id'>) => Promise<void>;
  onRenewMember: (member: GymMember, addedSessions: number, amountTomans: number) => Promise<void>;
  onSelectForScanner: (membershipCode: string) => void;
}

const PLAN_OPTIONS = [
  { title: 'بدنسازی VIP + هوازی (۱۶ جلسه)', sessions: 16, price: 2850000 },
  { title: 'بدنسازی عمومی (۱۲ جلسه)', sessions: 12, price: 1850000 },
  { title: 'کراس‌فیت و TRX تخصصی (۱۲ جلسه)', sessions: 12, price: 2400000 },
  { title: 'پیلاتس و استخر (۲۰ جلسه)', sessions: 20, price: 3400000 },
  { title: 'بوکس و هنرهای رزمی (۱۶ جلسه)', sessions: 16, price: 2600000 },
  { title: 'اشتراک ماهانه نامحدود VIP (۳۰ جلسه)', sessions: 30, price: 4200000 },
];

export const MembersAndCardsView: React.FC<MembersAndCardsViewProps> = ({
  members,
  currentRole,
  onAddMember,
  onRenewMember,
  onSelectForScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Low' | 'Expired'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCardMember, setSelectedCardMember] = useState<GymMember | null>(null);

  // Add Member Form State (synced with firebase-blueprint.json constraints)
  const [fullName, setFullName] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState<GymMember['bloodType']>('O+');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [coachName, setCoachName] = useState('استاد سهراب مرادی');
  const [lockerNumber, setLockerNumber] = useState('A-14');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManageMembers = currentRole === 'SuperAdmin' || currentRole === 'Receptionist';

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !searchQuery.trim() ||
      m.fullName.includes(searchQuery.trim()) ||
      m.nationalCode.includes(searchQuery.trim()) ||
      m.phone.includes(searchQuery.trim()) ||
      m.membershipCode.toLowerCase().includes(searchQuery.trim().toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'Active') return m.status === 'Active' && m.remainingSessions > 3;
    if (statusFilter === 'Low') return m.status === 'Active' && m.remainingSessions <= 3;
    if (statusFilter === 'Expired') return m.status === 'Expired' || m.remainingSessions === 0;
    return true;
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canManageMembers) {
      setFormError('فقط مدیر کل یا منشی پذیرش مجاز به ثبت‌نام ورزشکار جدید هستند.');
      return;
    }

    const cleanName = fullName.trim();
    const cleanNational = nationalCode.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setFormError('نام و نام خانوادگی باید بین ۲ تا ۸۰ کاراکتر باشد.');
      return;
    }
    if (!/^[0-9]{10}$/.test(cleanNational)) {
      setFormError('کد ملی باید دقیقاً ۱۰ رقم عددی معتبر باشد (مثال: 0018492031).');
      return;
    }
    if (!/^09[0-9]{9}$/.test(cleanPhone)) {
      setFormError('شماره موبایل باید ۱۱ رقم و با پیش‌شماره 09 آغاز شود (مثال: 09123456789).');
      return;
    }

    const chosenPlan = PLAN_OPTIONS[selectedPlanIndex] || PLAN_OPTIONS[0];
    const nextCodeNum = 1001 + members.length;
    const generatedCode = `GYM-1405-${nextCodeNum}`;

    setIsSaving(true);
    try {
      await onAddMember({
        fullName: cleanName,
        nationalCode: cleanNational,
        phone: cleanPhone,
        membershipCode: generatedCode,
        bloodType,
        medicalNotes: medicalNotes.trim().slice(0, 300) || 'بدون سابقه بیماری یا آسیب خاص',
        planTitle: chosenPlan.title,
        coachName,
        totalSessions: chosenPlan.sessions,
        remainingSessions: chosenPlan.sessions,
        expirationDate: '2026-12-30',
        expirationShamsi: '۱۴۰۵/۱۰/۰۹',
        status: 'Active',
        lockerNumber: lockerNumber.trim().slice(0, 16) || '-',
      });

      setFullName('');
      setNationalCode('');
      setPhone('');
      setMedicalNotes('');
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err?.message || 'خطا در ثبت اطلاعات ورزشکار جدید.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              مدیریت پرونده ورزشکاران، اشتراک‌ها و صدور کارت بارکد دیجیتال
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              مشاهده مشخصات فردی، کد ملی، گروه خونی، سوابق آسیب‌های ورزشی، جلسات باقی‌مانده و کارت دیجیتال QR/Barcode
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>ثبت‌نام ورزشکار جدید و صدور بارکد</span>
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، کد ملی، موبایل یا بارکد..."
              className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(
              [
                { id: 'ALL', label: 'همه اعضا' },
                { id: 'Active', label: 'اشتراک فعال' },
                { id: 'Low', label: 'در آستانه اتمام (≤۳ جلسه)' },
                { id: 'Expired', label: 'منقضی / ۰ جلسه' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* High-Density Members Data Grid */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3">نام ورزشکار و پرونده پزشکی</th>
                <th className="py-3 px-3">کد ملی / موبایل</th>
                <th className="py-3 px-3">بارکد دیجیتال</th>
                <th className="py-3 px-3">دوره و مربی</th>
                <th className="py-3 px-3 text-left">اعتبار جلسات</th>
                <th className="py-3 px-3">تاریخ انقضا</th>
                <th className="py-3 px-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
              {filteredMembers.map((member) => {
                const isExhausted = member.remainingSessions <= 0 || member.status === 'Expired';
                const isLow = !isExhausted && member.remainingSessions <= 3;

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {member.fullName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>گروه خونی {member.bloodType}</span>
                        <span aria-hidden="true"> · </span>
                        <span>کمد {member.lockerNumber}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{member.medicalNotes}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div>{member.nationalCode}</div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">{member.phone}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono tabular-nums text-xs text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {member.membershipCode}
                    </td>

                    <td className="py-3.5 px-3 text-xs">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {member.planTitle}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {member.coachName}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-left font-mono tabular-nums whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {member.remainingSessions} / {member.totalSessions} جلسه
                      </div>
                      <div className="text-xs mt-0.5">
                        {isExhausted ? (
                          <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            نیازمند تمدید
                          </span>
                        ) : isLow ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            رو به اتمام
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            فعال
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {member.expirationShamsi}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCardMember(member)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>کارت دیجیتال</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRenewMember(member, 16, 2850000)}
                          className="px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>تمدید (+۱۶)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectForScanner(member.membershipCode)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          ارسال به گیت
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Register New Gym Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                ثبت‌نام ورزشکار جدید و صدور اشتراک باشگاهی
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/50 border border-rose-700 text-rose-200 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی ورزشکار *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: بهراد محمدی"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    کد ملی ۱۰ رقمی (بدون خط تیره) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={nationalCode}
                    onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="0018492031"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    شماره موبایل (جهت پیامک تمدید) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    گروه خونی و شماره کمد
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value as GymMember['bloodType'])}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      maxLength={16}
                      value={lockerNumber}
                      onChange={(e) => setLockerNumber(e.target.value)}
                      placeholder="کمد: A-14"
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    انتخاب دوره اشتراک *
                  </label>
                  <select
                    value={selectedPlanIndex}
                    onChange={(e) => setSelectedPlanIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {PLAN_OPTIONS.map((p, idx) => (
                      <option key={p.title} value={idx}>
                        {p.title} — {p.price.toLocaleString('fa-IR')} تومان
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    مربی مسئول برنامه
                  </label>
                  <select
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="استاد سهراب مرادی">استاد سهراب مرادی (بدنسازی)</option>
                    <option value="مربی نیلوفر رحیمی">مربی نیلوفر رحیمی (TRX و پیلاتس)</option>
                    <option value="استاد بهرام افشار">استاد بهرام افشار (بوکس و رزمی)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  سوابق پزشکی / آسیب‌های فیزیکی قبلی (حداکثر ۳۰۰ کاراکتر)
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="مثال: دیسک خفیف کمر یا بدون محدودیت پزشکی"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isSaving ? 'در حال ثبت...' : 'ثبت نهایی و صدور کارت عضویت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Digital Barcode / QR Membership Card */}
      {selectedCardMember && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-base font-bold text-emerald-400">PARSGYM PRO CLUB</div>
                <div className="text-xs text-slate-400">کارت هوشمند تردد و عضویت باشگاهی</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardMember(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">نام ورزشکار:</span>
                <span className="font-bold text-sm text-white">{selectedCardMember.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">کد ملی / گروه خونی:</span>
                <span className="font-mono tabular-nums">
                  {selectedCardMember.nationalCode} · {selectedCardMember.bloodType}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">دوره فعال:</span>
                <span>{selectedCardMember.planTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">جلسات باقی‌مانده:</span>
                <span className="font-mono tabular-nums font-bold text-emerald-400">
                  {selectedCardMember.remainingSessions} از {selectedCardMember.totalSessions} جلسه
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">تاریخ انقضا:</span>
                <span className="font-mono tabular-nums">{selectedCardMember.expirationShamsi}</span>
              </div>
            </div>

            {/* Visual 1D Barcode & Code */}
            <div className="bg-white text-slate-950 rounded-lg p-4 flex flex-col items-center justify-center">
              <svg
                className="w-full h-14"
                viewBox="0 0 240 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {[
                  4, 10, 14, 22, 28, 32, 40, 46, 54, 58, 66, 74, 80, 86, 92, 100, 106, 114, 120,
                  128, 134, 142, 148, 156, 162, 170, 176, 184, 192, 198, 206, 212, 220, 228, 234,
                ].map((x, idx) => (
                  <rect
                    key={x}
                    x={x}
                    y="2"
                    width={idx % 3 === 0 ? '4' : idx % 2 === 0 ? '2' : '3'}
                    height="46"
                    fill="#0F172A"
                  />
                ))}
              </svg>
              <div className="font-mono tabular-nums font-bold text-sm tracking-widest mt-1.5">
                {selectedCardMember.membershipCode}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onSelectForScanner(selectedCardMember.membershipCode);
                  setSelectedCardMember(null);
                }}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                اسکن مستقیم در گیت پذیرش
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ کارت</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
