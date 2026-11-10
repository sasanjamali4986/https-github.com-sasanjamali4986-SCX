import React, { useState } from 'react';
import {
  KeyRound,
  ShoppingBag,
  Dumbbell,
  Wallet,
  MessageSquare,
  BarChart3,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';
import {
  LockerItem,
  CanteenProduct,
  GymClassItem,
  FinancialRecord,
  SmsLogItem,
  GymMember,
  UserRole,
  PEAK_HOURS_DATA,
} from '../data/gymData';
import { ClassBookingAndCoachView } from './ClassBookingAndCoachView';
import { LockerGridMapWidget } from './LockerGridMapWidget';

interface OperationsHubViewProps {
  activeSubTab: 'LOCKERS' | 'CANTEEN' | 'CLASSES' | 'FINANCIAL_SMS';
  onChangeSubTab: (tab: 'LOCKERS' | 'CANTEEN' | 'CLASSES' | 'FINANCIAL_SMS') => void;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  lockers: LockerItem[];
  onUpdateLocker: (lockerId: string, updates: Partial<LockerItem>) => void;
  canteenProducts: CanteenProduct[];
  onCheckoutCanteenPos: (
    cartItems: { product: CanteenProduct; qty: number }[],
    paymentGateway: FinancialRecord['paymentGateway'],
    buyerName: string
  ) => Promise<void>;
  classes: GymClassItem[];
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
  transactions: FinancialRecord[];
  onAddTransaction: (tx: Omit<FinancialRecord, 'id'>) => Promise<void>;
  smsLogs: SmsLogItem[];
  onSendSms: (sms: Omit<SmsLogItem, 'id' | 'sentAtShamsi' | 'deliveryStatus'>) => void;
  members: GymMember[];
}

export const OperationsHubView: React.FC<OperationsHubViewProps> = ({
  activeSubTab,
  onChangeSubTab,
  currentRole,
  onSwitchRole,
  lockers,
  onUpdateLocker,
  canteenProducts,
  onCheckoutCanteenPos,
  classes,
  onBookClassForMember,
  onCancelClassBooking,
  onUpdateClassCapacity,
  onToggleClassAttendance,
  onCreateNewClass,
  transactions,
  onAddTransaction,
  smsLogs,
  onSendSms,
  members,
}) => {
  // Locker assignment state
  const [selectedLocker, setSelectedLocker] = useState<LockerItem | null>(null);
  const [lockerMemberName, setLockerMemberName] = useState('آرش کریمی');
  const [lockerExpires, setLockerExpires] = useState('۱۴۰۵/۱۱/۳۰');

  // Canteen POS cart state
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [posGateway, setPosGateway] = useState<FinancialRecord['paymentGateway']>('POS');
  const [posBuyer, setPosBuyer] = useState('فروش حضوری بوفه');
  const [posNotice, setPosNotice] = useState<string | null>(null);

  // Classes & Workout selector
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls_1');

  // Financial & Discount state
  const [txTitle, setTxTitle] = useState('');
  const [txType, setTxType] = useState<'Income' | 'Expense'>('Income');
  const [txCategory, setTxCategory] = useState<FinancialRecord['category']>('Tuition');
  const [txAmount, setTxAmount] = useState('2850000');
  const [txDiscountCode, setTxDiscountCode] = useState('');
  const [txGateway, setTxGateway] = useState<FinancialRecord['paymentGateway']>('ZarinPal');
  const [txMemberName, setTxMemberName] = useState('آرش کریمی');

  // SMS Composer state
  const [smsRecipientName, setSmsRecipientName] = useState('سارا نادری');
  const [smsRecipientPhone, setSmsRecipientPhone] = useState('09129876543');
  const [smsProvider, setSmsProvider] = useState<SmsLogItem['provider']>('Kavenegar');
  const [smsTemplate, setSmsTemplate] = useState<SmsLogItem['templateType']>('RenewalWarning');
  const [smsBody, setSmsBody] = useState(
    'ورزشکار گرامی، تنها ۳ روز تا پایان اعتبار اشتراک باشگاهی شما باقی مانده است. لینک تمدید زرین‌پال: parsgym.ir/renew'
  );

  // Cart helpers
  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const clearCart = () => setCart({});

  const cartEntries = Object.entries(cart)
    .map(([id, qty]) => {
      const product = canteenProducts.find((p) => p.id === id);
      return product && qty > 0 ? { product, qty } : null;
    })
    .filter(Boolean) as { product: CanteenProduct; qty: number }[];

  const cartTotal = cartEntries.reduce((acc, item) => acc + item.product.price * item.qty, 0);

  const handlePosCheckout = async () => {
    if (cartEntries.length === 0) return;
    await onCheckoutCanteenPos(cartEntries, posGateway, posBuyer);
    setCart({});
    setPosNotice('فاکتور بوفه تسویه شد، موجودی انبار کسر گردید و سند مالی ثبت شد.');
    setTimeout(() => setPosNotice(null), 4000);
  };

  // Financial summary calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const handleCreateFinancialRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawNumeric = Math.max(0, parseInt(txAmount.replace(/\D/g, ''), 10) || 0);
    if (!txTitle.trim() || rawNumeric <= 0) return;

    const cleanDiscount = txDiscountCode.trim().toUpperCase();
    const discountMultiplier =
      cleanDiscount === 'NOROOZ20' ? 0.8 : cleanDiscount === 'HERO15' ? 0.85 : 1;
    const finalAmount = Math.round(rawNumeric * discountMultiplier);
    const vat = txType === 'Income' ? Math.round(finalAmount * 0.1) : 0;

    await onAddTransaction({
      title: txTitle.trim().slice(0, 100),
      category: txCategory,
      type: txType,
      amount: finalAmount,
      taxAmount: vat,
      discountCode: cleanDiscount || '-',
      paymentGateway: txGateway,
      trackingCode: `${txGateway.slice(0, 3).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`,
      memberName: txMemberName.trim().slice(0, 80) || 'عمومی',
      dateShamsi: '۱۴۰۵/۰۸/۱۸',
    });

    setTxTitle('');
    setTxDiscountCode('');
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChangeSubTab('LOCKERS')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeSubTab === 'LOCKERS'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>نقشه کمدها و قرارداد اجاره</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('CANTEEN')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeSubTab === 'CANTEEN'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>بوفه، مکمل و صندوق فروش (POS)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('CLASSES')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeSubTab === 'CLASSES'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>کلاس‌ها، مربیان و برنامه تمرینی/غذایی</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('FINANCIAL_SMS')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeSubTab === 'FINANCIAL_SMS'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>امور مالی، درگاه زرین‌پال، پیامک و آمار</span>
        </button>
      </div>

      {/* 1. VISUAL GRAPHICAL LOCKER GRID MAP WIDGET */}
      {activeSubTab === 'LOCKERS' && (
        <LockerGridMapWidget
          lockers={lockers}
          members={members}
          currentRole={currentRole}
          onSwitchRole={onSwitchRole}
          onUpdateLocker={onUpdateLocker}
        />
      )}

      {/* 2. CANTEEN POS & INVENTORY */}
      {activeSubTab === 'CANTEEN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              موجودی انبار بوفه، مکمل‌های ورزشی و نوشیدنی‌ها
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              کالاهای با موجودی کمتر از حد مجاز با هشدار کسری انبار مشخص شده‌اند. برای افزودن به فاکتور فروش فوری کلیک کنید.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-3">نام کالا / مکمل</th>
                    <th className="py-3 px-3">دسته‌بندی</th>
                    <th className="py-3 px-3 text-left">قیمت واحد (تومان)</th>
                    <th className="py-3 px-3 text-left">موجودی انبار</th>
                    <th className="py-3 px-3">افزودن به صندوق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
                  {canteenProducts.map((item) => {
                    const isLowStock = item.stock <= item.minStockThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 text-left font-mono tabular-nums text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {item.price.toLocaleString('fa-IR')}
                        </td>
                        <td className="py-3 px-3 text-left font-mono tabular-nums text-xs">
                          <span
                            className={
                              isLowStock
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }
                          >
                            {item.stock} {item.unit}
                          </span>
                          {isLowStock && (
                            <span className="mr-2 text-amber-600 dark:text-amber-400 text-xs">
                              (هشدار کسری)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            disabled={item.stock <= 0}
                            onClick={() => addToCart(item.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>افزودن به فاکتور</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  صندوق فروش سریع بوفه (POS)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تسویه آنی کارتخوان بانکی یا نقدی و کسر از کاردکس انبار
                </p>
              </div>

              {posNotice && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-700 text-emerald-200 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{posNotice}</span>
                </div>
              )}

              {cartEntries.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  سبد فروش بوفه خالی است. از جدول روبرو کالا انتخاب نمایید.
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {cartEntries.map(({ product, qty }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-2 border-b border-slate-200/70 dark:border-slate-800/70"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {product.name}
                        </div>
                        <div className="text-slate-500 font-mono tabular-nums">
                          {qty} × {product.price.toLocaleString('fa-IR')} ت
                        </div>
                      </div>
                      <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        {(product.price * qty).toLocaleString('fa-IR')} ت
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">نام خریدار</label>
                  <input
                    type="text"
                    value={posBuyer}
                    onChange={(e) => setPosBuyer(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">روش پرداخت</label>
                  <select
                    value={posGateway}
                    onChange={(e) =>
                      setPosGateway(e.target.value as FinancialRecord['paymentGateway'])
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                  >
                    <option value="POS">کارتخوان (POS)</option>
                    <option value="ZarinPal">درگاه زرین‌پال</option>
                    <option value="Cash">نقدی</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-1">
                <span>جمع کل قابل پرداخت:</span>
                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {cartTotal.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={cartEntries.length === 0}
                  onClick={handlePosCheckout}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  ثبت فروش و چاپ رسید
                </button>
                {cartEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="py-2.5 px-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                  >
                    پاک‌سازی
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 3. CLASSES, COACH CAPACITY & MEMBER BOOKING */}
      {activeSubTab === 'CLASSES' && (
        <ClassBookingAndCoachView
          classes={classes}
          members={members}
          currentRole={currentRole}
          onSwitchRole={onSwitchRole}
          onBookClassForMember={onBookClassForMember}
          onCancelClassBooking={onCancelClassBooking}
          onUpdateClassCapacity={onUpdateClassCapacity}
          onToggleClassAttendance={onToggleClassAttendance}
          onCreateNewClass={onCreateNewClass}
        />
      )}

      {/* 4. FINANCIALS, ZARINPAL, SMS & PEAK HOURS ANALYTICS */}
      {activeSubTab === 'FINANCIAL_SMS' && (
        <div className="space-y-6">
          {/* Financial Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                مجموع درآمدهای ثبت‌شده (شهریه، بوفه و کمد)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5">
                {totalIncome.toLocaleString('fa-IR')} تومان
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                مجموع هزینه‌ها (حقوق مربیان، اجاره و تعمیرات)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1.5">
                {totalExpense.toLocaleString('fa-IR')} تومان
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                تراز خالص سود و زیان دوره (پس از کسر هزینه‌ها)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1.5">
                {netProfit.toLocaleString('fa-IR')} تومان
              </div>
            </div>
          </div>

          {/* Add Financial Record + Ledger */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ثبت سند مالی، اعمال کد تخفیف و اتصال به درگاه پرداخت (زرین‌پال / پی‌پینگ / سامان)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                کدهای تخفیف فعال جهت تست: <span className="font-mono">HERO15</span> (۱۵٪ تخفیف) و{' '}
                <span className="font-mono">NOROOZ20</span> (۲۰٪ تخفیف) · مالیات بر ارزش افزوده ۱۰٪ محاسبه می‌گردد.
              </p>
            </div>

            <form
              onSubmit={handleCreateFinancialRecord}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs"
            >
              <input
                type="text"
                required
                value={txTitle}
                onChange={(e) => setTxTitle(e.target.value)}
                placeholder="شرح سند (مثلاً شهریه ۱۶ جلسه بدنسازی)"
                className="lg:col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as 'Income' | 'Expense')}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="Income">درآمد (+)</option>
                <option value="Expense">هزینه (-)</option>
              </select>
              <input
                type="text"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="مبلغ (تومان)"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={txDiscountCode}
                onChange={(e) => setTxDiscountCode(e.target.value)}
                placeholder="کد تخفیف (مثلاً HERO15)"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                ثبت تراکنش مالی
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3">شرح تراکنش</th>
                    <th className="py-2.5 px-3">طرف حساب</th>
                    <th className="py-2.5 px-3">درگاه / روش</th>
                    <th className="py-2.5 px-3">کد رهگیری شاپرک</th>
                    <th className="py-2.5 px-3 text-left">مبلغ نهایی (تومان)</th>
                    <th className="py-2.5 px-3">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-xs">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                        {tx.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {tx.memberName}
                      </td>
                      <td className="py-3 px-3 font-mono">{tx.paymentGateway}</td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-500">
                        {tx.trackingCode}
                      </td>
                      <td
                        className={`py-3 px-3 text-left font-mono tabular-nums font-bold ${
                          tx.type === 'Income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'Income' ? '+' : '-'}
                        {tx.amount.toLocaleString('fa-IR')}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-500">
                        {tx.dateShamsi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SMS Integration & Peak Hours BI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>وب‌سرویس ارسال پیامک خودکار (کاوه‌نگار / فراپیامک / ملی‌پیامک)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input
                  type="text"
                  value={smsRecipientName}
                  onChange={(e) => setSmsRecipientName(e.target.value)}
                  placeholder="نام گیرنده"
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={smsRecipientPhone}
                  onChange={(e) => setSmsRecipientPhone(e.target.value)}
                  placeholder="شماره موبایل"
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-slate-100"
                />
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value as SmsLogItem['provider'])}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="Kavenegar">پنل کاوه‌نگار (Kavenegar)</option>
                  <option value="Farapayamak">پنل فراپیامک (Farapayamak)</option>
                  <option value="Melipayamak">پنل ملی‌پیامک (Melipayamak)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() =>
                    onSendSms({
                      recipientName: smsRecipientName,
                      recipientPhone: smsRecipientPhone,
                      templateType: smsTemplate,
                      messageBody: smsBody,
                      provider: smsProvider,
                    })
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال پیامک</span>
                </button>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs pt-2">
                {smsLogs.map((log) => (
                  <div key={log.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.recipientName} ({log.recipientPhone})
                      </span>
                      <span className="font-mono tabular-nums">
                        {log.provider} · {log.sentAtShamsi}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{log.messageBody}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>تحلیل ساعات شلوغی باشگاه (Peak Hours)</span>
              </h3>
              <div className="space-y-3 text-xs">
                {PEAK_HOURS_DATA.map((row) => (
                  <div key={row.hour} className="space-y-1">
                    <div className="flex items-center justify-between font-mono tabular-nums">
                      <span className="text-slate-700 dark:text-slate-300">{row.hour}</span>
                      <span className="text-slate-500">
                        {row.count} ورزشکار · {row.label}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          row.count >= 70
                            ? 'bg-rose-500'
                            : row.count >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, row.count)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
