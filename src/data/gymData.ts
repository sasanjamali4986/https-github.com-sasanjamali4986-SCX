export type UserRole = 'SuperAdmin' | 'Receptionist' | 'Coach' | 'Member';

export interface GymMember {
  id: string;
  ownerId?: string;
  fullName: string;
  nationalCode: string;
  phone: string;
  membershipCode: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  medicalNotes: string;
  planTitle: string;
  coachName: string;
  totalSessions: number;
  remainingSessions: number;
  expirationDate: string; // YYYY-MM-DD
  expirationShamsi: string; // ۱۴۰۵/MM/DD
  status: 'Active' | 'Expired' | 'Suspended';
  lockerNumber: string;
}

export interface AttendanceRecord {
  id: string;
  ownerId?: string;
  memberId: string;
  memberName: string;
  membershipCode: string;
  planTitle: string;
  checkInShamsi: string;
  remainingSessionsAfter: number;
  lockerAssigned: string;
  status: 'Allowed' | 'Denied';
  notes: string;
}

export interface FinancialRecord {
  id: string;
  ownerId?: string;
  title: string;
  category: 'Tuition' | 'Buffet' | 'Locker' | 'CoachSalary' | 'Rent' | 'Maintenance';
  type: 'Income' | 'Expense';
  amount: number; // in Tomans
  taxAmount: number; // 10% VAT
  discountCode: string;
  paymentGateway: 'ZarinPal' | 'PayPing' | 'SamanSEP' | 'POS' | 'Cash';
  trackingCode: string;
  memberName: string;
  dateShamsi: string;
}

export interface LockerItem {
  id: string;
  lockerNumber: string;
  zone: 'VIP' | 'Standard';
  status: 'Available' | 'Occupied' | 'ExpiringSoon' | 'Maintenance';
  assignedMemberName: string;
  assignedMemberCode: string;
  expiresAtShamsi: string;
  monthlyRate: number;
}

export interface CanteenProduct {
  id: string;
  name: string;
  category: 'Supplement' | 'Drink' | 'Snack' | 'Gear';
  price: number;
  stock: number;
  minStockThreshold: number;
  unit: string;
}

export interface GymClassItem {
  id: string;
  title: string;
  coachName: string;
  scheduleDays: string;
  timeSlot: string;
  capacity: number;
  enrolledCount: number;
  tuitionFee: number;
  hallName: string;
  workoutRoutine: {
    dayTitle: string;
    exercises: { move: string; sets: string; tempo: string; notes: string }[];
  }[];
  dietPlan: {
    meal: string;
    items: string;
    calories: number;
    proteinGrams: number;
  }[];
}

export interface SmsLogItem {
  id: string;
  recipientName: string;
  recipientPhone: string;
  templateType: 'Welcome' | 'RenewalWarning' | 'Birthday' | 'PaymentReceipt' | 'CheckInAlert';
  messageBody: string;
  provider: 'Kavenegar' | 'Farapayamak' | 'Melipayamak';
  sentAtShamsi: string;
  deliveryStatus: 'Delivered' | 'Queued';
}

export const INITIAL_MEMBERS: GymMember[] = [
  {
    id: 'mem_1001',
    fullName: 'آرش کریمی',
    nationalCode: '0018492031',
    phone: '09123456781',
    membershipCode: 'GYM-1405-1001',
    bloodType: 'O+',
    medicalNotes: 'بدون سابقه آسیب‌دیدگی خاص',
    planTitle: 'بدنسازی VIP + هوازی (۱۶ جلسه)',
    coachName: 'استاد سهراب مرادی',
    totalSessions: 16,
    remainingSessions: 11,
    expirationDate: '2026-12-25',
    expirationShamsi: '۱۴۰۵/۱۰/۰۴',
    status: 'Active',
    lockerNumber: 'VIP-04',
  },
  {
    id: 'mem_1002',
    fullName: 'سارا نادری',
    nationalCode: '0029183746',
    phone: '09129876543',
    membershipCode: 'GYM-1405-1002',
    bloodType: 'A+',
    medicalNotes: 'حساسیت خفیف مفصل زانو راست - پرهیز از اسکات سنگین',
    planTitle: 'کراس‌فیت و TRX تخصصی (۱۲ جلسه)',
    coachName: 'مربی نیلوفر رحیمی',
    totalSessions: 12,
    remainingSessions: 2,
    expirationDate: '2026-11-14',
    expirationShamsi: '۱۴۰۵/۰۸/۲۳',
    status: 'Active',
    lockerNumber: 'A-12',
  },
  {
    id: 'mem_1003',
    fullName: 'محمدرضا طاهری',
    nationalCode: '0074629182',
    phone: '09354433221',
    membershipCode: 'GYM-1405-1003',
    bloodType: 'B+',
    medicalNotes: 'سابقه گرفتگی عضلات فیله کمر',
    planTitle: 'بدنسازی عمومی (۱۲ جلسه)',
    coachName: 'استاد سهراب مرادی',
    totalSessions: 12,
    remainingSessions: 0,
    expirationDate: '2026-12-05',
    expirationShamsi: '۱۴۰۵/۰۹/۱۴',
    status: 'Active',
    lockerNumber: '-',
  },
  {
    id: 'mem_1004',
    fullName: 'کیانوش رستمی‌پور',
    nationalCode: '0491827364',
    phone: '09191122334',
    membershipCode: 'GYM-1405-1004',
    bloodType: 'AB+',
    medicalNotes: 'بدون محدودیت پزشکی',
    planTitle: 'بوکس و هنرهای رزمی (۱۶ جلسه)',
    coachName: 'استاد بهرام افشار',
    totalSessions: 16,
    remainingSessions: 6,
    expirationDate: '2026-10-15',
    expirationShamsi: '۱۴۰۵/۰۷/۲۳',
    status: 'Expired',
    lockerNumber: '-',
  },
  {
    id: 'mem_1005',
    fullName: 'مهسا تهرانی',
    nationalCode: '0065432198',
    phone: '09121119988',
    membershipCode: 'GYM-1405-1005',
    bloodType: 'O-',
    medicalNotes: 'نیاز به گرم‌کردن طولانی مفصل شانه چپ',
    planTitle: 'پیلاتس و استخر (۲۰ جلسه)',
    coachName: 'مربی نیلوفر رحیمی',
    totalSessions: 20,
    remainingSessions: 18,
    expirationDate: '2027-01-20',
    expirationShamsi: '۱۴۰۵/۱۰/۳۰',
    status: 'Active',
    lockerNumber: 'VIP-02',
  },
];

export const INITIAL_ATTENDANCES: AttendanceRecord[] = [
  {
    id: 'att_01',
    memberId: 'mem_1001',
    memberName: 'آرش کریمی',
    membershipCode: 'GYM-1405-1001',
    planTitle: 'بدنسازی VIP + هوازی (۱۶ جلسه)',
    checkInShamsi: '۱۴۰۵/۰۸/۱۸ - ۱۸:۴۵',
    remainingSessionsAfter: 11,
    lockerAssigned: 'VIP-04',
    status: 'Allowed',
    notes: 'ورود موفق با اسکن بارکد - ۱ جلسه کسر شد',
  },
  {
    id: 'att_02',
    memberId: 'mem_1002',
    memberName: 'سارا نادری',
    membershipCode: 'GYM-1405-1002',
    planTitle: 'کراس‌فیت و TRX تخصصی (۱۲ جلسه)',
    checkInShamsi: '۱۴۰۵/۰۸/۱۸ - ۱۷:۳۰',
    remainingSessionsAfter: 2,
    lockerAssigned: 'A-12',
    status: 'Allowed',
    notes: 'هشدار کمبود جلسات (۲ جلسه باقی‌مانده) - پیامک ارسال شد',
  },
  {
    id: 'att_03',
    memberId: 'mem_1003',
    memberName: 'محمدرضا طاهری',
    membershipCode: 'GYM-1405-1003',
    planTitle: 'بدنسازی عمومی (۱۲ جلسه)',
    checkInShamsi: '۱۴۰۵/۰۸/۱۸ - ۱۶:۱۵',
    remainingSessionsAfter: 0,
    lockerAssigned: '-',
    status: 'Denied',
    notes: 'جلوگیری از ورود: اتمام سقف جلسات اشتراک (۰ جلسه)',
  },
];

export const INITIAL_TRANSACTIONS: FinancialRecord[] = [
  {
    id: 'trx_101',
    title: 'تمدید اشتراک ۱۶ جلسه بدنسازی VIP - آرش کریمی',
    category: 'Tuition',
    type: 'Income',
    amount: 2850000,
    taxAmount: 285000,
    discountCode: 'HERO15',
    paymentGateway: 'ZarinPal',
    trackingCode: 'ZP-884920194',
    memberName: 'آرش کریمی',
    dateShamsi: '۱۴۰۵/۰۸/۱۸',
  },
  {
    id: 'trx_102',
    title: 'ثبت‌نام ۲۰ جلسه پیلاتس و استخر - مهسا تهرانی',
    category: 'Tuition',
    type: 'Income',
    amount: 3400000,
    taxAmount: 340000,
    discountCode: '-',
    paymentGateway: 'PayPing',
    trackingCode: 'PP-77319042',
    memberName: 'مهسا تهرانی',
    dateShamsi: '۱۴۰۵/۰۸/۱۷',
  },
  {
    id: 'trx_103',
    title: 'فروش بوفه: پروتئین وی ایزوله ۱ اسکوپ + قهوه اسپرسو',
    category: 'Buffet',
    type: 'Income',
    amount: 245000,
    taxAmount: 24500,
    discountCode: '-',
    paymentGateway: 'POS',
    trackingCode: 'POS-991042',
    memberName: 'سارا نادری',
    dateShamsi: '۱۴۰۵/۰۸/۱۸',
  },
  {
    id: 'trx_104',
    title: 'تسویه حق‌الزحمه مربیگری آبان‌ماه - استاد سهراب مرادی',
    category: 'CoachSalary',
    type: 'Expense',
    amount: 18500000,
    taxAmount: 0,
    discountCode: '-',
    paymentGateway: 'SamanSEP',
    trackingCode: 'SEP-5519283',
    memberName: 'استاد سهراب مرادی',
    dateShamsi: '۱۴۰۵/۰۸/۱۵',
  },
  {
    id: 'trx_105',
    title: 'سرویس دوره‌ای دستگاه‌های سیم‌کش و تردمیل‌های باشگاهی',
    category: 'Maintenance',
    type: 'Expense',
    amount: 4200000,
    taxAmount: 420000,
    discountCode: '-',
    paymentGateway: 'Cash',
    trackingCode: 'INV-1405-88',
    memberName: 'تجهیزات تکنوجیم پارس',
    dateShamsi: '۱۴۰۵/۰۸/۱۲',
  },
];

export const INITIAL_LOCKERS: LockerItem[] = [
  { id: 'loc_1', lockerNumber: 'VIP-01', zone: 'VIP', status: 'Available', assignedMemberName: '-', assignedMemberCode: '-', expiresAtShamsi: '-', monthlyRate: 650000 },
  { id: 'loc_2', lockerNumber: 'VIP-02', zone: 'VIP', status: 'Occupied', assignedMemberName: 'مهسا تهرانی', assignedMemberCode: 'GYM-1405-1005', expiresAtShamsi: '۱۴۰۵/۱۰/۳۰', monthlyRate: 650000 },
  { id: 'loc_3', lockerNumber: 'VIP-03', zone: 'VIP', status: 'Available', assignedMemberName: '-', assignedMemberCode: '-', expiresAtShamsi: '-', monthlyRate: 650000 },
  { id: 'loc_4', lockerNumber: 'VIP-04', zone: 'VIP', status: 'Occupied', assignedMemberName: 'آرش کریمی', assignedMemberCode: 'GYM-1405-1001', expiresAtShamsi: '۱۴۰۵/۱۰/۰۴', monthlyRate: 650000 },
  { id: 'loc_5', lockerNumber: 'VIP-05', zone: 'VIP', status: 'ExpiringSoon', assignedMemberName: 'امیرحسین علوی', assignedMemberCode: 'GYM-1405-1008', expiresAtShamsi: '۱۴۰۵/۰۸/۲۰', monthlyRate: 650000 },
  { id: 'loc_6', lockerNumber: 'VIP-06', zone: 'VIP', status: 'Maintenance', assignedMemberName: 'قفل دیجیتال در دست تعمیر', assignedMemberCode: '-', expiresAtShamsi: '-', monthlyRate: 650000 },
  { id: 'loc_7', lockerNumber: 'A-10', zone: 'Standard', status: 'Available', assignedMemberName: '-', assignedMemberCode: '-', expiresAtShamsi: '-', monthlyRate: 300000 },
  { id: 'loc_8', lockerNumber: 'A-11', zone: 'Standard', status: 'Available', assignedMemberName: '-', assignedMemberCode: '-', expiresAtShamsi: '-', monthlyRate: 300000 },
  { id: 'loc_9', lockerNumber: 'A-12', zone: 'Standard', status: 'ExpiringSoon', assignedMemberName: 'سارا نادری', assignedMemberCode: 'GYM-1405-1002', expiresAtShamsi: '۱۴۰۵/۰۸/۲۳', monthlyRate: 300000 },
  { id: 'loc_10', lockerNumber: 'A-13', zone: 'Standard', status: 'Occupied', assignedMemberName: 'پویا رستگار', assignedMemberCode: 'GYM-1405-1009', expiresAtShamsi: '۱۴۰۵/۰۹/۲۸', monthlyRate: 300000 },
  { id: 'loc_11', lockerNumber: 'A-14', zone: 'Standard', status: 'Available', assignedMemberName: '-', assignedMemberCode: '-', expiresAtShamsi: '-', monthlyRate: 300000 },
  { id: 'loc_12', lockerNumber: 'A-15', zone: 'Standard', status: 'Available', assignedMemberName: '-', assignedMemberCode: '-', expiresAtShamsi: '-', monthlyRate: 300000 },
];

export const INITIAL_CANTEEN: CanteenProduct[] = [
  { id: 'can_1', name: 'شیک پروتئین وی ایزوله (۳۰ گرم)', category: 'Supplement', price: 185000, stock: 42, minStockThreshold: 10, unit: 'پیمانه' },
  { id: 'can_2', name: 'کراتین مونوهیدرات میکرونایزد (۵ گرم)', category: 'Supplement', price: 75000, stock: 6, minStockThreshold: 12, unit: 'سروینگ' },
  { id: 'can_3', name: 'آمینو انرژی و BCAA یخ‌زده', category: 'Supplement', price: 140000, stock: 28, minStockThreshold: 10, unit: 'لیوان' },
  { id: 'can_4', name: 'اسپرسو دبل عربیکا ۱۰۰٪', category: 'Drink', price: 65000, stock: 85, minStockThreshold: 20, unit: 'فنجان' },
  { id: 'can_5', name: 'نوشیدنی ایزوتونیک الکترولیت ورزشی', category: 'Drink', price: 58000, stock: 5, minStockThreshold: 15, unit: 'بطری' },
  { id: 'can_6', name: 'پروتئین بار شکلات تلخ بدون شکر', category: 'Snack', price: 95000, stock: 34, minStockThreshold: 12, unit: 'عدد' },
  { id: 'can_7', name: 'مچ‌بند و بند لیفت چرمی حرفه‌ای', category: 'Gear', price: 490000, stock: 8, minStockThreshold: 5, unit: 'جفت' },
];

export const INITIAL_CLASSES: GymClassItem[] = [
  {
    id: 'cls_1',
    title: 'هایپرتروفی و بدنسازی پیشرفته',
    coachName: 'استاد سهراب مرادی',
    scheduleDays: 'شنبه، دوشنبه، چهارشنبه',
    timeSlot: '۱۷:۰۰ تا ۱۹:۳۰',
    capacity: 25,
    enrolledCount: 21,
    tuitionFee: 2850000,
    hallName: 'سالن اصلی وزنه (طبقه اول)',
    workoutRoutine: [
      {
        dayTitle: 'روز اول: سینه + جلوبازو + شکم',
        exercises: [
          { move: 'پرس بالا سینه هالتر', sets: '۴ ست × ۸-۱۰ تکرار', tempo: '3-1-1-0', notes: 'کنترل کامل در بخش منفی حرکت' },
          { move: 'پرس سینه دمبل جفت', sets: '۴ ست × ۱۰ تکرار', tempo: '2-0-1-0', notes: 'زاویه نیمکت ۱۵ درجه' },
          { move: 'قفسه سینه سیم‌کش کراس‌اور', sets: '۳ ست × ۱۲-۱۵ تکرار', tempo: '2-1-2-1', notes: 'مکث ۱ ثانیه‌ای در انقباض' },
          { move: 'جلوبازو هالتر EZ ایستاده', sets: '۴ ست × ۱۰ تکرار', tempo: '2-1-1-0', notes: 'آرنج‌ها ثابت کنار بدن' },
        ],
      },
      {
        dayTitle: 'روز دوم: زیربغل + سرشانه + پشت‌بازو',
        exercises: [
          { move: 'زیربغل سیم‌کش دست باز از جلو', sets: '۴ ست × ۱۰-۱۲ تکرار', tempo: '2-1-2-0', notes: 'هدایت آرنج به سمت پهلو' },
          { move: 'زیربغل هالتر خم مچ برعکس', sets: '۴ ست × ۸-۱۰ تکرار', tempo: '2-0-1-1', notes: 'حفظ قوس طبیعی ستون فقرات' },
          { move: 'نشر جانب دمبل نشسته', sets: '۴ ست × ۱۵ تکرار', tempo: '2-1-1-0', notes: 'سوپرست با نشر خم دمبل' },
          { move: 'پشت‌بازو سیم‌کش طنابی', sets: '۴ ست × ۱۲ تکرار', tempo: '2-1-1-0', notes: 'باز کردن کامل مچ در انتهای دامنه' },
        ],
      },
    ],
    dietPlan: [
      { meal: 'صبحانه (۰۷:۳۰)', items: '۵ عدد سفیده تخم‌مرغ + ۱ زرده + ۷۰ گرم جو دوسر پرک + ۱ قاشق کره بادام‌زمینی', calories: 540, proteinGrams: 34 },
      { meal: 'میان‌وعده قبل تمرین (۱۵:۳۰)', items: '۱۵۰ گرم سیب‌زمینی تنوری + ۱۰۰ گرم سینه مرغ گریل + ۱ فنجان اسپرسو', calories: 380, proteinGrams: 31 },
      { meal: 'وعده پس از تمرین (۱۹:۴۵)', items: '۱ اسکوپ پروتئین وی ایزوله + ۱ عدد موز متوسط + ۵ گرم کراتین', calories: 230, proteinGrams: 27 },
      { meal: 'شام (۲۱:۰۰)', items: '۱۸۰ گرم فیله ماهی قزل‌آلا یا راسته گوساله + سالاد سبز با روغن زیتون فرابکر', calories: 490, proteinGrams: 42 },
    ],
  },
  {
    id: 'cls_2',
    title: 'کراس‌فیت و تی‌آرایکس (TRX & HIIT)',
    coachName: 'مربی نیلوفر رحیمی',
    scheduleDays: 'یکشنبه، سه‌شنبه، پنجشنبه',
    timeSlot: '۱۶:۰۰ تا ۱۷:۳۰',
    capacity: 18,
    enrolledCount: 16,
    tuitionFee: 2400000,
    hallName: 'استودیو فانکشنال (طبقه دوم)',
    workoutRoutine: [
      {
        dayTitle: 'بلوک متابولیک و استقامت عضلانی (WOD)',
        exercises: [
          { move: 'اسکات پرشی با تسمه TRX', sets: '۴ راند × ۴۵ ثانیه', tempo: 'انفجاری', notes: '۱۵ ثانیه استراحت بین هر ایستگاه' },
          { move: 'شنا سوئدی معلق (TRX Atomic Pushup)', sets: '۴ راند × ۱۲ تکرار', tempo: '2-0-1-0', notes: 'درگیری کامل عضلات میان‌تنه (Core)' },
          { move: 'کتل‌بل سوئینگ روسی (Kettlebell Swing)', sets: '۴ راند × ۲۰ تکرار', tempo: 'ریتمیک', notes: 'قدرت از مفصل ران (Hip Hinge)' },
        ],
      },
    ],
    dietPlan: [
      { meal: 'صبحانه (۰۸:۰۰)', items: 'املت پروتئینی با اسفناج و قارچ + ۲ برش نان تست چاودار', calories: 420, proteinGrams: 28 },
      { meal: 'ناهار (۱۳:۳۰)', items: '۱۶۰ گرم سینه بوقلمون + ۱۲۰ گرم کینوا پخته + بروکلی بخارپز', calories: 460, proteinGrams: 38 },
      { meal: 'شام (۲۰:۳۰)', items: 'سالاد سزار رژیمی با فیله مرغ گریل و ماست یونانی', calories: 390, proteinGrams: 35 },
    ],
  },
  {
    id: 'cls_3',
    title: 'بوکس و کیک‌بوکسینگ قهرمانی',
    coachName: 'استاد بهرام افشار',
    scheduleDays: 'شنبه، دوشنبه، چهارشنبه',
    timeSlot: '۲۰:۰۰ تا ۲۱:۳۰',
    capacity: 20,
    enrolledCount: 14,
    tuitionFee: 2600000,
    hallName: 'رینگ اختصاصی رزمی',
    workoutRoutine: [
      {
        dayTitle: 'تکنیک، میت‌زنی و هوازی بی‌هوازی',
        exercises: [
          { move: 'طناب‌زنی سرعتی (Double Unders)', sets: '۳ راند × ۳ دقیقه', tempo: 'سرعتی', notes: '۱ دقیقه ریکاوری فعال' },
          { move: 'ترکیب جب-کراس-هوک روی کیسه سنگین', sets: '۵ راند × ۳ دقیقه', tempo: 'انفجاری', notes: 'حفظ گارد بالا پس از هر ضربه' },
        ],
      },
    ],
    dietPlan: [
      { meal: 'وعده شارژ گلیکوژن (۱۷:۰۰)', items: '۲۰۰ گرم برنج قهوه‌ای + ۱۵۰ گرم فیله مرغ + سبزیجات', calories: 510, proteinGrams: 36 },
    ],
  },
];

export const INITIAL_SMS_LOGS: SmsLogItem[] = [
  {
    id: 'sms_1',
    recipientName: 'سارا نادری',
    recipientPhone: '09129876543',
    templateType: 'RenewalWarning',
    messageBody: 'ورزشکار گرامی سارا نادری، تنها ۲ جلسه از اشتراک کراس‌فیت شما در باشگاه پارس‌جیم باقی مانده است. جهت تمدید آنلاین: parsgym.ir/pay',
    provider: 'Kavenegar',
    sentAtShamsi: '۱۴۰۵/۰۸/۱۸ - ۱۷:۳۱',
    deliveryStatus: 'Delivered',
  },
  {
    id: 'sms_2',
    recipientName: 'آرش کریمی',
    recipientPhone: '09123456781',
    templateType: 'PaymentReceipt',
    messageBody: 'آرش کریمی عزیز، پرداخت شهریه به مبلغ ۲,۸۵۰,۰۰۰ تومان (کد رهگیری ZP-884920194) با موفقیت ثبت شد. ۱۶ جلسه فعال گردید.',
    provider: 'Kavenegar',
    sentAtShamsi: '۱۴۰۵/۰۸/۱۸ - ۱۴:۱۰',
    deliveryStatus: 'Delivered',
  },
  {
    id: 'sms_3',
    recipientName: 'مهسا تهرانی',
    recipientPhone: '09121119988',
    templateType: 'Birthday',
    messageBody: 'مهسا تهرانی عزیز، زادروزتان مبارک! هدیه باشگاه پارس‌جیم: کد تخفیف ۲۰٪ تمدید اشتراک (کد: HBD1405).',
    provider: 'Farapayamak',
    sentAtShamsi: '۱۴۰۵/۰۸/۱۷ - ۰۹:۰۰',
    deliveryStatus: 'Delivered',
  },
];

export const PEAK_HOURS_DATA = [
  { hour: '۰۸:۰۰ - ۱۰:۰۰', count: 18, label: 'خلوت (بانوان)' },
  { hour: '۱۰:۰۰ - ۱۲:۰۰', count: 32, label: 'متوسط (بانوان)' },
  { hour: '۱۴:۰۰ - ۱۶:۰۰', count: 24, label: 'خلوت (آقایان)' },
  { hour: '۱۶:۰۰ - ۱۸:۰۰', count: 54, label: 'پرتردد' },
  { hour: '۱۸:۰۰ - ۲۰:۰۰', count: 86, label: 'اوج شلوغی (Peak)' },
  { hour: '۲۰:۰۰ - ۲۲:۰۰', count: 72, label: 'پرتردد' },
  { hour: '۲۲:۰۰ - ۲۳:۳۰', count: 35, label: 'متوسط' },
];
