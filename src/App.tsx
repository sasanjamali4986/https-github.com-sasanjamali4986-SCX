import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Sun, Moon, Shield, LogIn, LogOut } from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  GymMember,
  AttendanceRecord,
  FinancialRecord,
  LockerItem,
  CanteenProduct,
  GymClassItem,
  SmsLogItem,
  UserRole,
  INITIAL_MEMBERS,
  INITIAL_ATTENDANCES,
  INITIAL_TRANSACTIONS,
  INITIAL_LOCKERS,
  INITIAL_CANTEEN,
  INITIAL_CLASSES,
  INITIAL_SMS_LOGS,
} from './data/gymData';
import { ReceptionCheckInDesk } from './components/ReceptionCheckInDesk';
import { MembersAndCardsView } from './components/MembersAndCardsView';
import { OperationsHubView } from './components/OperationsHubView';
import { DotNetArchitectureView } from './components/DotNetArchitectureView';

type MainTab = 'CHECKIN' | 'MEMBERS' | 'LOCKERS_POS' | 'FINANCE_CLASSES' | 'DOTNET_CODE';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('CHECKIN');
  const [opsSubTab, setOpsSubTab] = useState<'LOCKERS' | 'CANTEEN' | 'CLASSES' | 'FINANCIAL_SMS'>('LOCKERS');
  const [currentRole, setCurrentRole] = useState<UserRole>('Receptionist');
  const [isDark, setIsDark] = useState(true);

  // Firebase Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Core Application State (seeded with rich Iranian Gym data & synced with Firestore when signed in)
  const [members, setMembers] = useState<GymMember[]>(INITIAL_MEMBERS);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCES);
  const [transactions, setTransactions] = useState<FinancialRecord[]>(INITIAL_TRANSACTIONS);
  const [lockers, setLockers] = useState<LockerItem[]>(INITIAL_LOCKERS);
  const [canteenProducts, setCanteenProducts] = useState<CanteenProduct[]>(INITIAL_CANTEEN);
  const [classes, setClasses] = useState<GymClassItem[]>(INITIAL_CLASSES);
  const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>(INITIAL_SMS_LOGS);

  // Sync dark mode class on <html> and <body>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Keep backend Express memory synced for Axios /api/attendance/check-in requests
  useEffect(() => {
    axios.post('/api/members/sync', { members }).catch(() => {
      // ignore background sync error
    });
  }, [members]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore real-time listeners (strictly scoped by ownerId == user.uid per security rules)
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const membersQuery = query(collection(db, 'members'), where('ownerId', '==', user.uid));
    const unsubMembers = onSnapshot(
      membersQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed initial members into Firestore for this authenticated user
          for (const seedMember of INITIAL_MEMBERS) {
            const docId = `${user.uid.slice(0, 8)}_${seedMember.id}`;
            try {
              await setDoc(doc(db, 'members', docId), {
                ownerId: user.uid,
                fullName: seedMember.fullName,
                nationalCode: seedMember.nationalCode,
                phone: seedMember.phone,
                membershipCode: seedMember.membershipCode,
                bloodType: seedMember.bloodType,
                medicalNotes: seedMember.medicalNotes,
                planTitle: seedMember.planTitle,
                coachName: seedMember.coachName,
                totalSessions: seedMember.totalSessions,
                remainingSessions: seedMember.remainingSessions,
                expirationDate: seedMember.expirationDate,
                expirationShamsi: seedMember.expirationShamsi,
                status: seedMember.status,
                lockerNumber: seedMember.lockerNumber,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `members/${docId}`);
            }
          }
        } else {
          const loaded: GymMember[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              fullName: data.fullName,
              nationalCode: data.nationalCode,
              phone: data.phone,
              membershipCode: data.membershipCode,
              bloodType: data.bloodType,
              medicalNotes: data.medicalNotes,
              planTitle: data.planTitle,
              coachName: data.coachName,
              totalSessions: data.totalSessions,
              remainingSessions: data.remainingSessions,
              expirationDate: data.expirationDate,
              expirationShamsi: data.expirationShamsi,
              status: data.status,
              lockerNumber: data.lockerNumber,
            };
          });
          setMembers(loaded);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'members')
    );

    const attQuery = query(collection(db, 'attendances'), where('ownerId', '==', user.uid));
    const unsubAtt = onSnapshot(
      attQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: AttendanceRecord[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              memberId: data.memberId,
              memberName: data.memberName,
              membershipCode: data.membershipCode,
              planTitle: data.planTitle,
              checkInShamsi: data.checkInShamsi,
              remainingSessionsAfter: data.remainingSessionsAfter,
              lockerAssigned: data.lockerAssigned,
              status: data.status,
              notes: data.notes,
            };
          });
          setAttendances(loaded);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'attendances')
    );

    const txQuery = query(collection(db, 'transactions'), where('ownerId', '==', user.uid));
    const unsubTx = onSnapshot(
      txQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: FinancialRecord[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              title: data.title,
              category: data.category,
              type: data.type,
              amount: data.amount,
              taxAmount: data.taxAmount,
              discountCode: data.discountCode,
              paymentGateway: data.paymentGateway,
              trackingCode: data.trackingCode,
              memberName: data.memberName,
              dateShamsi: data.dateShamsi,
            };
          });
          setTransactions(loaded);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'transactions')
    );

    return () => {
      unsubMembers();
      unsubAtt();
      unsubTx();
    };
  }, [isAuthReady, user]);

  const handleGoogleAuth = async () => {
    if (user) {
      await signOut(auth);
    } else {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        console.error('Google Sign-In failed:', err);
      }
    }
  };

  // Handler: Successful Check-in & Session Deduction
  const handleCheckInSuccess = async (
    updatedMember: GymMember,
    attendanceRecord: AttendanceRecord,
    warningText: string | null
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    setAttendances((prev) => [attendanceRecord, ...prev]);

    if (warningText) {
      setSmsLogs((prev) => [
        {
          id: `sms_${Date.now()}`,
          recipientName: updatedMember.fullName,
          recipientPhone: updatedMember.phone,
          templateType: 'RenewalWarning',
          messageBody: `${updatedMember.fullName} عزیز، تنها ${updatedMember.remainingSessions} جلسه از اشتراک شما باقی مانده است. جهت تمدید آنلاین: parsgym.ir/pay`,
          provider: 'Kavenegar',
          sentAtShamsi: attendanceRecord.checkInShamsi,
          deliveryStatus: 'Delivered',
        },
        ...prev,
      ]);
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'members', updatedMember.id), {
          remainingSessions: updatedMember.remainingSessions,
          status: updatedMember.status,
          lockerNumber: updatedMember.lockerNumber.slice(0, 16),
          updatedAt: serverTimestamp(),
        });

        const attId = `att_${Date.now()}`;
        await setDoc(doc(db, 'attendances', attId), {
          ownerId: user.uid,
          memberId: updatedMember.id,
          memberName: attendanceRecord.memberName.slice(0, 80),
          membershipCode: attendanceRecord.membershipCode.slice(0, 32),
          planTitle: attendanceRecord.planTitle.slice(0, 80),
          checkInShamsi: attendanceRecord.checkInShamsi.slice(0, 40),
          remainingSessionsAfter: attendanceRecord.remainingSessionsAfter,
          lockerAssigned: attendanceRecord.lockerAssigned.slice(0, 16),
          status: 'Allowed',
          notes: attendanceRecord.notes.slice(0, 160),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `members/${updatedMember.id}`);
      }
    }
  };

  // Handler: Denied Check-in Log
  const handleCheckInDenied = async (attendanceRecord: AttendanceRecord) => {
    setAttendances((prev) => [attendanceRecord, ...prev]);
    if (user) {
      const attId = `att_${Date.now()}`;
      try {
        await setDoc(doc(db, 'attendances', attId), {
          ownerId: user.uid,
          memberId: attendanceRecord.memberId,
          memberName: attendanceRecord.memberName.slice(0, 80),
          membershipCode: attendanceRecord.membershipCode.slice(0, 32),
          planTitle: attendanceRecord.planTitle.slice(0, 80),
          checkInShamsi: attendanceRecord.checkInShamsi.slice(0, 40),
          remainingSessionsAfter: Math.max(0, attendanceRecord.remainingSessionsAfter),
          lockerAssigned: '-',
          status: 'Denied',
          notes: attendanceRecord.notes.slice(0, 160),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `attendances/${attId}`);
      }
    }
  };

  // Handler: Add New Member
  const handleAddMember = async (newMemberData: Omit<GymMember, 'id'>) => {
    const newId = user ? `${user.uid.slice(0, 8)}_mem_${Date.now()}` : `mem_${Date.now()}`;
    const created: GymMember = {
      ...newMemberData,
      id: newId,
      ownerId: user?.uid,
    };

    setMembers((prev) => [created, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'members', newId), {
          ownerId: user.uid,
          fullName: created.fullName.slice(0, 80),
          nationalCode: created.nationalCode,
          phone: created.phone,
          membershipCode: created.membershipCode.slice(0, 32),
          bloodType: created.bloodType,
          medicalNotes: created.medicalNotes.slice(0, 300),
          planTitle: created.planTitle.slice(0, 80),
          coachName: created.coachName.slice(0, 80),
          totalSessions: created.totalSessions,
          remainingSessions: created.remainingSessions,
          expirationDate: created.expirationDate.slice(0, 32),
          expirationShamsi: created.expirationShamsi.slice(0, 20),
          status: created.status,
          lockerNumber: created.lockerNumber.slice(0, 16),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `members/${newId}`);
      }
    }
  };

  // Handler: Subscription Renewal (ZarinPal)
  const handleRenewMember = async (
    member: GymMember,
    addedSessions: number,
    amountTomans: number
  ) => {
    const newRemaining = member.remainingSessions + addedSessions;
    const newTotal = Math.max(member.totalSessions, newRemaining);
    const updated: GymMember = {
      ...member,
      totalSessions: newTotal,
      remainingSessions: newRemaining,
      status: 'Active',
      expirationDate: '2027-01-25',
      expirationShamsi: '۱۴۰۵/۱۱/۰۵',
    };

    setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));

    const newTx: FinancialRecord = {
      id: `trx_${Date.now()}`,
      ownerId: user?.uid,
      title: `تمدید آنلاین اشتراک (${addedSessions} جلسه) - ${member.fullName}`,
      category: 'Tuition',
      type: 'Income',
      amount: amountTomans,
      taxAmount: Math.round(amountTomans * 0.1),
      discountCode: '-',
      paymentGateway: 'ZarinPal',
      trackingCode: `ZP-${Math.floor(10000000 + Math.random() * 90000000)}`,
      memberName: member.fullName,
      dateShamsi: '۱۴۰۵/۰۸/۱۸',
    };

    setTransactions((prev) => [newTx, ...prev]);

    setSmsLogs((prev) => [
      {
        id: `sms_${Date.now()}`,
        recipientName: member.fullName,
        recipientPhone: member.phone,
        templateType: 'PaymentReceipt',
        messageBody: `${member.fullName} عزیز، تمدید اشتراک شما (${addedSessions} جلسه) از طریق درگاه زرین‌پال با کد رهگیری ${newTx.trackingCode} ثبت شد.`,
        provider: 'Kavenegar',
        sentAtShamsi: '۱۴۰۵/۰۸/۱۸ - اکنون',
        deliveryStatus: 'Delivered',
      },
      ...prev,
    ]);

    if (user) {
      try {
        await updateDoc(doc(db, 'members', member.id), {
          fullName: updated.fullName,
          phone: updated.phone,
          bloodType: updated.bloodType,
          medicalNotes: updated.medicalNotes,
          planTitle: updated.planTitle,
          coachName: updated.coachName,
          totalSessions: updated.totalSessions,
          remainingSessions: updated.remainingSessions,
          expirationDate: updated.expirationDate,
          expirationShamsi: updated.expirationShamsi,
          status: updated.status,
          lockerNumber: updated.lockerNumber,
          updatedAt: serverTimestamp(),
        });

        await setDoc(doc(db, 'transactions', newTx.id), {
          ownerId: user.uid,
          title: newTx.title.slice(0, 100),
          category: newTx.category,
          type: newTx.type,
          amount: newTx.amount,
          taxAmount: newTx.taxAmount,
          discountCode: newTx.discountCode.slice(0, 30),
          paymentGateway: newTx.paymentGateway,
          trackingCode: newTx.trackingCode.slice(0, 40),
          memberName: newTx.memberName.slice(0, 80),
          dateShamsi: newTx.dateShamsi.slice(0, 30),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `members/${member.id}`);
      }
    }
  };

  // Handler: Canteen POS Checkout
  const handleCheckoutCanteenPos = async (
    cartItems: { product: CanteenProduct; qty: number }[],
    paymentGateway: FinancialRecord['paymentGateway'],
    buyerName: string
  ) => {
    const total = cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    const summaryTitle = `فروش بوفه: ${cartItems
      .map((i) => `${i.product.name} (${i.qty})`)
      .join(' + ')}`.slice(0, 100);

    setCanteenProducts((prev) =>
      prev.map((prod) => {
        const found = cartItems.find((c) => c.product.id === prod.id);
        return found ? { ...prod, stock: Math.max(0, prod.stock - found.qty) } : prod;
      })
    );

    await handleAddTransaction({
      title: summaryTitle,
      category: 'Buffet',
      type: 'Income',
      amount: total,
      taxAmount: Math.round(total * 0.1),
      discountCode: '-',
      paymentGateway,
      trackingCode: `POS-${Math.floor(100000 + Math.random() * 900000)}`,
      memberName: buyerName,
      dateShamsi: '۱۴۰۵/۰۸/۱۸',
    });
  };

  // Handler: Add Financial Transaction
  const handleAddTransaction = async (txData: Omit<FinancialRecord, 'id'>) => {
    const txId = `trx_${Date.now()}`;
    const record: FinancialRecord = { ...txData, id: txId, ownerId: user?.uid };
    setTransactions((prev) => [record, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'transactions', txId), {
          ownerId: user.uid,
          title: record.title.slice(0, 100),
          category: record.category,
          type: record.type,
          amount: record.amount,
          taxAmount: record.taxAmount,
          discountCode: record.discountCode.slice(0, 30),
          paymentGateway: record.paymentGateway,
          trackingCode: record.trackingCode.slice(0, 40),
          memberName: record.memberName.slice(0, 80),
          dateShamsi: record.dateShamsi.slice(0, 30),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `transactions/${txId}`);
      }
    }
  };

  // KPI metrics
  const activeMembersCount = members.filter(
    (m) => m.status === 'Active' && m.remainingSessions > 0
  ).length;
  const lowCreditMembersCount = members.filter(
    (m) => m.remainingSessions <= 3 || m.status === 'Expired'
  ).length;
  const allowedTodayCount = attendances.filter((a) => a.status === 'Allowed').length;
  const netBalance = transactions.reduce(
    (acc, t) => (t.type === 'Income' ? acc + t.amount : acc - t.amount),
    0
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('CHECKIN');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          ParsGym Pro
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('CHECKIN')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
              activeTab === 'CHECKIN'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent'
            }`}
          >
            پذیرش و اسکن
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MEMBERS')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
              activeTab === 'MEMBERS'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent'
            }`}
          >
            اعضا و اشتراک
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('LOCKERS_POS');
              setOpsSubTab('LOCKERS');
            }}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
              activeTab === 'LOCKERS_POS'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent'
            }`}
          >
            کمدها و بوفه
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('FINANCE_CLASSES');
              setOpsSubTab('FINANCIAL_SMS');
            }}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
              activeTab === 'FINANCE_CLASSES'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent'
            }`}
          >
            مالی و کلاس‌ها
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOTNET_CODE')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
              activeTab === 'DOTNET_CODE'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent'
            }`}
          >
            معماری .NET 10
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            {user ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج ({user.displayName || user.email?.split('@')[0]})</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>اتصال ابری مدیر</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Workspace Toolbar: RBAC Role Switcher, Mobile Navigation & Theme Toggle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>سطح دسترسی فعال (RBAC):</span>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(
                [
                  { role: 'SuperAdmin', label: 'مدیر کل (Super Admin)' },
                  { role: 'Receptionist', label: 'منشی پذیرش (Receptionist)' },
                  { role: 'Coach', label: 'مربی (Coach)' },
                  { role: 'Member', label: 'ورزشکار (Member)' },
                ] as const
              ).map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setCurrentRole(r.role)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    currentRole === r.role
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
            {/* Mobile quick nav */}
            <div className="flex md:hidden flex-wrap items-center gap-1">
              {(
                [
                  { id: 'CHECKIN', label: 'پذیرش' },
                  { id: 'MEMBERS', label: 'اعضا' },
                  { id: 'LOCKERS_POS', label: 'کمد/بوفه' },
                  { id: 'FINANCE_CLASSES', label: 'مالی/کلاس' },
                  { id: 'DOTNET_CODE', label: '.NET 10' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveTab(m.id)}
                  className={`px-2.5 py-1 text-xs rounded-md ${
                    activeTab === m.id
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              تقویم: دوشنبه ۱۸ آبان ۱۴۰۵
            </div>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors cursor-pointer"
              title="تغییر تم روشن / تاریک"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 4-Column Full-Width KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ورزشکاران دارای اشتراک فعال
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {activeMembersCount} نفر
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                کل پرونده‌ها: {members.length}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ورودهای موفق و جلسات کسرشده امروز
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {allowedTodayCount} جلسه
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                رد شده: {attendances.length - allowedTodayCount}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              اشتراک‌های نیازمند تمدید (≤۳ جلسه یا منقضی)
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {lowCreditMembersCount} پرونده
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                پیامک خودکار فعال
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              تراز خالص صندوق باشگاه
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {netBalance.toLocaleString('fa-IR')} ت
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                زرین‌پال / POS
              </span>
            </div>
          </div>
        </div>

        {/* Active Module Viewport */}
        {activeTab === 'CHECKIN' && (
          <ReceptionCheckInDesk
            members={members}
            attendances={attendances}
            currentRole={currentRole}
            onCheckInSuccess={handleCheckInSuccess}
            onCheckInDenied={handleCheckInDenied}
            onQuickRenewMember={handleRenewMember}
          />
        )}

        {activeTab === 'MEMBERS' && (
          <MembersAndCardsView
            members={members}
            currentRole={currentRole}
            onAddMember={handleAddMember}
            onRenewMember={handleRenewMember}
            onSelectForScanner={(code) => {
              setActiveTab('CHECKIN');
              axios
                .post('/api/attendance/check-in', {
                  identifier: code,
                  memberSnapshot: members.find((m) => m.membershipCode === code),
                })
                .then((res) => {
                  const data = res.data;
                  if (data.success && data.member) {
                    handleCheckInSuccess(
                      data.member,
                      {
                        id: `att_${Date.now()}`,
                        memberId: data.member.id,
                        memberName: data.member.fullName,
                        membershipCode: data.member.membershipCode,
                        planTitle: data.member.planTitle,
                        checkInShamsi: '۱۴۰۵/۰۸/۱۸ - اکنون',
                        remainingSessionsAfter: data.remainingSessionsAfter,
                        lockerAssigned: data.lockerAssigned || 'A-12',
                        status: 'Allowed',
                        notes: 'ورود مستقیم از کارت دیجیتال (۱ جلسه کسر شد)',
                      },
                      data.warning || null
                    );
                  }
                })
                .catch(() => {
                  // handled on reception screen
                });
            }}
          />
        )}

        {(activeTab === 'LOCKERS_POS' || activeTab === 'FINANCE_CLASSES') && (
          <OperationsHubView
            activeSubTab={opsSubTab}
            onChangeSubTab={setOpsSubTab}
            lockers={lockers}
            onUpdateLocker={(lockerId, updates) =>
              setLockers((prev) =>
                prev.map((l) => (l.id === lockerId ? { ...l, ...updates } : l))
              )
            }
            canteenProducts={canteenProducts}
            onCheckoutCanteenPos={handleCheckoutCanteenPos}
            classes={classes}
            onBookClassSeat={(classId) =>
              setClasses((prev) =>
                prev.map((c) =>
                  c.id === classId && c.enrolledCount < c.capacity
                    ? { ...c, enrolledCount: c.enrolledCount + 1 }
                    : c
                )
              )
            }
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            smsLogs={smsLogs}
            onSendSms={(smsData) =>
              setSmsLogs((prev) => [
                {
                  ...smsData,
                  id: `sms_${Date.now()}`,
                  sentAtShamsi: '۱۴۰۵/۰۸/۱۸ - اکنون',
                  deliveryStatus: 'Delivered',
                },
                ...prev,
              ])
            }
            members={members}
          />
        )}

        {activeTab === 'DOTNET_CODE' && <DotNetArchitectureView />}
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-[1380px] mx-auto px-6 py-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>ParsGym Pro — سامانه جامع مدیریت باشگاه‌های ورزشی ایران</div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('DOTNET_CODE')}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            مشاهده کدهای C# .NET 10 و SQL Server
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setActiveTab('CHECKIN')}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            گیت پذیرش و اسکن بارکد
          </button>
        </div>
      </footer>
    </div>
  );
}
