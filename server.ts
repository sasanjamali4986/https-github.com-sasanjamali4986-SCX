import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Use provided snapshot if synced from Firestore or lookup by code / nationalCode / id
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

    // Rule 1: Prevent check-in if subscription is expired or suspended
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

    // Rule 2: Prevent check-in if remaining sessions == 0
    if (member.remainingSessions <= 0) {
      return res.status(403).json({
        success: false,
        errorCode: 'NO_REMAINING_SESSIONS',
        message: `تعداد جلسات اشتراک ${member.fullName} به اتمام رسیده است (۰ از ${member.totalSessions} جلسه). لطفاً اشتراک را تمدید نمایید.`,
        member,
      });
    }

    // Rule 3: Atomically deduct exactly ONE session
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
