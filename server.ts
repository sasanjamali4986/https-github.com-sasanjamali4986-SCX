import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type UserRole = 'SuperAdmin' | 'Receptionist' | 'Coach' | 'Member';

interface ServerAuthAccount {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  assignedClubCode: string;
  title: string;
}

interface ServerClubRecord {
  id: string;
  name: string;
  code: string;
  clubType: 'Bodybuilding' | 'MultiPurpose' | 'MartialArts' | 'PoolSpa' | 'WomenOnly';
  city: string;
  address: string;
  phone: string;
  managerName: string;
  capacity: number;
  status: 'Active' | 'Maintenance';
  createdShamsi: string;
}

interface ServerMemberRecord {
  id: string;
  fullName: string;
  nationalCode: string;
  phone: string;
  membershipCode: string;
  bloodType: string;
  medicalNotes: string;
  planTitle: string;
  coachName: string;
  totalSessions: number;
  remainingSessions: number;
  expirationDate: string;
  expirationShamsi: string;
  status: 'Active' | 'Expired' | 'Suspended';
  lockerNumber: string;
}

const serverAccounts: Map<string, ServerAuthAccount> = new Map([
  [
    'admin',
    {
      username: 'admin',
      password: '123456',
      fullName: 'مهندس ساسان جمالی (مدیر کل)',
      role: 'SuperAdmin',
      assignedClubCode: 'CLUB-101',
      title: 'مدیر کل مجموعه‌های ورزشی (Super Admin)',
    },
  ],
  [
    'reception',
    {
      username: 'reception',
      password: '123456',
      fullName: 'امیررضا کاظمی (مسئول پذیرش)',
      role: 'Receptionist',
      assignedClubCode: 'CLUB-101',
      title: 'مسئول پذیرش و کنترل گیت (Receptionist)',
    },
  ],
  [
    'coach',
    {
      username: 'coach',
      password: '123456',
      fullName: 'استاد سهراب مرادی (مربی ارشد)',
      role: 'Coach',
      assignedClubCode: 'CLUB-101',
      title: 'مربی رسمی بدنسازی و تغذیه (Coach)',
    },
  ],
  [
    'member',
    {
      username: 'member',
      password: '123456',
      fullName: 'آرش کریمی (ورزشکار VIP)',
      role: 'Member',
      assignedClubCode: 'CLUB-101',
      title: 'ورزشکار عضو باشگاه (Member)',
    },
  ],
]);

const serverClubs: Map<string, ServerClubRecord> = new Map([
  [
    'CLUB-101',
    {
      id: 'club_101',
      name: 'باشگاه بدنسازی و کراس‌فیت پارس‌جیم (شعبه مرکزی سعادت‌آباد)',
      code: 'CLUB-101',
      clubType: 'Bodybuilding',
      city: 'تهران',
      address: 'سعادت‌آباد، میدان کاج، بلوار سرو غربی، پلاک ۴۲',
      phone: '02122084510',
      managerName: 'مهندس ساسان جمالی',
      capacity: 350,
      status: 'Active',
      createdShamsi: '۱۴۰۳/۰۱/۱۵',
    },
  ],
  [
    'CLUB-102',
    {
      id: 'club_102',
      name: 'مجموعه ورزشی چندمنظوره و استخر آرتمیس (شعبه جردن)',
      code: 'CLUB-102',
      clubType: 'MultiPurpose',
      city: 'تهران',
      address: 'بلوار آفریقا (جردن)، بالاتر از چهارراه جهان کودک، کوچه صانعی',
      phone: '02188793211',
      managerName: 'دکتر نیما فرهمند',
      capacity: 500,
      status: 'Active',
      createdShamsi: '۱۴۰۴/۰۴/۱۰',
    },
  ],
  [
    'CLUB-103',
    {
      id: 'club_103',
      name: 'آکادمی تخصصی بوکس و هنرهای رزمی تختی (شعبه انقلاب)',
      code: 'CLUB-103',
      clubType: 'MartialArts',
      city: 'تهران',
      address: 'خیابان سئول، جنب مجموعه ورزشی انقلاب، سالن شماره ۳',
      phone: '02126219040',
      managerName: 'استاد بهرام افشار',
      capacity: 180,
      status: 'Active',
      createdShamsi: '۱۴۰۴/۰۹/۰۱',
    },
  ],
]);

// In-memory transactional mirror for fast Axios check-in verification
const serverMembers: Map<string, ServerMemberRecord> = new Map([
  [
    'GYM-1405-1001',
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
  ],
  [
    'GYM-1405-1002',
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
  ],
  [
    'GYM-1405-1003',
    {
      id: 'mem_1003',
      fullName: 'محمدرضا طاهری',
      nationalCode: '0074629182',
      phone: '09354433221',
      membershipCode: 'GYM-1405-1003',
      bloodType: 'B+',
      medicalNotes: 'سابقه گرفتگی عضلات کمر',
      planTitle: 'بدنسازی عمومی (۱۲ جلسه)',
      coachName: 'استاد سهراب مرادی',
      totalSessions: 12,
      remainingSessions: 0,
      expirationDate: '2026-12-05',
      expirationShamsi: '۱۴۰۵/۰۹/۱۴',
      status: 'Active',
      lockerNumber: '-',
    },
  ],
  [
    'GYM-1405-1004',
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
  ],
  [
    'GYM-1405-1005',
    {
      id: 'mem_1005',
      fullName: 'مهسا تهرانی',
      nationalCode: '0065432198',
      phone: '09121119988',
      membershipCode: 'GYM-1405-1005',
      bloodType: 'O-',
      medicalNotes: 'نیاز به گرم‌کردن طولانی شانه',
      planTitle: 'پیلاتس و استخر (۲۰ جلسه)',
      coachName: 'مربی نیلوفر رحیمی',
      totalSessions: 20,
      remainingSessions: 18,
      expirationDate: '2027-01-20',
      expirationShamsi: '۱۴۰۵/۱۰/۳۰',
      status: 'Active',
      lockerNumber: 'VIP-02',
    },
  ],
]);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Username & Password Login API Endpoint (POST /api/auth/login)
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };

    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً نام کاربری و کلمه عبور را به صورت کامل وارد نمایید.',
      });
    }

    if (cleanPass.length < 4) {
      return res.status(401).json({
        success: false,
        message: 'کلمه عبور واردشده معتبر نیست (حداقل ۴ کاراکتر).',
      });
    }

    const foundAccount = serverAccounts.get(cleanUser);
    if (foundAccount) {
      if (foundAccount.password !== cleanPass) {
        return res.status(401).json({
          success: false,
          message: 'کلمه عبور برای این نام کاربری اشتباه است. (رمز پیش‌فرض دمو: 123456)',
        });
      }

      return res.status(200).json({
        success: true,
        message: `خوش آمدید، ${foundAccount.fullName}`,
        account: {
          username: foundAccount.username,
          fullName: foundAccount.fullName,
          role: foundAccount.role,
          assignedClubCode: foundAccount.assignedClubCode,
          title: foundAccount.title,
        },
      });
    }

    // Allow custom username login as SuperAdmin if not matching preset usernames
    const customAccount: ServerAuthAccount = {
      username: cleanUser,
      password: cleanPass,
      fullName: `${username?.trim()} (مدیر سیستم)`,
      role: 'SuperAdmin',
      assignedClubCode: 'CLUB-101',
      title: 'مدیر کل باشگاه (Super Admin)',
    };
    serverAccounts.set(cleanUser, customAccount);

    return res.status(200).json({
      success: true,
      message: `ورود با موفقیت انجام شد — خوش آمدید ${customAccount.fullName}`,
      account: {
        username: customAccount.username,
        fullName: customAccount.fullName,
        role: customAccount.role,
        assignedClubCode: customAccount.assignedClubCode,
        title: customAccount.title,
      },
    });
  });

  // 2. Get Clubs & Create New Gym/Club API Endpoints (/api/clubs)
  app.get('/api/clubs', (_req, res) => {
    res.json({ clubs: Array.from(serverClubs.values()) });
  });

  app.post('/api/clubs', (req, res) => {
    const {
      role,
      name,
      code,
      clubType,
      city,
      address,
      phone,
      managerName,
      capacity,
      status,
    } = req.body as Partial<ServerClubRecord> & { role?: UserRole };

    if (role && role !== 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیر کل (Super Admin) مجاز به تعریف و ثبت باشگاه جدید در سامانه است.',
      });
    }

    if (!name || !name.trim() || !city || !address || !phone || !managerName) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً نام باشگاه، شهر، آدرس، تلفن و نام مدیر باشگاه را وارد نمایید.',
      });
    }

    const cleanCode = (code || `CLUB-${101 + serverClubs.size}`).trim().toUpperCase();
    if (serverClubs.has(cleanCode)) {
      return res.status(409).json({
        success: false,
        message: `باشگاهی با کد اختصاصی «${cleanCode}» قبلاً در سیستم ثبت شده است.`,
      });
    }

    const newClub: ServerClubRecord = {
      id: `club_${Date.now()}`,
      name: name.trim(),
      code: cleanCode,
      clubType: clubType || 'Bodybuilding',
      city: city.trim(),
      address: address.trim(),
      phone: phone.trim(),
      managerName: managerName.trim(),
      capacity: Math.max(10, Number(capacity) || 250),
      status: status || 'Active',
      createdShamsi: '۱۴۰۵/۰۸/۱۸',
    };

    serverClubs.set(cleanCode, newClub);
    return res.status(201).json({
      success: true,
      message: `باشگاه «${newClub.name}» با کد ${newClub.code} با موفقیت تعریف و فعال شد.`,
      club: newClub,
    });
  });

  // Sync member state from client/Firestore into backend mirror
  app.post('/api/members/sync', (req, res) => {
    const { members } = req.body as { members?: ServerMemberRecord[] };
    if (Array.isArray(members)) {
      for (const m of members) {
        if (m && m.membershipCode) {
          serverMembers.set(m.membershipCode.toUpperCase(), m);
        }
      }
    }
    res.json({ synced: serverMembers.size });
  });

  // Core Attendance Check-in API endpoint (mirrors .NET 10 AttendanceController logic)
  app.post('/api/attendance/check-in', (req, res) => {
    const { identifier, memberSnapshot, requestedLocker } = req.body as {
      identifier?: string;
      memberSnapshot?: ServerMemberRecord;
      requestedLocker?: string;
    };

    const rawCode = (identifier || '').trim().toUpperCase();
    if (!rawCode) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_INPUT',
        message: 'لطفاً کد عضویت، بارکد یا کد ملی ۱۰ رقمی ورزشکار را وارد یا اسکن نمایید.',
      });
    }

    let member: ServerMemberRecord | undefined = memberSnapshot;
    if (!member) {
      for (const item of serverMembers.values()) {
        if (
          item.membershipCode.toUpperCase() === rawCode ||
          item.nationalCode === rawCode ||
          item.id.toUpperCase() === rawCode
        ) {
          member = item;
          break;
        }
      }
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        errorCode: 'MEMBER_NOT_FOUND',
        message: `ورزشکاری با شناسه یا بارکد «${rawCode}» در سیستم یافت نشد.`,
      });
    }

    const now = new Date();
    const expDate = new Date(member.expirationDate);
    const isDateExpired = isNaN(expDate.getTime()) ? false : expDate.getTime() < now.getTime();

    if (member.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        errorCode: 'SUBSCRIPTION_SUSPENDED',
        message: `اشتراک ${member.fullName} مسدود/معلق شده است. لطفاً وضعیت مالی را بررسی کنید.`,
        member,
      });
    }

    if (member.status === 'Expired' || isDateExpired) {
      return res.status(403).json({
        success: false,
        errorCode: 'SUBSCRIPTION_EXPIRED',
        message: `مهلت اشتراک ${member.fullName} در تاریخ ${member.expirationShamsi} به پایان رسیده است. ورود مجاز نیست.`,
        member: { ...member, status: 'Expired' },
      });
    }

    if (member.remainingSessions <= 0) {
      return res.status(403).json({
        success: false,
        errorCode: 'NO_REMAINING_SESSIONS',
        message: `تعداد جلسات اشتراک ${member.fullName} به اتمام رسیده است (۰ از ${member.totalSessions} جلسه). لطفاً اشتراک را تمدید نمایید.`,
        member,
      });
    }

    const newRemaining = member.remainingSessions - 1;
    const assignedLocker =
      requestedLocker && requestedLocker.trim() !== ''
        ? requestedLocker.trim()
        : member.lockerNumber && member.lockerNumber !== '-'
        ? member.lockerNumber
        : `A-${Math.floor(10 + Math.random() * 40)}`;

    const updatedMember: ServerMemberRecord = {
      ...member,
      remainingSessions: newRemaining,
      lockerNumber: assignedLocker,
    };

    serverMembers.set(updatedMember.membershipCode.toUpperCase(), updatedMember);

    const daysRemaining = Math.max(
      0,
      Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const lowSessionWarning =
      newRemaining <= 3
        ? `هشدار: تنها ${newRemaining} جلسه از اشتراک ورزشکار باقی مانده است (پیامک یادآوری تمدید ارسال شد).`
        : daysRemaining <= 5
        ? `هشدار: تنها ${daysRemaining} روز تا پایان اعتبار اشتراک باقی مانده است.`
        : null;

    return res.status(200).json({
      success: true,
      message: `ورود ${updatedMember.fullName} با موفقیت ثبت شد و ۱ جلسه از اعتبار کسر گردید.`,
      warning: lowSessionWarning,
      deductedSessions: 1,
      remainingSessionsAfter: newRemaining,
      totalSessions: updatedMember.totalSessions,
      daysRemaining,
      lockerAssigned: assignedLocker,
      checkInTimestamp: now.toISOString(),
      member: updatedMember,
      smsTriggered: newRemaining <= 3 || daysRemaining <= 5,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ParsGym Pro Server running on http://localhost:${PORT}`);
  });
}

startServer();
