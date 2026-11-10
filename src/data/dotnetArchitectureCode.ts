export interface CodeBlueprintSection {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  filename: string;
  description: string;
  code: string;
}

export const DOTNET_ARCHITECTURE_BLUEPRINTS: CodeBlueprintSection[] = [
  {
    id: 'entities-efcore',
    title: '۱. مدل‌های دیتابیس و تنظیمات Entity Framework Core 10',
    subtitle: 'SQL Server Schema, RBAC Entities, Subscriptions & Optimistic Concurrency (RowVersion)',
    language: 'csharp',
    filename: 'src/ParsGym.Infrastructure/Persistence/GymDbContext.cs',
    description:
      'کد کامل موجودیت‌ها (Entities) شامل کاربران، سطوح دسترسی چهارگانه (SuperAdmin, Receptionist, Coach, Member)، اشتراک‌ها، حضور و غیاب، کمدها، تراکنش‌های مالی و پیکربندی Fluent API در EF Core 10 برای SQL Server همراه با کنترل همزمانی (RowVersion).',
    code: `using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ParsGym.Domain.Entities;

public enum UserRole
{
    SuperAdmin = 1,
    Receptionist = 2,
    Coach = 3,
    Member = 4
}

public enum SubscriptionStatus
{
    Active = 1,
    Expired = 2,
    Suspended = 3,
    Exhausted = 4
}

public class GymClub
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; } // نام باشگاه
    public required string Code { get; set; } // مثلاً CLUB-101
    public required string ClubType { get; set; } // Bodybuilding, MultiPurpose, MartialArts, PoolSpa
    public required string City { get; set; }
    public required string Address { get; set; }
    public required string Phone { get; set; }
    public required string ManagerName { get; set; }
    public int DailyCapacity { get; set; } = 300;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Username { get; set; } // نام کاربری جهت لاگین
    public required string FullName { get; set; }
    public required string NationalCode { get; set; } // کد ملی ۱۰ رقمی
    public required string MobileNumber { get; set; } // 0912xxxxxxx
    public required string PasswordHash { get; set; } // کلمه عبور هش‌شده
    public UserRole Role { get; set; } = UserRole.Member;
    public Guid? AssignedClubId { get; set; }
    public GymClub? AssignedClub { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public MemberProfile? MemberProfile { get; set; }
}

public class MemberProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public required string BarcodeCode { get; set; } // e.g. GYM-1405-1001
    public string BloodType { get; set; } = "O+";
    public string? MedicalConditions { get; set; } // بیماری‌های خاص / آسیب‌های قبلی
    public string? EmergencyPhone { get; set; }
    public Guid? AssignedCoachId { get; set; }

    public ICollection<MemberSubscription> Subscriptions { get; set; } = new List<MemberSubscription>();
    public ICollection<AttendanceLog> AttendanceLogs { get; set; } = new List<AttendanceLog>();
}

public class SubscriptionPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; } // مثلاً بدنسازی ۱۶ جلسه یا TRX
    public int DefaultSessions { get; set; } // 12, 16, 24, or 30
    public int DurationDays { get; set; } = 30;
    public long PriceTomans { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MemberSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MemberProfileId { get; set; }
    public MemberProfile MemberProfile { get; set; } = null!;

    public Guid PlanId { get; set; }
    public SubscriptionPlan Plan { get; set; } = null!;

    public int TotalSessions { get; set; }
    public int RemainingSessions { get; set; }
    public DateTime StartDateUtc { get; set; }
    public DateTime ExpirationDateUtc { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    // Optimistic Concurrency Token to prevent race conditions on double barcode scans
    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

public class AttendanceLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MemberProfileId { get; set; }
    public MemberProfile MemberProfile { get; set; } = null!;

    public Guid SubscriptionId { get; set; }
    public MemberSubscription Subscription { get; set; } = null!;

    public DateTime CheckInTimeUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CheckOutTimeUtc { get; set; }
    public int RemainingSessionsAfterCheckIn { get; set; }
    public string? AssignedLockerNumber { get; set; }
    public Guid ProcessedByUserId { get; set; } // Receptionist ID
    public bool IsAllowed { get; set; }
    public string? DenialReason { get; set; }
}

// ---------------- EF CORE 10 DBCONTEXT & FLUENT CONFIGURATION ----------------
namespace ParsGym.Infrastructure.Persistence;

using ParsGym.Domain.Entities;

public class GymDbContext : DbContext
{
    public GymDbContext(DbContextOptions<GymDbContext> options) : base(options) { }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<MemberProfile> MemberProfiles => Set<MemberProfile>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<MemberSubscription> MemberSubscriptions => Set<MemberSubscription>();
    public DbSet<AttendanceLog> AttendanceLogs => Set<AttendanceLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(b =>
        {
            b.ToTable("Users");
            b.HasKey(u => u.Id);
            b.Property(u => u.FullName).HasMaxLength(100).IsRequired();
            b.Property(u => u.NationalCode).HasMaxLength(10).IsFixedLength().IsRequired();
            b.Property(u => u.MobileNumber).HasMaxLength(11).IsFixedLength().IsRequired();
            b.HasIndex(u => u.NationalCode).IsUnique();
            b.HasIndex(u => u.MobileNumber).IsUnique();
        });

        modelBuilder.Entity<MemberProfile>(b =>
        {
            b.ToTable("MemberProfiles");
            b.HasKey(m => m.Id);
            b.Property(m => m.BarcodeCode).HasMaxLength(32).IsRequired();
            b.Property(m => m.BloodType).HasMaxLength(5);
            b.Property(m => m.MedicalConditions).HasMaxLength(500);
            b.HasIndex(m => m.BarcodeCode).IsUnique();

            b.HasOne(m => m.User)
             .WithOne(u => u.MemberProfile)
             .HasForeignKey<MemberProfile>(m => m.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MemberSubscription>(b =>
        {
            b.ToTable("MemberSubscriptions", t =>
            {
                t.HasCheckConstraint("CK_MemberSubscriptions_RemainingSessions", "[RemainingSessions] >= 0");
            });
            b.HasKey(s => s.Id);
            b.Property(s => s.RowVersion).IsRowVersion();
            b.HasIndex(s => new { s.MemberProfileId, s.Status, s.ExpirationDateUtc });
        });

        modelBuilder.Entity<AttendanceLog>(b =>
        {
            b.ToTable("AttendanceLogs");
            b.HasKey(a => a.Id);
            b.Property(a => a.AssignedLockerNumber).HasMaxLength(16);
            b.Property(a => a.DenialReason).HasMaxLength(250);
            b.HasIndex(a => a.CheckInTimeUtc);
        });
    }
}`,
  },
  {
    id: 'attendance-controller',
    title: '۲. کنترلر اصلی ثبت تردد و کسر خودکار جلسه (.NET 10 Web API)',
    subtitle: 'Transaction Safety, Optimistic Concurrency, Session Deduction & Iranian SMS Hook',
    language: 'csharp',
    filename: 'src/ParsGym.Api/Controllers/AttendanceController.cs',
    description:
      'کنترلر کامل ASP.NET Core 10 با امنیت سطح دسترسی (RBAC)، تراکنش اتمیک دیتابیس (RepeatableRead)، بررسی تاریخ انقضا و جلسات باقی‌مانده، کسر دقیقاً ۱ جلسه در هر بار اسکن بارکد و ارسال پیامک هشدار تمدید.',
    code: `using System;
using System.Data;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParsGym.Domain.Entities;
using ParsGym.Infrastructure.Persistence;

namespace ParsGym.Api.Controllers;

public record CheckInRequestDto(string Identifier, string? RequestedLockerNumber);

public record CheckInResponseDto(
    bool Success,
    string ErrorCode,
    string Message,
    string? WarningMessage,
    string MemberFullName,
    string MembershipBarcode,
    string PlanTitle,
    int TotalSessions,
    int RemainingSessionsAfter,
    int DaysUntilExpiration,
    string? AssignedLocker,
    DateTime CheckInTimeUtc
);

public interface ISmsNotificationService
{
    Task SendLowSessionAlertAsync(string mobile, string fullName, int remainingSessions, CancellationToken ct);
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin,Receptionist")]
public class AttendanceController : ControllerBase
{
    private readonly GymDbContext _dbContext;
    private readonly ISmsNotificationService _smsService;

    public AttendanceController(GymDbContext dbContext, ISmsNotificationService smsService)
    {
        _dbContext = dbContext;
        _smsService = smsService;
    }

    [HttpPost("check-in")]
    [ProducesResponseType(typeof(CheckInResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CheckInResponseDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(CheckInResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckInAsync(
        [FromBody] CheckInRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier))
        {
            return BadRequest(new { message = "بارکد یا کد ملی ورزشکار الزامی است." });
        }

        var normalizedInput = request.Identifier.Trim().ToUpperInvariant();
        var nowUtc = DateTime.UtcNow;

        // Begin Atomic SQL Server Transaction to prevent double-scan race conditions
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.RepeatableRead, cancellationToken);

        try
        {
            var member = await _dbContext.MemberProfiles
                .Include(m => m.User)
                .Include(m => m.Subscriptions)
                    .ThenInclude(s => s.Plan)
                .FirstOrDefaultAsync(m =>
                    m.BarcodeCode == normalizedInput ||
                    m.User.NationalCode == normalizedInput,
                    cancellationToken);

            if (member is null)
            {
                return NotFound(new CheckInResponseDto(
                    Success: false,
                    ErrorCode: "MEMBER_NOT_FOUND",
                    Message: $"ورزشکاری با کد یا بارکد '{normalizedInput}' یافت نشد.",
                    WarningMessage: null,
                    MemberFullName: "-",
                    MembershipBarcode: normalizedInput,
                    PlanTitle: "-",
                    TotalSessions: 0,
                    RemainingSessionsAfter: 0,
                    DaysUntilExpiration: 0,
                    AssignedLocker: null,
                    CheckInTimeUtc: nowUtc));
            }

            // Locate latest subscription
            var activeSub = member.Subscriptions
                .OrderByDescending(s => s.ExpirationDateUtc)
                .FirstOrDefault();

            if (activeSub is null)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new CheckInResponseDto(
                    false, "NO_SUBSCRIPTION",
                    $"برای {member.User.FullName} هیچ اشتراک فعالی ثبت نشده است.",
                    null, member.User.FullName, member.BarcodeCode, "-", 0, 0, 0, null, nowUtc));
            }

            // Business Rule 1: Check Expiration Date
            if (activeSub.Status == SubscriptionStatus.Expired || activeSub.ExpirationDateUtc < nowUtc)
            {
                activeSub.Status = SubscriptionStatus.Expired;
                await LogDeniedAttendanceAsync(member.Id, activeSub.Id, "انقضای تاریخ اشتراک", cancellationToken);
                await _dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return StatusCode(StatusCodes.Status403Forbidden, new CheckInResponseDto(
                    false, "SUBSCRIPTION_EXPIRED",
                    $"مهلت زمانی اشتراک {member.User.FullName} به پایان رسیده است.",
                    null, member.User.FullName, member.BarcodeCode, activeSub.Plan.Title,
                    activeSub.TotalSessions, activeSub.RemainingSessions, 0, null, nowUtc));
            }

            // Business Rule 2: Check Remaining Sessions > 0
            if (activeSub.RemainingSessions <= 0)
            {
                activeSub.Status = SubscriptionStatus.Exhausted;
                await LogDeniedAttendanceAsync(member.Id, activeSub.Id, "اتمام سقف جلسات", cancellationToken);
                await _dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return StatusCode(StatusCodes.Status403Forbidden, new CheckInResponseDto(
                    false, "NO_REMAINING_SESSIONS",
                    $"تعداد جلسات اشتراک {member.User.FullName} به پایان رسیده است (۰ جلسه باقی‌مانده).",
                    null, member.User.FullName, member.BarcodeCode, activeSub.Plan.Title,
                    activeSub.TotalSessions, 0,
                    (int)Math.Ceiling((activeSub.ExpirationDateUtc - nowUtc).TotalDays),
                    null, nowUtc));
            }

            // Business Rule 3: Deduct EXACTLY ONE Session
            activeSub.RemainingSessions -= 1;
            if (activeSub.RemainingSessions == 0)
            {
                activeSub.Status = SubscriptionStatus.Exhausted;
            }

            var receptionistId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid)
                ? uid
                : Guid.Empty;

            var attendanceLog = new AttendanceLog
            {
                MemberProfileId = member.Id,
                SubscriptionId = activeSub.Id,
                CheckInTimeUtc = nowUtc,
                RemainingSessionsAfterCheckIn = activeSub.RemainingSessions,
                AssignedLockerNumber = request.RequestedLockerNumber ?? "A-12",
                ProcessedByUserId = receptionistId,
                IsAllowed = true
            };

            _dbContext.AttendanceLogs.Add(attendanceLog);
            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var daysLeft = Math.Max(0, (int)Math.Ceiling((activeSub.ExpirationDateUtc - nowUtc).TotalDays));
            string? warning = null;

            // Trigger Iranian SMS Gateway if remaining sessions <= 3
            if (activeSub.RemainingSessions <= 3)
            {
                warning = $"هشدار: تنها {activeSub.RemainingSessions} جلسه تا پایان اشتراک باقی مانده است.";
                _ = _smsService.SendLowSessionAlertAsync(
                    member.User.MobileNumber,
                    member.User.FullName,
                    activeSub.RemainingSessions,
                    CancellationToken.None);
            }

            return Ok(new CheckInResponseDto(
                Success: true,
                ErrorCode: "OK",
                Message: $"ورود {member.User.FullName} ثبت شد و ۱ جلسه از اشتراک کسر گردید.",
                WarningMessage: warning,
                MemberFullName: member.User.FullName,
                MembershipBarcode: member.BarcodeCode,
                PlanTitle: activeSub.Plan.Title,
                TotalSessions: activeSub.TotalSessions,
                RemainingSessionsAfter: activeSub.RemainingSessions,
                DaysUntilExpiration: daysLeft,
                AssignedLocker: attendanceLog.AssignedLockerNumber,
                CheckInTimeUtc: nowUtc));
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Conflict(new { message = "خطای همزمانی در ثبت تردد؛ لطفاً مجدداً اسکن کنید." });
        }
    }

    private Task LogDeniedAttendanceAsync(Guid memberId, Guid subId, string reason, CancellationToken ct)
    {
        _dbContext.AttendanceLogs.Add(new AttendanceLog
        {
            MemberProfileId = memberId,
            SubscriptionId = subId,
            IsAllowed = false,
            DenialReason = reason,
            RemainingSessionsAfterCheckIn = 0
        });
        return Task.CompletedTask;
    }
}`,
  },
  {
    id: 'react-axios-checkin',
    title: '۳. کامپوننت React پذیرش و اسکن بارکد (React + Tailwind + Axios)',
    subtitle: 'Barcode Reader Input, Real-Time Session Deduction & Access Control Feedback',
    language: 'tsx',
    filename: 'src/ParsGym.Web/src/components/ReceptionCheckIn.tsx',
    description:
      'کامپوننت واکنش‌گرای میز پذیرش باشگاه با پشتیبانی از دستگاه بارکدخوان (USB Keyboard Wedge) و ورود دستی کد ملی/کد عضویت، فراخوانی API با Axios، نمایش نوار جلسات باقی‌مانده و هشدارهای صوتی/تصویری.',
    code: `import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface CheckInResponse {
  success: boolean;
  errorCode: string;
  message: string;
  warning?: string | null;
  remainingSessionsAfter: number;
  totalSessions: number;
  daysRemaining: number;
  lockerAssigned: string;
  member: {
    fullName: string;
    membershipCode: string;
    nationalCode: string;
    planTitle: string;
    coachName: string;
    expirationShamsi: string;
  };
}

export const ReceptionCheckInDesk: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [lockerInput, setLockerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await axios.post<CheckInResponse>('/api/attendance/check-in', {
        identifier: identifier.trim(),
        requestedLocker: lockerInput.trim() || undefined,
      });

      setResult(response.data);
      setIdentifier('');
      inputRef.current?.focus();
    } catch (err: any) {
      const apiError = err.response?.data;
      setErrorMsg(apiError?.message || 'خطا در ارتباط با سرور پذیرش باشگاه');
      if (apiError?.member) {
        setResult({
          success: false,
          errorCode: apiError.errorCode || 'DENIED',
          message: apiError.message,
          remainingSessionsAfter: apiError.member.remainingSessions,
          totalSessions: apiError.member.totalSessions,
          daysRemaining: 0,
          lockerAssigned: '-',
          member: apiError.member,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-100">
      <h2 className="text-xl font-bold mb-4">گیت کنترل تردد و اسکن بارکد ورزشکاران</h2>
      <form onSubmit={handleCheckIn} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input
          ref={inputRef}
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="اسکن بارکد (مثلاً GYM-1405-1001) یا کد ملی..."
          className="md:col-span-2 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm"
        />
        <input
          type="text"
          value={lockerInput}
          onChange={(e) => setLockerInput(e.target.value)}
          placeholder="شماره کمد (اختیاری)"
          className="px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'در حال بررسی...' : 'ثبت ورود و کسر جلسه'}
        </button>
      </form>

      {errorMsg && (
        <div className="p-4 mb-4 bg-rose-950/60 border border-rose-700/60 rounded-lg text-rose-200 text-sm">
          {errorMsg}
        </div>
      )}

      {result && result.success && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-700/60 rounded-lg text-emerald-100 text-sm space-y-2">
          <div className="font-bold text-base">{result.message}</div>
          <div className="font-mono tabular-nums">
            جلسات باقی‌مانده: {result.remainingSessionsAfter} از {result.totalSessions} · کمد: {result.lockerAssigned}
          </div>
          {result.warning && <div className="text-amber-300 font-medium">{result.warning}</div>}
        </div>
      )}
    </div>
  );
};`,
  },
  {
    id: 'folder-structure-guide',
    title: '۴. ساختار پوشه‌ها و راهنمای راه‌اندازی پروژه (Clean Architecture)',
    subtitle: '.NET 10 Solution Tree, SQL Server Migration CLI & Iranian Payment/SMS Gateways',
    language: 'bash',
    filename: 'ARCHITECTURE_AND_SETUP.md',
    description:
      'ساختار استاندارد Clean Architecture برای بک‌اند .NET 10 و فرانت‌اند React، دستورات راه‌اندازی دیتابیس SQL Server و پیکربندی درگاه زرین‌پال و کاوه‌نگار.',
    code: `# ۱. ساختار پوشه‌های پروژه (Clean Architecture - .NET 10 + React 19)

ParsGymSolution/
├── src/
│   ├── ParsGym.Domain/                   # لایه هسته و موجودیت‌ها (بدون وابستگی خارجی)
│   │   ├── Entities/
│   │   │   ├── AppUser.cs
│   │   │   ├── MemberProfile.cs
│   │   │   ├── MemberSubscription.cs     # شامل RowVersion جهت جلوگیری از اسکن همزمان
│   │   │   ├── AttendanceLog.cs
│   │   │   ├── LockerContract.cs
│   │   │   ├── CanteenProduct.cs
│   │   │   └── FinancialTransaction.cs
│   │   └── Enums/
│   │       ├── UserRole.cs               # SuperAdmin, Receptionist, Coach, Member
│   │       └── SubscriptionStatus.cs
│   │
│   ├── ParsGym.Application/              # منطق تجاری، DTOها و اینترفیس‌های درگاه پرداخت/پیامک
│   │   ├── Interfaces/
│   │   │   ├── IZarinPalGatewayService.cs
│   │   │   └── ISmsNotificationService.cs
│   │   └── Services/
│   │       ├── AttendanceService.cs
│   │       └── AccountingService.cs
│   │
│   ├── ParsGym.Infrastructure/           # پیاده‌سازی EF Core 10، SQL Server و وب‌سرویس‌های ایران
│   │   ├── Persistence/
│   │   │   ├── GymDbContext.cs
│   │   │   └── Migrations/
│   │   ├── Gateways/
│   │   │   └── ZarinPalPaymentService.cs # اتصال به REST API v4 زرین‌پال (ریال/تومان)
│   │   └── Sms/
│   │       └── KavenegarSmsService.cs    # ارسال پترن پیامک خوش‌آمدگویی، تولد و هشدار تمدید
│   │
│   ├── ParsGym.Api/                      #ASP.NET Core 10 Web API
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs         # JWT + RBAC Claims
│   │   │   ├── AttendanceController.cs   # ثبت ورود و کسر خودکار ۱ جلسه
│   │   │   ├── MembersController.cs
│   │   │   ├── LockersController.cs
│   │   │   └── FinancialsController.cs
│   │   ├── appsettings.json
│   │   └── Program.cs
│   │
│   └── ParsGym.Web/                      # پروژه فرانت‌اند (React 19 + TypeScript + Tailwind + Axios)
│       ├── src/
│       │   ├── api/axiosClient.ts
│       │   ├── components/
│       │   │   ├── ReceptionCheckIn.tsx  # گیت پذیرش و اسکنر بارکد
│       │   │   ├── MemberDirectory.tsx
│       │   │   ├── LockerGridMap.tsx
│       │   │   └── CanteenPos.tsx
│       │   └── App.tsx
│       └── package.json

# ۲. دستورات ساخت و اجرای دیتابیس SQL Server و پروژه .NET 10

# ساخت Solution و پروژه‌ها
dotnet new sln -n ParsGymSolution
dotnet new webapi -n ParsGym.Api -f net10.0
dotnet add src/ParsGym.Api package Microsoft.EntityFrameworkCore.SqlServer --version 10.0.0
dotnet add src/ParsGym.Api package Microsoft.EntityFrameworkCore.Design --version 10.0.0
dotnet add src/ParsGym.Api package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.0

# ایجاد Migration و ساخت جداول در SQL Server
dotnet ef migrations add InitialIranianGymSchema --project src/ParsGym.Infrastructure --startup-project src/ParsGym.Api
dotnet ef database update --project src/ParsGym.Infrastructure --startup-project src/ParsGym.Api

# اجرای سرور API روی پورت 5000
dotnet run --project src/ParsGym.Api`,
  },
];
