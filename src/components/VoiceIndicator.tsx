'use client';

import React from 'react';
import { Mic, MicOff, Sparkles, Activity } from 'lucide-react';

interface VoiceIndicatorProps {
  isListening: boolean;
  isProcessing: boolean;
  hasInterimSpeech: boolean;
  volumeLevel?: number; // 0 to 100 from real audio analyser
  onToggle: () => void;
  languageFlag: string;
  labels?: {
    tapToStart: string;
    activeListening: string;
    hearingYou: string;
    aiProcessing: string;
  };
}

export function VoiceIndicator({
  isListening,
  isProcessing,
  hasInterimSpeech,
  volumeLevel = 0,
  onToggle,
  languageFlag,
  labels,
}: VoiceIndicatorProps) {
  const lbl = labels || {
    tapToStart: 'Tap to start speaking',
    activeListening: 'Microphone active (speak freely)',
    hearingYou: 'Listening to you...',
    aiProcessing: 'AI contextual translation...',
  };

  const isSpeaking = volumeLevel > 15 || hasInterimSpeech;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Animated wave rings responding to real microphone volume */}
        {isListening && (
          <>
            <div
              className={`absolute -inset-2 rounded-full border-2 transition-all duration-150 ${
                isSpeaking
                  ? 'border-emerald-400 opacity-80 scale-110'
                  : 'border-indigo-500/40 animate-pulse'
              }`}
              style={{
                transform: isSpeaking ? `scale(${1 + volumeLevel / 150})` : undefined,
              }}
            />
            <div
              className="absolute -inset-4 rounded-full border border-indigo-400/20 transition-all duration-200"
              style={{
                transform: isSpeaking ? `scale(${1 + volumeLevel / 100})` : undefined,
                opacity: isSpeaking ? Math.min(1, volumeLevel / 60) : 0.3,
              }}
            />
          </>
        )}

        <button
          onClick={onToggle}
          type="button"
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl active:scale-95 ${
            isListening
              ? isSpeaking
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/40 ring-4 ring-emerald-500/40 scale-105'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/30 ring-4 ring-indigo-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200 shadow-slate-900/40'
          }`}
          aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
        >
          {isListening ? (
            isSpeaking ? (
              <div className="flex items-center gap-1 h-8">
                <span
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(8, Math.min(28, volumeLevel * 0.4))}px` }}
                />
                <span
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(12, Math.min(32, volumeLevel * 0.6))}px` }}
                />
                <span
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(16, Math.min(36, volumeLevel * 0.8))}px` }}
                />
                <span
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(12, Math.min(32, volumeLevel * 0.6))}px` }}
                />
                <span
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(8, Math.min(28, volumeLevel * 0.4))}px` }}
                />
              </div>
            ) : (
              <Mic className="w-8 h-8 animate-pulse text-indigo-200" />
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
            {lbl.aiProcessing}
          </span>
        ) : isListening ? (
          isSpeaking ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {lbl.hearingYou}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              {lbl.activeListening}
            </span>
          )
        ) : (
          <span className="text-slate-400">{lbl.tapToStart}</span>
        )}
      </div>
    </div>
  );
}
