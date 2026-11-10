import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  onAuthStateChanged,
  signInWithPopup,
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
import {
  Sun,
  Moon,
  Shield,
  LogOut,
  Building2,
  Plus,
  UserCheck,
  Cloud,
  CalendarCheck,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  GymClub,
  AuthAccount,
  GymMember,
  AttendanceRecord,
  FinancialRecord,
  LockerItem,
  CanteenProduct,
  GymClassItem,
  SmsLogItem,
  UserRole,
  INITIAL_CLUBS,
  INITIAL_AUTH_ACCOUNTS,
  INITIAL_MEMBERS,
  INITIAL_ATTENDANCES,
  INITIAL_TRANSACTIONS,
  INITIAL_LOCKERS,
  INITIAL_CANTEEN,
  INITIAL_CLASSES,
  INITIAL_SMS_LOGS,
} from './data/gymData';
import { LoginView } from './components/LoginView';
import { ClubsManagementView } from './components/ClubsManagementView';
import { ReceptionCheckInDesk } from './components/ReceptionCheckInDesk';
import { MembersAndCardsView } from './components/MembersAndCardsView';
import { ClassBookingAndCoachView } from './components/ClassBookingAndCoachView';
import { OperationsHubView } from './components/OperationsHubView';
import { DotNetArchitectureView } from './components/DotNetArchitectureView';

type MainTab =
  | 'CHECKIN'
  | 'CLASS_BOOKING'
  | 'CLUBS'
  | 'MEMBERS'
  | 'LOCKERS_POS'
  | 'DOTNET_CODE';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('LOCKERS_POS');
  const [opsSubTab, setOpsSubTab] = useState<
    'LOCKERS' | 'CANTEEN' | 'CLASSES' | 'FINANCIAL_SMS'
  >('LOCKERS');

  // Username & Password Auth Account State
  const [loggedInAccount, setLoggedInAccount] = useState<AuthAccount | null>(
    INITIAL_AUTH_ACCOUNTS[1]
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('Receptionist');
  const [isDark, setIsDark] = useState(true);

  // Firebase Cloud Auth state (optional cloud persistence)
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Core Application State
  const [clubs, setClubs] = useState<GymClub[]>(INITIAL_CLUBS);
  const [selectedClubCode, setSelectedClubCode] = useState<string>('CLUB-101');
  const [members, setMembers] = useState<GymMember[]>(INITIAL_MEMBERS);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCES);
  const [transactions, setTransactions] = useState<FinancialRecord[]>(INITIAL_TRANSACTIONS);
  const [lockers, setLockers] = useState<LockerItem[]>(INITIAL_LOCKERS);
  const [canteenProducts, setCanteenProducts] = useState<CanteenProduct[]>(INITIAL_CANTEEN);
  const [classes, setClasses] = useState<GymClassItem[]>(INITIAL_CLASSES);
  const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>(INITIAL_SMS_LOGS);

  const activeClub =
    clubs.find((c) => c.code === selectedClubCode) || clubs[0];

  // Sync dark mode class on <html>
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

    const clubsQuery = query(collection(db, 'clubs'), where('ownerId', '==', user.uid));
    const unsubClubs = onSnapshot(
      clubsQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          for (const seedClub of INITIAL_CLUBS) {
            const docId = `${user.uid.slice(0, 8)}_${seedClub.id}`;
            try {
              await setDoc(doc(db, 'clubs', docId), {
                ownerId: user.uid,
                name: seedClub.name,
                code: seedClub.code,
                clubType: seedClub.clubType,
                city: seedClub.city,
                address: seedClub.address,
                phone: seedClub.phone,
                managerName: seedClub.managerName,
                capacity: seedClub.capacity,
                status: seedClub.status,
                createdShamsi: seedClub.createdShamsi,
                createdAt: serverTimestamp(),
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `clubs/${docId}`);
            }
          }
        } else {
          const loadedClubs: GymClub[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              name: data.name,
              code: data.code,
              clubType: data.clubType,
              city: data.city,
              address: data.address,
              phone: data.phone,
              managerName: data.managerName,
              capacity: data.capacity,
              status: data.status,
              createdShamsi: data.createdShamsi,
            };
          });
          setClubs(loadedClubs);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'clubs')
    );

    const classesQuery = query(collection(db, 'classes'), where('ownerId', '==', user.uid));
    const unsubClasses = onSnapshot(
      classesQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          for (const seedCls of INITIAL_CLASSES) {
            const docId = `${user.uid.slice(0, 8)}_${seedCls.id}`;
            try {
              await setDoc(doc(db, 'classes', docId), {
                ownerId: user.uid,
                title: seedCls.title,
                coachName: seedCls.coachName,
                scheduleDays: seedCls.scheduleDays,
                timeSlot: seedCls.timeSlot,
                hallName: seedCls.hallName,
                capacity: seedCls.capacity,
                enrolledCount: seedCls.enrolledCount,
                tuitionFee: seedCls.tuitionFee,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `classes/${docId}`);
            }
          }
        } else {
          setClasses((prev) =>
            snapshot.docs.map((d, idx) => {
              const data = d.data();
              const existingLocal =
                prev.find((p) => p.id === d.id || p.title === data.title) ||
                INITIAL_CLASSES[idx % INITIAL_CLASSES.length];
              return {
                id: d.id,
                ownerId: data.ownerId,
                title: data.title,
                coachName: data.coachName,
                scheduleDays: data.scheduleDays,
                timeSlot: data.timeSlot,
                hallName: data.hallName,
                capacity: data.capacity,
                enrolledCount: data.enrolledCount,
                tuitionFee: data.tuitionFee,
                enrolledMembers: existingLocal.enrolledMembers,
                workoutRoutine: existingLocal.workoutRoutine,
                dietPlan: existingLocal.dietPlan,
              };
            })
          );
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'classes')
    );

    const membersQuery = query(collection(db, 'members'), where('ownerId', '==', user.uid));
    const unsubMembers = onSnapshot(
      membersQuery,
      async (snapshot) => {
        if (snapshot.empty) {
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

    const lockersQuery = query(collection(db, 'lockers'), where('ownerId', '==', user.uid));
    const unsubLockers = onSnapshot(
      lockersQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          for (const seedLocker of INITIAL_LOCKERS) {
            const docId = `${user.uid.slice(0, 8)}_${seedLocker.id}`;
            try {
              await setDoc(doc(db, 'lockers', docId), {
                ownerId: user.uid,
                lockerNumber: seedLocker.lockerNumber,
                zone: seedLocker.zone,
                status: seedLocker.status,
                assignedMemberName: seedLocker.assignedMemberName,
                assignedMemberCode: seedLocker.assignedMemberCode,
                expiresAtShamsi: seedLocker.expiresAtShamsi,
                monthlyRate: seedLocker.monthlyRate,
                updatedAt: serverTimestamp(),
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `lockers/${docId}`);
            }
          }
        } else {
          const loadedLockers: LockerItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              lockerNumber: data.lockerNumber,
              zone: data.zone,
              status: data.status,
              assignedMemberName: data.assignedMemberName,
              assignedMemberCode: data.assignedMemberCode,
              expiresAtShamsi: data.expiresAtShamsi,
              monthlyRate: data.monthlyRate,
            };
          });
          setLockers(loadedLockers);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'lockers')
    );

    return () => {
      unsubClubs();
      unsubClasses();
      unsubMembers();
      unsubAtt();
      unsubTx();
      unsubLockers();
    };
  }, [isAuthReady, user]);

  // Handler: Receptionist Updates Locker (Quick Reserve / Quick Release / Contract)
  const handleUpdateLocker = async (
    lockerId: string,
    updates: Partial<LockerItem>
  ) => {
    const targetLocker = lockers.find((l) => l.id === lockerId);
    if (!targetLocker) return;

    const updatedLocker: LockerItem = {
      ...targetLocker,
      ...updates,
    };

    setLockers((prev) =>
      prev.map((l) => (l.id === lockerId ? updatedLocker : l))
    );

    // Sync member's lockerNumber when reserved or released
    if (
      updates.status === 'Occupied' &&
      updates.assignedMemberCode &&
      updates.assignedMemberCode !== '-'
    ) {
      setMembers((prev) =>
        prev.map((m) =>
          m.membershipCode === updates.assignedMemberCode
            ? { ...m, lockerNumber: targetLocker.lockerNumber }
            : m
        )
      );
    } else if (
      updates.status === 'Available' &&
      targetLocker.assignedMemberCode &&
      targetLocker.assignedMemberCode !== '-'
    ) {
      setMembers((prev) =>
        prev.map((m) =>
          m.membershipCode === targetLocker.assignedMemberCode &&
          m.lockerNumber === targetLocker.lockerNumber
            ? { ...m, lockerNumber: '-' }
            : m
        )
      );
    }

    if (user && targetLocker.ownerId) {
      try {
        await updateDoc(doc(db, 'lockers', targetLocker.id), {
          lockerNumber: updatedLocker.lockerNumber.slice(0, 16),
          zone: updatedLocker.zone,
          status: updatedLocker.status,
          assignedMemberName: updatedLocker.assignedMemberName.slice(0, 80),
          assignedMemberCode: updatedLocker.assignedMemberCode.slice(0, 32),
          expiresAtShamsi: updatedLocker.expiresAtShamsi.slice(0, 32),
          monthlyRate: updatedLocker.monthlyRate,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `lockers/${targetLocker.id}`);
      }
    }
  };

  // Handler: Login with Username & Password
  const handleUsernamePasswordLogin = (account: AuthAccount) => {
    setLoggedInAccount(account);
    setCurrentRole(account.role);
    if (account.assignedClubCode) {
      setSelectedClubCode(account.assignedClubCode);
    }
    setShowLoginModal(false);
  };

  // Handler: Create New Club by SuperAdmin
  const handleClubCreated = async (newClub: GymClub) => {
    setClubs((prev) => [newClub, ...prev]);

    if (user) {
      const clubDocId = `${user.uid.slice(0, 8)}_${newClub.id}`;
      try {
        await setDoc(doc(db, 'clubs', clubDocId), {
          ownerId: user.uid,
          name: newClub.name.slice(0, 100),
          code: newClub.code.slice(0, 24),
          clubType: newClub.clubType,
          city: newClub.city.slice(0, 50),
          address: newClub.address.slice(0, 200),
          phone: newClub.phone.slice(0, 15),
          managerName: newClub.managerName.slice(0, 80),
          capacity: newClub.capacity,
          status: newClub.status,
          createdShamsi: newClub.createdShamsi.slice(0, 20),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `clubs/${clubDocId}`);
      }
    }
  };

  // Handler: Book Class Seat for Member
  const handleBookClassForMember = async (
    classId: string,
    member: GymMember
  ): Promise<{ success: boolean; message: string }> => {
    const targetCls = classes.find((c) => c.id === classId);
    if (!targetCls) {
      return { success: false, message: 'کلاس مورد نظر یافت نشد.' };
    }

    if (targetCls.enrolledCount >= targetCls.capacity) {
      return {
        success: false,
        message: `تکمیل ظرفیت: ظرفیت کلاس «${targetCls.title}» (${targetCls.capacity} نفر) به پایان رسیده است.`,
      };
    }

    if (targetCls.enrolledMembers.some((b) => b.memberId === member.id)) {
      return {
        success: false,
        message: `${member.fullName} قبلاً در کلاس «${targetCls.title}» ثبت‌نام و رزرو شده است.`,
      };
    }

    const newEnrolledCount = targetCls.enrolledCount + 1;
    const newBookingEntry = {
      id: `bk_${Date.now()}`,
      memberId: member.id,
      memberName: member.fullName,
      membershipCode: member.membershipCode,
      bookedAtShamsi: '۱۴۰۵/۰۸/۱۸ - اکنون',
      attended: false,
    };

    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? {
              ...c,
              enrolledCount: newEnrolledCount,
              enrolledMembers: [newBookingEntry, ...c.enrolledMembers],
            }
          : c
      )
    );

    if (user && targetCls.ownerId) {
      try {
        await updateDoc(doc(db, 'classes', targetCls.id), {
          enrolledCount: newEnrolledCount,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${targetCls.id}`);
      }
    }

    const isNowFull = newEnrolledCount >= targetCls.capacity;
    return {
      success: true,
      message: isNowFull
        ? `رزرو ${member.fullName} در کلاس «${targetCls.title}» ثبت شد. با این رزرو، وضعیت کلاس به «تکمیل ظرفیت» (${newEnrolledCount}/${targetCls.capacity}) تغییر یافت.`
        : `رزرو ${member.fullName} در کلاس «${targetCls.title}» با موفقیت ثبت گردید (${targetCls.capacity - newEnrolledCount} صندلی خالی باقی مانده).`,
    };
  };

  // Handler: Cancel Member Class Booking
  const handleCancelClassBooking = async (classId: string, memberId: string) => {
    const targetCls = classes.find((c) => c.id === classId);
    if (!targetCls) return;

    const newCount = Math.max(0, targetCls.enrolledCount - 1);
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? {
              ...c,
              enrolledCount: newCount,
              enrolledMembers: c.enrolledMembers.filter((b) => b.memberId !== memberId),
            }
          : c
      )
    );

    if (user && targetCls.ownerId) {
      try {
        await updateDoc(doc(db, 'classes', targetCls.id), {
          enrolledCount: newCount,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${targetCls.id}`);
      }
    }
  };

  // Handler: Coach Updates Class Capacity
  const handleUpdateClassCapacity = async (classId: string, newCapacity: number) => {
    const targetCls = classes.find((c) => c.id === classId);
    if (!targetCls) return;

    const safeCap = Math.min(500, Math.max(targetCls.enrolledCount, Math.max(1, newCapacity)));
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, capacity: safeCap } : c))
    );

    if (user && targetCls.ownerId) {
      try {
        await updateDoc(doc(db, 'classes', targetCls.id), {
          title: targetCls.title,
          coachName: targetCls.coachName,
          scheduleDays: targetCls.scheduleDays,
          timeSlot: targetCls.timeSlot,
          hallName: targetCls.hallName,
          capacity: safeCap,
          enrolledCount: targetCls.enrolledCount,
          tuitionFee: targetCls.tuitionFee,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${targetCls.id}`);
      }
    }
  };

  // Handler: Coach Toggles Class Attendance
  const handleToggleClassAttendance = (classId: string, bookingId: string) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? {
              ...c,
              enrolledMembers: c.enrolledMembers.map((b) =>
                b.id === bookingId ? { ...b, attended: !b.attended } : b
              ),
            }
          : c
      )
    );
  };

  // Handler: Coach Creates New Class
  const handleCreateNewClass = async (newClassData: {
    title: string;
    coachName: string;
    scheduleDays: string;
    timeSlot: string;
    hallName: string;
    capacity: number;
    tuitionFee: number;
  }) => {
    const newId = user
      ? `${user.uid.slice(0, 8)}_cls_${Date.now()}`
      : `cls_${Date.now()}`;

    const createdClass: GymClassItem = {
      id: newId,
      ownerId: user?.uid,
      title: newClassData.title.slice(0, 80),
      coachName: newClassData.coachName.slice(0, 80),
      scheduleDays: newClassData.scheduleDays.slice(0, 60),
      timeSlot: newClassData.timeSlot.slice(0, 40),
      hallName: newClassData.hallName.slice(0, 60),
      capacity: Math.min(500, Math.max(1, newClassData.capacity)),
      enrolledCount: 0,
      tuitionFee: newClassData.tuitionFee,
      enrolledMembers: [],
      workoutRoutine: INITIAL_CLASSES[0].workoutRoutine,
      dietPlan: INITIAL_CLASSES[0].dietPlan,
    };

    setClasses((prev) => [createdClass, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'classes', newId), {
          ownerId: user.uid,
          title: createdClass.title,
          coachName: createdClass.coachName,
          scheduleDays: createdClass.scheduleDays,
          timeSlot: createdClass.timeSlot,
          hallName: createdClass.hallName,
          capacity: createdClass.capacity,
          enrolledCount: 0,
          tuitionFee: createdClass.tuitionFee,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `classes/${newId}`);
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
          messageBody: `${updatedMember.fullName} عزیز، تنها ${updatedMember.remainingSessions} جلسه از اشتراک شما در ${activeClub.name} باقی مانده است. جهت تمدید آنلاین: parsgym.ir/pay`,
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
      clubCode: selectedClubCode,
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
  const fullClassesCount = classes.filter((c) => c.enrolledCount >= c.capacity).length;
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
      {/* Username & Password Login Modal */}
      {showLoginModal && (
        <LoginView
          isModal={true}
          onLoginSuccess={handleUsernamePasswordLogin}
          onCloseModal={() => {
            if (!loggedInAccount) {
              setLoggedInAccount(INITIAL_AUTH_ACCOUNTS[0]);
            }
            setShowLoginModal(false);
          }}
        />
      )}

      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('CLASS_BOOKING');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          ParsGym Pro
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('CLASS_BOOKING')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
              activeTab === 'CLASS_BOOKING'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent'
            }`}
          >
            رزرو کلاس و مربیان
          </button>

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
            onClick={() => setActiveTab('CLUBS')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
              activeTab === 'CLUBS'
                ? 'border-emerald-500 text-slate-900 dark:text-slate-100 font-semibold'
                : 'border-transparent'
            }`}
          >
            باشگاه‌ها و شعب
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
            کمد، بوفه و مالی
          </button>
        </nav>

        {/* Zone 3: 1 primary action (Username/Password Login / Switch User) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            {loggedInAccount ? (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>{loggedInAccount.username} (ورود / تغییر کاربر)</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>ورود با نام کاربری</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Workspace Toolbar: Active Club Selector, Define New Club Button, RBAC Role Switcher & Theme Toggle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
          {/* Row 1: Club Switcher + Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>باشگاه فعال:</span>
              </div>

              <select
                value={selectedClubCode}
                onChange={(e) => setSelectedClubCode(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setCurrentRole('SuperAdmin');
                  setActiveTab('CLUBS');
                }}
                className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تعریف باشگاه جدید</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentRole('Coach');
                  setActiveTab('CLASS_BOOKING');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>مدیریت ظرفیت کلاس‌ها (پنل مربی)</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                کاربر فعال:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {loggedInAccount?.fullName || 'مهندس ساسان جمالی (مدیر کل)'}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithPopup(auth, googleProvider);
                  } catch {
                    // ignore popup cancellation
                  }
                }}
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{user ? 'همگام‌سازی ابری فعال' : 'اتصال به دیتابیس ابری'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: RBAC Role Switcher & Theme Toggle */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>سطح دسترسی (RBAC):</span>
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
                    { id: 'CLASS_BOOKING', label: 'رزرو کلاس' },
                    { id: 'CHECKIN', label: 'پذیرش' },
                    { id: 'CLUBS', label: 'باشگاه‌ها' },
                    { id: 'MEMBERS', label: 'اعضا' },
                    { id: 'LOCKERS_POS', label: 'عملیات' },
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

              <button
                type="button"
                onClick={() => setActiveTab('DOTNET_CODE')}
                className="text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-emerald-500 underline cursor-pointer"
              >
                کدهای C# .NET 10
              </button>

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
        </div>

        {/* 4-Column Full-Width KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              کلاس‌های گروهی و وضعیت ظرفیت
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {classes.length} کلاس
              </span>
              <span className="text-xs font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                تکمیل ظرفیت: {fullClassesCount}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ورزشکاران دارای اشتراک فعال
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {activeMembersCount} نفر
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                تردد امروز: {allowedTodayCount}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              تعداد باشگاه‌ها و شعب ثبت‌شده
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {clubs.length} باشگاه
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('CLUBS')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                + تعریف باشگاه جدید
              </button>
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
        {activeTab === 'CLASS_BOOKING' && (
          <ClassBookingAndCoachView
            classes={classes}
            members={members}
            currentRole={currentRole}
            onSwitchRole={setCurrentRole}
            onBookClassForMember={handleBookClassForMember}
            onCancelClassBooking={handleCancelClassBooking}
            onUpdateClassCapacity={handleUpdateClassCapacity}
            onToggleClassAttendance={handleToggleClassAttendance}
            onCreateNewClass={handleCreateNewClass}
          />
        )}

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

        {activeTab === 'CLUBS' && (
          <ClubsManagementView
            clubs={clubs}
            selectedClubCode={selectedClubCode}
            onSelectClub={(code) => setSelectedClubCode(code)}
            currentRole={currentRole}
            onSwitchToSuperAdmin={() => setCurrentRole('SuperAdmin')}
            onClubCreated={handleClubCreated}
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

        {activeTab === 'LOCKERS_POS' && (
          <OperationsHubView
            activeSubTab={opsSubTab}
            onChangeSubTab={setOpsSubTab}
            currentRole={currentRole}
            onSwitchRole={setCurrentRole}
            lockers={lockers}
            onUpdateLocker={handleUpdateLocker}
            canteenProducts={canteenProducts}
            onCheckoutCanteenPos={handleCheckoutCanteenPos}
            classes={classes}
            onBookClassForMember={handleBookClassForMember}
            onCancelClassBooking={handleCancelClassBooking}
            onUpdateClassCapacity={handleUpdateClassCapacity}
            onToggleClassAttendance={handleToggleClassAttendance}
            onCreateNewClass={handleCreateNewClass}
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
        <div>
          ParsGym Pro — شعبه فعال: {activeClub.name} ({activeClub.code})
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('CLASS_BOOKING')}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            سیستم رزرو کلاس و پنل مربیان
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setActiveTab('CLUBS')}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            تعریف باشگاه جدید
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            فرم ورود (نام کاربری و رمز عبور)
          </button>
        </div>
      </footer>
    </div>
  );
}
