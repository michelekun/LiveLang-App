'use client';

import React from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';

interface VoiceIndicatorProps {
  isListening: boolean;
  isProcessing: boolean;
  hasInterimSpeech: boolean;
  onToggle: () => void;
  languageFlag: string;
}

export function VoiceIndicator({
  isListening,
  isProcessing,
  hasInterimSpeech,
  onToggle,
  languageFlag,
}: VoiceIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Animated wave rings when speaking or listening */}
        {isListening && (
          <>
            <div className={`absolute -inset-2 rounded-full border-2 ${hasInterimSpeech ? 'border-emerald-400 animate-ping opacity-60' : 'border-indigo-500/40 animate-pulse'}`} />
            <div className="absolute -inset-4 rounded-full border border-indigo-400/20 animate-pulse" />
          </>
        )}

        <button
          onClick={onToggle}
          type="button"
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
            isListening
              ? hasInterimSpeech
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30 ring-4 ring-emerald-500/30'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/30 ring-4 ring-indigo-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200 shadow-slate-900/40'
          }`}
          aria-label={isListening ? 'Ferma microfono' : 'Attiva microfono'}
        >
          {isListening ? (
            hasInterimSpeech ? (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-6 bg-white rounded-full animate-pulse" />
                <span className="w-1.5 h-8 bg-white rounded-full animate-bounce" />
                <span className="w-1.5 h-5 bg-white rounded-full animate-pulse" />
              </div>
            ) : (
              <Mic className="w-8 h-8 animate-pulse" />
            )
          ) : (
            <MicOff className="w-8 h-8" />
          )}

          {/* Badge lingua */}
          <span className="absolute -bottom-1 -right-1 text-lg bg-slate-900/90 rounded-full px-1.5 py-0.5 border border-slate-700 shadow">
            {languageFlag}
          </span>
        </button>
      </div>

      {/* Stato testuale */}
      <div className="flex items-center gap-2 text-xs font-medium">
        {isProcessing ? (
          <span className="flex items-center gap-1.5 text-amber-400 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Rielaborazione contestuale AI...
          </span>
        ) : isListening ? (
          hasInterimSpeech ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Ti sto ascoltando...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Microfono attivo (parla pure)
            </span>
          )
        ) : (
          <span className="text-slate-400">Tocca per iniziare a parlare</span>
        )}
      </div>
    </div>
  );
}
