import React, { useState } from 'react';
import { Copy, Check, FileCode2, Database, ShieldCheck, FolderTree } from 'lucide-react';
import { DOTNET_ARCHITECTURE_BLUEPRINTS } from '../data/dotnetArchitectureCode';

export const DotNetArchitectureView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(DOTNET_ARCHITECTURE_BLUEPRINTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSection =
    DOTNET_ARCHITECTURE_BLUEPRINTS.find((s) => s.id === selectedId) ||
    DOTNET_ARCHITECTURE_BLUEPRINTS[0];

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard errors in restricted frames
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              معماری و کدهای کامل بک‌اند (.NET 10 Web API + EF Core 10 + SQL Server + React Axios)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              تمامی کدهای درخواستی شامل مدل‌های دیتابیس C#، پیکربندی Fluent API، کنترلر Attendance با تراکنش اتمیک و کسر خودکار جلسه، کامپوننت React و ساختار پوشه‌های پروژه آماده کپی و اجرا در Visual Studio / VS Code هستند.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
            Target Framework: net10.0 · EF Core 10 · SQL Server
          </div>
        </div>

        {/* Selector Tabs for the 4 Core Deliverables */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DOTNET_ARCHITECTURE_BLUEPRINTS.map((item, idx) => {
            const isSelected = item.id === selectedId;
            const IconComponent =
              idx === 0
                ? Database
                : idx === 1
                ? ShieldCheck
                : idx === 2
                ? FileCode2
                : FolderTree;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`p-4 rounded-xl border text-right transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <IconComponent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono text-xs text-slate-400">{item.language}</span>
                </div>
                <div className="font-bold text-xs leading-snug">{item.title}</div>
                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {item.filename}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Code Viewer Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-slate-100">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-bold text-sm text-emerald-400">{activeSection.title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{activeSection.description}</div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs text-slate-400 dir-ltr">
              {activeSection.filename}
            </span>
            <button
              type="button"
              onClick={() => handleCopyCode(activeSection.code, activeSection.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedId === activeSection.id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی کامل کد</span>
                </>
              )}
            </button>
          </div>
        </div>

        <pre
          dir="ltr"
          className="p-6 text-xs font-mono leading-relaxed overflow-x-auto text-slate-200 bg-slate-950/80 max-h-[680px]"
        >
          <code>{activeSection.code}</code>
        </pre>
      </section>
    </div>
  );
};
