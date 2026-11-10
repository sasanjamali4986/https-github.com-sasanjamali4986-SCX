import React, { useState } from 'react';
import {
  CalendarCheck,
  Users,
  Sliders,
  Plus,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Dumbbell,
  UserCheck,
  Trash2,
  ShieldAlert,
  X,
} from 'lucide-react';
import { GymClassItem, GymMember, UserRole } from '../data/gymData';

interface ClassBookingAndCoachViewProps {
  classes: GymClassItem[];
  members: GymMember[];
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onBookClassForMember: (classId: string, member: GymMember) => Promise<{
    success: boolean;
    message: string;
  }>;
  onCancelClassBooking: (classId: string, memberId: string) => Promise<void>;
  onUpdateClassCapacity: (classId: string, newCapacity: number) => Promise<void>;
  onToggleClassAttendance: (classId: string, bookingId: string) => void;
  onCreateNewClass: (newClassData: {
    title: string;
    coachName: string;
    scheduleDays: string;
    timeSlot: string;
    hallName: string;
    capacity: number;
    tuitionFee: number;
  }) => Promise<void>;
}

export const ClassBookingAndCoachView: React.FC<ClassBookingAndCoachViewProps> = ({
  classes,
  members,
  currentRole,
  onSwitchRole,
  onBookClassForMember,
  onCancelClassBooking,
  onUpdateClassCapacity,
  onToggleClassAttendance,
  onCreateNewClass,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members[0]?.id || 'mem_1001'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || 'cls_1'
  );
  const [bookingFeedback, setBookingFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Coach Capacity Custom Input State
  const [customCapInputs, setCustomCapInputs] = useState<{ [classId: string]: string }>({});

  // Create New Class Modal State
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCoach, setNewCoach] = useState('استاد سهراب مرادی');
  const [newDays, setNewDays] = useState('شنبه، دوشنبه، چهارشنبه');
  const [newTime, setNewTime] = useState('۱۸:۰۰ تا ۱۹:۳۰');
  const [newHall, setNewHall] = useState('سالن شماره ۱');
  const [newCapacity, setNewCapacity] = useState('20');
  const [newFee, setNewFee] = useState('2500000');

  const canManageCapacity = currentRole === 'Coach' || currentRole === 'SuperAdmin';
  const activeMember =
    members.find((m) => m.id === selectedMemberId) || members[0];
  const selectedClass =
    classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleMemberBookClick = async (cls: GymClassItem) => {
    if (!activeMember) return;

    if (cls.enrolledCount >= cls.capacity) {
      setBookingFeedback({
        type: 'error',
        text: `تکمیل ظرفیت: ظرفیت کلاس «${cls.title}» (${cls.capacity} نفر) به پایان رسیده است. امکان ثبت رزرو جدید وجود ندارد.`,
      });
      return;
    }

    const res = await onBookClassForMember(cls.id, activeMember);
    setBookingFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleCoachCapacityChange = async (cls: GymClassItem, targetCap: number) => {
    if (!canManageCapacity) {
      setBookingFeedback({
        type: 'error',
        text: 'تغییر ظرفیت کلاس‌ها فقط در پنل مربی (Coach) یا مدیر کل امکان‌پذیر است.',
      });
      return;
    }

    const safeCap = Math.max(cls.enrolledCount, Math.max(1, targetCap));
    await onUpdateClassCapacity(cls.id, safeCap);
    setBookingFeedback({
      type: 'success',
      text:
        safeCap === cls.enrolledCount
          ? `ظرفیت کلاس «${cls.title}» روی ${safeCap} نفر تنظیم شد — وضعیت کلاس به صورت خودکار به «تکمیل ظرفیت» تغییر یافت.`
          : `ظرفیت کلاس «${cls.title}» توسط مربی به ${safeCap} نفر بروزرسانی شد (${safeCap - cls.enrolledCount} صندلی خالی).`,
    });
  };

  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await onCreateNewClass({
      title: newTitle.trim(),
      coachName: newCoach,
      scheduleDays: newDays.trim(),
      timeSlot: newTime.trim(),
      hallName: newHall.trim(),
      capacity: Math.max(1, parseInt(newCapacity, 10) || 20),
      tuitionFee: Math.max(0, parseInt(newFee.replace(/\D/g, ''), 10) || 2500000),
    });

    setNewTitle('');
    setShowNewClassModal(false);
    setBookingFeedback({
      type: 'success',
      text: 'کلاس جدید با موفقیت در تقویم باشگاه و پنل رزرو اعضا ثبت گردید.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Status & Role Banner */}
      {bookingFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-medium ${
            bookingFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {bookingFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{bookingFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBookingFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: MEMBER CLASS BOOKING PANEL */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-500" />
              <span>پنل رزرو آنلاین کلاس‌ها ویژه ورزشکاران (Member Booking)</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              ورزشکاران می‌توانند کلاس مورد نظر خود را رزرو کنند. در صورت پر شدن ظرفیت، سیستم به صورت خودکار پیام «تکمیل ظرفیت» را نمایش داده و رزرو را مسدود می‌کند.
            </p>
          </div>

          {/* Active Member Selector for Booking */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shrink-0">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              رزرو برای ورزشکار:
            </span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.membershipCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Classes Booking Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const isFull = cls.enrolledCount >= cls.capacity;
            const remainingSeats = Math.max(0, cls.capacity - cls.enrolledCount);
            const isAlreadyBooked = cls.enrolledMembers.some(
              (b) => b.memberId === activeMember?.id
            );
            const fillPercent = Math.min(
              100,
              Math.round((cls.enrolledCount / Math.max(1, cls.capacity)) * 100)
            );

            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`p-5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                  isFull
                    ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/15'
                    : selectedClassId === cls.id
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {cls.title}
                    </h3>
                    {isFull ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap shrink-0 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        تکمیل ظرفیت
                      </span>
                    ) : (
                      <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap shrink-0">
                        {remainingSeats} صندلی خالی
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <span>{cls.coachName}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{cls.hallName}</span>
                  </div>

                  <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {cls.scheduleDays} · ساعت {cls.timeSlot}
                  </div>

                  {/* Automatic "تکمیل ظرفیت" Banner when full */}
                  {isFull && (
                    <div className="p-2.5 bg-rose-100/80 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 rounded-lg text-xs text-rose-900 dark:text-rose-200 font-medium flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>تکمیل ظرفیت — ثبت‌نام جدید بسته شده است</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-slate-500 dark:text-slate-400">وضعیت ظرفیت کلاس:</span>
                      <span
                        className={`font-bold ${
                          isFull
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {cls.enrolledCount} از {cls.capacity} نفر ({fillPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isFull
                            ? 'bg-rose-500'
                            : remainingSeats <= 2
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {cls.tuitionFee.toLocaleString('fa-IR')} تومان
                    </span>

                    {isAlreadyBooked ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          رزرو شده ✓
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMember) {
                              onCancelClassBooking(cls.id, activeMember.id);
                              setBookingFeedback({
                                type: 'success',
                                text: `رزرو ${activeMember.fullName} در کلاس «${cls.title}» لغو شد و ۱ ظرفیت آزاد گردید.`,
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-md transition-colors cursor-pointer"
                        >
                          لغو رزرو
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isFull}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMemberBookClick(cls);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          isFull
                            ? 'bg-rose-600/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                        }`}
                      >
                        {isFull ? 'تکمیل ظرفیت' : 'رزرو آنلاین کلاس'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: COACH CAPACITY MANAGEMENT & CLASS ROSTER PANEL */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-500" />
              <span>پنل مربیان: مدیریت ظرفیت کلاس‌ها و لیست حضور و غیاب (Coach Panel)</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              مربیان می‌توانند سقف ظرفیت هر کلاس را افزایش یا کاهش دهند، کلاس را در وضعیت «تکمیل ظرفیت» قرار دهند یا کلاس جدید تعریف نمایند.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!canManageCapacity && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-3 py-1.5 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>برای ویرایش ظرفیت، نقش مربی را فعال کنید:</span>
                <button
                  type="button"
                  onClick={() => onSwitchRole('Coach')}
                  className="underline font-bold cursor-pointer"
                >
                  ورود به حالت مربی (Coach)
                </button>
              </div>
            )}

            {canManageCapacity && (
              <button
                type="button"
                onClick={() => setShowNewClassModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف کلاس جدید توسط مربی</span>
              </button>
            )}
          </div>
        </div>

        {/* Coach Capacity Control Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3">نام کلاس و مربی</th>
                <th className="py-3 px-3">روز و ساعت برگزاری</th>
                <th className="py-3 px-3 text-left">ثبت‌نام‌شده</th>
                <th className="py-3 px-3 text-left">ظرفیت مجاز</th>
                <th className="py-3 px-3">وضعیت فعلی</th>
                <th className="py-3 px-3">مدیریت ظرفیت در پنل مربی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
              {classes.map((cls) => {
                const isFull = cls.enrolledCount >= cls.capacity;
                const inputVal =
                  customCapInputs[cls.id] !== undefined
                    ? customCapInputs[cls.id]
                    : String(cls.capacity);

                return (
                  <tr
                    key={cls.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {cls.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cls.coachName} · {cls.hallName}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {cls.scheduleDays} ({cls.timeSlot})
                    </td>

                    <td className="py-3.5 px-3 text-left font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {cls.enrolledCount} نفر
                    </td>

                    <td className="py-3.5 px-3 text-left font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {cls.capacity} نفر
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-xs">
                      {isFull ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          تکمیل ظرفیت
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          باز ({cls.capacity - cls.enrolledCount} جا خالی)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!canManageCapacity || cls.capacity <= cls.enrolledCount}
                          onClick={() => handleCoachCapacityChange(cls, cls.capacity - 1)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold rounded-md cursor-pointer"
                          title="کاهش ۱ نفری ظرفیت"
                        >
                          -1
                        </button>

                        <button
                          type="button"
                          disabled={!canManageCapacity}
                          onClick={() => handleCoachCapacityChange(cls, cls.capacity + 1)}
                          className="px-2.5 py-1 bg-emerald-600/15 hover:bg-emerald-600/25 disabled:opacity-40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded-md cursor-pointer"
                          title="افزایش ۱ نفری ظرفیت"
                        >
                          +1
                        </button>

                        <button
                          type="button"
                          disabled={!canManageCapacity}
                          onClick={() => handleCoachCapacityChange(cls, cls.capacity + 5)}
                          className="px-2.5 py-1 bg-emerald-600/15 hover:bg-emerald-600/25 disabled:opacity-40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded-md cursor-pointer"
                          title="افزایش ۵ نفری ظرفیت"
                        >
                          +5
                        </button>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={cls.enrolledCount}
                            max={500}
                            disabled={!canManageCapacity}
                            value={inputVal}
                            onChange={(e) =>
                              setCustomCapInputs((prev) => ({
                                ...prev,
                                [cls.id]: e.target.value,
                              }))
                            }
                            className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-mono tabular-nums text-center text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            disabled={!canManageCapacity}
                            onClick={() =>
                              handleCoachCapacityChange(
                                cls,
                                parseInt(inputVal, 10) || cls.capacity
                              )
                            }
                            className="px-2.5 py-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs rounded-md cursor-pointer"
                          >
                            ثبت ظرفیت
                          </button>
                        </div>

                        {!isFull && (
                          <button
                            type="button"
                            disabled={!canManageCapacity || cls.enrolledCount === 0}
                            onClick={() => handleCoachCapacityChange(cls, cls.enrolledCount)}
                            className="px-2.5 py-1 bg-rose-600/15 hover:bg-rose-600/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-medium rounded-md cursor-pointer"
                          >
                            اعلام تکمیل ظرفیت
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: SELECTED CLASS ROSTER, ATTENDANCE & WORKOUT/DIET PLAN */}
      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Class Roster & Coach Attendance Check */}
          <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>لیست ورزشکاران رزروکننده — {selectedClass.title}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ثبت حضور و غیاب کلاسی توسط مربی یا لغو رزرو و آزادسازی ظرفیت
                </p>
              </div>
              <span className="font-mono tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {selectedClass.enrolledCount}/{selectedClass.capacity}
              </span>
            </div>

            {selectedClass.enrolledMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                هنوز رزروی در لیست آنلاین این کلاس ثبت نشده است.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {selectedClass.enrolledMembers.map((entry) => (
                  <div
                    key={entry.id}
                    className="py-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {entry.memberName}
                      </div>
                      <div className="font-mono tabular-nums text-slate-500 mt-0.5">
                        {entry.membershipCode} · رزرو: {entry.bookedAtShamsi}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleClassAttendance(selectedClass.id, entry.id)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                          entry.attended
                            ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{entry.attended ? 'حاضر در کلاس' : 'ثبت حضور'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onCancelClassBooking(selectedClass.id, entry.memberId)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md cursor-pointer"
                        title="حذف رزرو و آزادسازی ۱ صندلی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Workout & Diet Plan for Selected Class */}
          <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-500" />
                <span>برنامه تمرینی و غذایی دوره — {selectedClass.coachName}</span>
              </h3>
            </div>

            <div className="space-y-4">
              {selectedClass.workoutRoutine.map((routine) => (
                <div key={routine.dayTitle} className="space-y-2">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {routine.dayTitle}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                          <th className="py-2 px-2">حرکت تمرینی</th>
                          <th className="py-2 px-2">ست و تکرار</th>
                          <th className="py-2 px-2">تمپو</th>
                          <th className="py-2 px-2">توضیحات فنی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                        {routine.exercises.map((ex) => (
                          <tr key={ex.move}>
                            <td className="py-2 px-2 font-semibold text-slate-900 dark:text-slate-100">
                              {ex.move}
                            </td>
                            <td className="py-2 px-2 font-mono tabular-nums">{ex.sets}</td>
                            <td className="py-2 px-2 font-mono tabular-nums">{ex.tempo}</td>
                            <td className="py-2 px-2 text-slate-500 dark:text-slate-400">
                              {ex.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Modal: Create New Class in Coach Panel */}
      {showNewClassModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                تعریف کلاس جدید و تعیین ظرفیت توسط مربی
              </h3>
              <button
                type="button"
                onClick={() => setShowNewClassModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  عنوان کلاس ورزشی *
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: پیلاتس اصلاحی و شکم‌پهلو"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    مربی کلاس *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={newCoach}
                    onChange={(e) => setNewCoach(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    سالن برگزاری *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={newHall}
                    onChange={(e) => setNewHall(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    روزهای هفته *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ساعت برگزاری *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ظرفیت مجاز سالن (نفر) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    شهریه دوره (تومان) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewClassModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  ثبت کلاس در تقویم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
