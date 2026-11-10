import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, Eye, EyeOff, LogIn, ShieldCheck, KeyRound, X } from 'lucide-react';
import { AuthAccount, INITIAL_AUTH_ACCOUNTS } from '../data/gymData';

interface LoginViewProps {
  onLoginSuccess: (account: AuthAccount) => void;
  onCloseModal?: () => void;
  isModal?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onCloseModal,
  isModal = false,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('لطفاً نام کاربری و کلمه عبور را وارد نمایید.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        username: cleanUsername,
        password: cleanPassword,
      });

      if (response.data?.success && response.data?.account) {
        onLoginSuccess(response.data.account);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'نام کاربری یا کلمه عبور اشتباه است.'
      );
    } finally {
      setLoading(false);
    }
  };

  const applyPresetAccount = (acc: AuthAccount) => {
    setUsername(acc.username);
    setPassword('123456');
    setErrorMessage(null);
  };

  const cardContent = (
    <div
      dir="rtl"
      className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 space-y-6"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            PARSGYM PRO AUTHENTICATION
          </div>
          <h2 className="text-xl font-bold mt-1">
            ورود به سامانه مدیریت باشگاه‌های ورزشی
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            نام کاربری و کلمه عبور خود را جهت ورود به پنل اختصاصی وارد نمایید.
          </p>
        </div>
        {isModal && onCloseModal && (
          <button
            type="button"
            onClick={onCloseModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            نام کاربری (Username)
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: admin یا reception"
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            کلمه عبور (Password)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="کلمه عبور را وارد کنید..."
              className="w-full pr-10 pl-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="نمایش / مخفی کردن کلمه عبور"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'در حال احراز هویت...' : 'ورود به سامانه باشگاه'}</span>
        </button>
      </form>

      {/* Quick Demo Role Accounts */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
          <span>حساب‌های کاربری پیش‌فرض جهت تست سطوح دسترسی (رمز همه: 123456):</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {INITIAL_AUTH_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              onClick={() => applyPresetAccount(acc)}
              className={`p-2.5 rounded-lg border text-right text-xs transition-colors cursor-pointer ${
                username.toLowerCase() === acc.username
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <span>{acc.username}</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1 font-medium text-slate-800 dark:text-slate-200 truncate">
                {acc.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      {cardContent}
    </div>
  );
};
