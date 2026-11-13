'use client';

import React from 'react';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  disabled?: boolean;
  label?: string;
}

export function LanguageSelector({
  selectedCode,
  onSelect,
  disabled = false,
  label,
}: LanguageSelectorProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={selectedCode}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-slate-800/90 hover:bg-slate-800 text-slate-100 font-medium py-3 px-4 pr-10 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <Globe className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
