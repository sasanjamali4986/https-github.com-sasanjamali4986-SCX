import React, { useState } from 'react';
import axios from 'axios';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Users,
  CheckCircle2,
  ShieldAlert,
  X,
} from 'lucide-react';
import { GymClub, UserRole } from '../data/gymData';

interface ClubsManagementViewProps {
  clubs: GymClub[];
  selectedClubCode: string;
  onSelectClub: (code: string) => void;
  currentRole: UserRole;
  onSwitchToSuperAdmin: () => void;
  onClubCreated: (newClub: GymClub) => Promise<void>;
}

const CLUB_TYPE_LABELS: Record<GymClub['clubType'], string> = {
  Bodybuilding: 'بدنسازی، فیتنس و کراس‌فیت',
  MultiPurpose: 'مجموعه ورزشی چندمنظوره',
  MartialArts: 'آکادمی بوکس و هنرهای رزمی',
  PoolSpa: 'استخر، سونا و مجموعه آبی',
  WomenOnly: 'باشگاه تخصصی ویژه بانوان',
};

export const ClubsManagementView: React.FC<ClubsManagementViewProps> = ({
  clubs,
  selectedClubCode,
  onSelectClub,
  currentRole,
  onSwitchToSuperAdmin,
  onClubCreated,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [clubType, setClubType] = useState<GymClub['clubType']>('Bodybuilding');
  const [city, setCity] = useState('تهران');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [capacity, setCapacity] = useState('300');
  const [status, setStatus] = useState<GymClub['status']>('Active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const isSuperAdmin = currentRole === 'SuperAdmin';

  const openCreateModalWithDefaults = () => {
    setFormError(null);
    setCode(`CLUB-${101 + clubs.length}`);
    setShowCreateModal(true);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isSuperAdmin) {
      setFormError('فقط مدیر کل (Super Admin) مجوز تعریف باشگاه جدید را دارد.');
      return;
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const cleanCity = city.trim();
    const cleanAddress = address.trim();
    const cleanPhone = phone.trim();
    const cleanManager = managerName.trim();
    const numericCapacity = Math.min(5000, Math.max(10, parseInt(capacity, 10) || 250));

    if (cleanName.length < 2) {
      setFormError('نام باشگاه باید حداقل ۲ کاراکتر باشد.');
      return;
    }
    if (cleanCode.length < 3) {
      setFormError('کد اختصاصی باشگاه باید حداقل ۳ کاراکتر انگلیسی/عددی باشد (مثلاً CLUB-104).');
      return;
    }
    if (cleanAddress.length < 4) {
      setFormError('لطفاً آدرس دقیق باشگاه را وارد نمایید.');
      return;
    }
    if (cleanPhone.length < 8) {
      setFormError('لطفاً شماره تماس معتبر باشگاه را وارد نمایید (مثلاً 02122334455).');
      return;
    }
    if (cleanManager.length < 2) {
      setFormError('لطفاً نام مدیر داخلی باشگاه را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/clubs', {
        role: currentRole,
        name: cleanName,
        code: cleanCode,
        clubType,
        city: cleanCity,
        address: cleanAddress,
        phone: cleanPhone,
        managerName: cleanManager,
        capacity: numericCapacity,
        status,
      });

      const createdClub: GymClub = response.data.club;
      await onClubCreated(createdClub);

      setSuccessBanner(response.data.message || `باشگاه «${createdClub.name}» با موفقیت ثبت شد.`);
      setTimeout(() => setSuccessBanner(null), 5000);

      setName('');
      setAddress('');
      setPhone('');
      setManagerName('');
      setShowCreateModal(false);
      onSelectClub(createdClub.code);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'خطا در تعریف باشگاه جدید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              مدیریت باشگاه‌ها، شعب و تعریف باشگاه ورزشی جدید
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              مدیر کل (Super Admin) می‌تواند باشگاه‌ها و شعب جدید (بدنسازی، رزمی، استخر، چندمنظوره و بانوان) را در سامانه تعریف و فعال نماید.
            </p>
          </div>

          {isSuperAdmin ? (
            <button
              type="button"
              onClick={openCreateModalWithDefaults}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>تعریف باشگاه جدید</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 px-3.5 py-2 rounded-lg text-xs text-amber-800 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>تعریف باشگاه جدید ویژه «مدیر کل» است.</span>
              <button
                type="button"
                onClick={onSwitchToSuperAdmin}
                className="underline font-bold hover:text-amber-950 dark:hover:text-white cursor-pointer whitespace-nowrap"
              >
                تغییر به نقش مدیر کل
              </button>
            </div>
          )}
        </div>

        {successBanner && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((club) => {
            const isSelected = club.code === selectedClubCode;
            return (
              <div
                key={club.id}
                onClick={() => onSelectClub(club.code)}
                className={`p-5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {club.code}
                    </span>
                    <span>
                      {club.status === 'Active' ? 'فعال' : 'در حال تجهیز'} · ثبت: {club.createdShamsi}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {club.name}
                  </h3>

                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    نوع مجموعه: <strong className="font-medium">{CLUB_TYPE_LABELS[club.clubType]}</strong>
                  </div>

                  <div className="pt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {club.city} — {club.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{club.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        مدیر شعبه: {club.managerName} · ظرفیت:{' '}
                        <span className="font-mono tabular-nums">{club.capacity}</span> نفر
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isSelected ? 'شعبه فعال در داشبورد' : 'برای انتخاب کلیک کنید'}
                  </span>
                  <span
                    className={`font-semibold ${
                      isSelected
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isSelected ? 'انتخاب‌شده ✓' : 'انتخاب این باشگاه'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal: Define New Gym / Club (SuperAdmin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  تعریف باشگاه / شعبه ورزشی جدید توسط مدیر کل
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateClub} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    نام کامل باشگاه / مجموعه ورزشی *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: باشگاه بدنسازی و فیتنس البرز (شعبه ونک)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    کد اختصاصی باشگاه *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={24}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CLUB-104"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    نوع و کاربری باشگاه *
                  </label>
                  <select
                    value={clubType}
                    onChange={(e) => setClubType(e.target.value as GymClub['clubType'])}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Bodybuilding">بدنسازی، فیتنس و کراس‌فیت</option>
                    <option value="MultiPurpose">مجموعه ورزشی چندمنظوره</option>
                    <option value="MartialArts">آکادمی بوکس و هنرهای رزمی</option>
                    <option value="PoolSpa">استخر، سونا و مجموعه آبی</option>
                    <option value="WomenOnly">باشگاه تخصصی ویژه بانوان</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    نام مدیر داخلی باشگاه *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="مثال: مهندس کاوه رضایی"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    شهر *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="تهران"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    تلفن تماس باشگاه *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="02188776655"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ظرفیت کل روزانه (نفر)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    نشانی دقیق پستی *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="میدان ونک، خیابان ملاصدرا، پلاک ۱۱۸"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت بهره‌برداری
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GymClub['status'])}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Active">فعال و آماده پذیرش</option>
                    <option value="Maintenance">در حال تجهیز / تعمیرات</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'در حال ثبت باشگاه...' : 'ثبت نهایی و ایجاد باشگاه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
