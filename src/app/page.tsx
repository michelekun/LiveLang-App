'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';
import { Sparkles, Users, MessageSquareQuote, Headphones, ArrowRight, Radio } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState('it');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomId = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = () => {
    const userName = name.trim() || 'Ospite';
    const newRoomId = generateRoomId();
    sessionStorage.setItem('livelang_user_name', userName);
    sessionStorage.setItem('livelang_user_lang', selectedLang);
    router.push(`/room/${newRoomId}?create=true`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const userName = name.trim() || 'Ospite';
    sessionStorage.setItem('livelang_user_name', userName);
    sessionStorage.setItem('livelang_user_lang', selectedLang);
    router.push(`/room/${joinCode.trim().toLowerCase()}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-4 py-8 sm:p-8">
      {/* Background radial gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))]" />

      <div className="max-w-md w-full mx-auto relative z-10 flex-1 flex flex-col justify-center">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>Traduzione Simultanea Naturale</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
            Live<span className="text-gradient">Lang</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Parla liberamente nella tua lingua. Gemini AI ripulisce le esitazioni e traduce in tempo reale sul telefono dell'altra persona.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80 mb-6">
          <div className="space-y-5">
            {/* User Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Il tuo nome
              </label>
              <input
                type="text"
                placeholder="Es. Marco, Kenji, Sarah..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full bg-slate-900/90 text-white font-medium py-3 px-4 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-500 transition"
              />
            </div>

            {/* Language Selector */}
            <LanguageSelector
              label="La tua lingua (in cui parlerai e leggerai)"
              selectedCode={selectedLang}
              onSelect={setSelectedLang}
            />

            {/* Action: Create Room */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCreateRoom}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2.5"
              >
                <Sparkles className="w-5 h-5" />
                <span>Crea Nuova Stanza</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                oppure entra con codice
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Action: Join Room Form */}
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="Codice (es. ab12cd)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={10}
                className="flex-1 bg-slate-900/90 text-white font-mono text-center uppercase tracking-widest font-semibold py-3 px-4 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-slate-500 placeholder:font-sans placeholder:tracking-normal transition"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 font-semibold text-sm transition border border-slate-700 flex items-center gap-1.5 active:scale-95"
              >
                <span>Entra</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-400">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col items-center gap-1.5">
            <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-slate-200">Zero Intercalari</span>
            <span className="text-[10px] text-slate-400 leading-tight">Ripulisce esitazioni ed errori</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col items-center gap-1.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-slate-200">Stanze Multi-User</span>
            <span className="text-[10px] text-slate-400 leading-tight">Collega 2 o più telefoni</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col items-center gap-1.5">
            <Headphones className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-slate-200">Audio o Testo</span>
            <span className="text-[10px] text-slate-400 leading-tight">Leggi i sottotitoli o ascolta</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-6 relative z-10">
        Potenziato da Google Gemini 2.5 Flash • Pronto per il deploy su Vercel
      </footer>
    </main>
  );
}
