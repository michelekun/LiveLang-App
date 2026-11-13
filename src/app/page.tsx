'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UILanguage, UI_TRANSLATIONS } from '@/lib/i18n';
import {
  Sparkles,
  Users,
  MessageSquareQuote,
  Headphones,
  ArrowRight,
  Radio,
  Globe,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // UI Language State: 'en' | 'ja' | null (null = show giant selection screen)
  const [uiLang, setUiLang] = useState<UILanguage | null>(null);
  const [isClient, setIsClient] = useState(false);

  // App form state
  const [name, setName] = useState('');
  const [selectedSpokenLang, setSelectedSpokenLang] = useState('en');
  const [joinCode, setJoinCode] = useState('');

  // Carica preferenza UI language da localStorage
  useEffect(() => {
    setIsClient(true);
    const savedUiLang = localStorage.getItem('livelang_ui_lang') as UILanguage | null;
    if (savedUiLang === 'en' || savedUiLang === 'ja') {
      setUiLang(savedUiLang);
      setSelectedSpokenLang(savedUiLang === 'ja' ? 'ja' : 'en');
    }
  }, []);

  const handleSelectUiLanguage = (lang: UILanguage) => {
    setUiLang(lang);
    localStorage.setItem('livelang_ui_lang', lang);
    setSelectedSpokenLang(lang === 'ja' ? 'ja' : 'en');
  };

  const generateRoomId = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = () => {
    const userName = name.trim() || (uiLang === 'ja' ? 'ゲスト' : 'Guest');
    const newRoomId = generateRoomId();
    sessionStorage.setItem('livelang_user_name', userName);
    sessionStorage.setItem('livelang_user_lang', selectedSpokenLang);
    sessionStorage.setItem('livelang_ui_lang', uiLang || 'en');
    router.push(`/room/${newRoomId}?create=true`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const userName = name.trim() || (uiLang === 'ja' ? 'ゲスト' : 'Guest');
    sessionStorage.setItem('livelang_user_name', userName);
    sessionStorage.setItem('livelang_user_lang', selectedSpokenLang);
    sessionStorage.setItem('livelang_ui_lang', uiLang || 'en');
    router.push(`/room/${joinCode.trim().toLowerCase()}`);
  };

  if (!isClient) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // =========================================================================
  // SCHERMATA 1: SELEZIONE LINGUA CON DUE PULSANTI GIGANTESCHI
  // =========================================================================
  if (!uiLang) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />

        <div className="max-w-md w-full relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>LiveLang Realtime AI</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Select Language
          </h1>
          <p className="text-lg text-slate-400 mb-8 font-medium">
            言語を選択してください
          </p>

          {/* I DUE PULSANTI GIGANTESCHI */}
          <div className="grid grid-cols-1 gap-5">
            {/* Pulsante 1: INGLESE */}
            <button
              onClick={() => handleSelectUiLanguage('en')}
              className="group relative w-full p-8 rounded-3xl glass-panel border border-slate-700/80 hover:border-indigo-500/80 bg-gradient-to-br from-slate-900/90 to-indigo-950/40 hover:from-slate-800 hover:to-indigo-900/60 shadow-2xl active:scale-[0.98] transition-all duration-300 text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <span className="text-5xl sm:text-6xl filter drop-shadow">🇬🇧</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide group-hover:text-indigo-300 transition">
                    English
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Continue in English
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                <ArrowRight className="w-6 h-6 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            {/* Pulsante 2: GIAPPONESE */}
            <button
              onClick={() => handleSelectUiLanguage('ja')}
              className="group relative w-full p-8 rounded-3xl glass-panel border border-slate-700/80 hover:border-rose-500/80 bg-gradient-to-br from-slate-900/90 to-rose-950/30 hover:from-slate-800 hover:to-rose-900/50 shadow-2xl active:scale-[0.98] transition-all duration-300 text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <span className="text-5xl sm:text-6xl filter drop-shadow">🇯🇵</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide group-hover:text-rose-300 transition">
                    日本語
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    日本語で利用する
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition">
                <ArrowRight className="w-6 h-6 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // SCHERMATA 2: APPLICAZIONE NELLA LINGUA SELEZIONATA (EN o JA)
  // =========================================================================
  const t = UI_TRANSLATIONS[uiLang];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-4 py-8 sm:p-8">
      {/* Background radial gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))]" />

      {/* Top Language Switcher bar */}
      <div className="max-w-md w-full mx-auto flex justify-end mb-4 relative z-20">
        <button
          onClick={() => setUiLang(null)}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>{uiLang === 'ja' ? '🇯🇵 日本語' : '🇬🇧 English'}</span>
          <span className="text-slate-400 text-[10px]">({t.changeUiLang})</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto relative z-10 flex-1 flex flex-col justify-center">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>{t.appTag}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-1">
            {t.appTitle}
            <span className="text-gradient">{t.appTitleHighlight}</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium tracking-wide">
            (by Michele Angelici)
          </p>
        </div>

        {/* Configuration Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80 mb-6">
          <div className="space-y-5">
            {/* User Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                {t.yourName}
              </label>
              <input
                type="text"
                placeholder={t.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full bg-slate-900/90 text-white font-medium py-3 px-4 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-500 transition"
              />
            </div>

            {/* Language Selector (Spoken/Listening) */}
            <LanguageSelector
              label={t.yourLanguage}
              selectedCode={selectedSpokenLang}
              onSelect={setSelectedSpokenLang}
            />

            {/* Action: Create Room */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCreateRoom}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2.5"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t.createRoom}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                {t.orJoinWithCode}
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Action: Join Room Form (Perfettamente contenuto all'interno del riquadro) */}
            <form onSubmit={handleJoinRoom} className="flex gap-2 w-full">
              <input
                type="text"
                placeholder={t.roomCodePlaceholder}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={10}
                className="min-w-0 flex-1 bg-slate-900/90 text-white font-mono text-center uppercase tracking-widest font-semibold py-3 px-3 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-500 placeholder:font-sans placeholder:tracking-normal placeholder:text-xs transition text-sm"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="shrink-0 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 font-semibold text-sm transition border border-slate-700 flex items-center gap-1.5 active:scale-95"
              >
                <span>{t.joinButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-400">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col items-center gap-1.5">
            <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-slate-200">{t.featNoFillersTitle}</span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {t.featNoFillersDesc}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col items-center gap-1.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-slate-200">{t.featMultiUserTitle}</span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {t.featMultiUserDesc}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col items-center gap-1.5">
            <Headphones className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-slate-200">{t.featVoiceTitle}</span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {t.featVoiceDesc}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-6 relative z-10">
        All rights reserved
      </footer>
    </main>
  );
}
