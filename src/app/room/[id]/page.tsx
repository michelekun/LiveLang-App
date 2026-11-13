'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SUPPORTED_LANGUAGES, getLanguage } from '@/lib/languages';
import { LanguageSelector } from '@/components/LanguageSelector';
import { VoiceIndicator } from '@/components/VoiceIndicator';
import { QRCodeModal } from '@/components/QRCodeModal';
import { HybridVoiceEngine, speakText } from '@/lib/speech';
import { TranslationMessage, UserParticipant, RoomState } from '@/types';
import { UILanguage, UI_TRANSLATIONS } from '@/lib/i18n';
import {
  ArrowLeft,
  QrCode,
  Volume2,
  VolumeX,
  Users,
  Copy,
  Check,
  Sparkles,
  Info,
  Radio,
  Share2,
  Globe,
} from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawRoomId = (params?.id as string) || '';
  const roomId = rawRoomId.toLowerCase();

  // UI Language State (en | ja)
  const [uiLang, setUiLang] = useState<UILanguage>('en');

  // User State
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userLang, setUserLang] = useState<string>('en');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  // Room State
  const [participants, setParticipants] = useState<Record<string, UserParticipant>>({});
  const [messages, setMessages] = useState<TranslationMessage[]>([]);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);

  // Audio & Speech State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [interimText, setInterimText] = useState<string>('');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // References
  const voiceEngineRef = useRef<HybridVoiceEngine | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const peerInstanceRef = useRef<any>(null);
  const connectedPeersRef = useRef<Map<string, any>>(new Map());
  const messagesRef = useRef<TranslationMessage[]>([]);
  messagesRef.current = messages;

  const participantsRef = useRef<Record<string, UserParticipant>>({});
  participantsRef.current = participants;

  const processAndTranslateRef = useRef<
    (params: { text?: string; audioBase64?: string; audioMimeType?: string }) => void
  >(() => {});

  // Inizializzazione utente e UI language
  useEffect(() => {
    const savedUiLang = (localStorage.getItem('livelang_ui_lang') ||
      sessionStorage.getItem('livelang_ui_lang')) as UILanguage | null;
    if (savedUiLang === 'en' || savedUiLang === 'ja') {
      setUiLang(savedUiLang);
    }

    let savedId = sessionStorage.getItem('livelang_user_id');
    if (!savedId) {
      savedId = 'user_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('livelang_user_id', savedId);
    }
    setUserId(savedId);

    const savedName = sessionStorage.getItem('livelang_user_name');
    const savedLang = sessionStorage.getItem('livelang_user_lang');

    if (savedName && savedLang) {
      setUserName(savedName);
      setUserLang(savedLang);
      setIsConfigured(true);
    } else {
      setUserLang(savedUiLang === 'ja' ? 'ja' : 'en');
    }
  }, []);

  const t = UI_TRANSLATIONS[uiLang];

  const handleToggleUiLang = () => {
    const nextLang: UILanguage = uiLang === 'en' ? 'ja' : 'en';
    setUiLang(nextLang);
    localStorage.setItem('livelang_ui_lang', nextLang);
    sessionStorage.setItem('livelang_ui_lang', nextLang);
  };

  // Scorri automaticamente in basso all'arrivo di nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText]);

  // Invio messaggio a tutti i peer WebRTC e salvataggio sul server
  const broadcastMessage = useCallback(
    async (newMessage: TranslationMessage) => {
      connectedPeersRef.current.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send({ type: 'message', data: newMessage });
          } catch (e) {
            console.warn('Errore invio WebRTC:', e);
          }
        }
      });

      try {
        await fetch(`/api/rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'message',
            message: newMessage,
          }),
        });
      } catch (err) {
        console.error('Errore sincronizzazione messaggio server:', err);
      }
    },
    [roomId]
  );

  // Elaborazione AI con Gemini (accetta sia Testo sia Audio Base64 diretto)
  const processAndTranslate = useCallback(
    async (input: { text?: string; audioBase64?: string; audioMimeType?: string }) => {
      if ((!input.text || !input.text.trim()) && !input.audioBase64) return;
      if (isProcessing) return;

      setIsProcessing(true);
      setInterimText('');

      try {
        const activeParticipants = Object.values(participantsRef.current);
        const targetLangs = Array.from(
          new Set(
            activeParticipants
              .map((p) => p.language)
              .filter((l) => l && l !== userLang)
          )
        );

        if (targetLangs.length === 0) {
          targetLangs.push(userLang === 'en' ? 'ja' : 'en');
        }

        const recentHistory = messagesRef.current.slice(-5).map((m) => ({
          speaker: m.speakerName,
          text: m.cleanedText,
        }));

        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: input.text,
            audioBase64: input.audioBase64,
            audioMimeType: input.audioMimeType,
            speakerLang: userLang,
            targetLangs,
            recentHistory,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Translation Error');
        }

        const data = await res.json();

        if (!data.cleanedText || !data.cleanedText.trim()) {
          // Nessun parlato rilevato nell'audio
          return;
        }

        const newMsg: TranslationMessage = {
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          speakerId: userId,
          speakerName: userName,
          speakerLang: userLang,
          rawText: input.text || data.cleanedText,
          cleanedText: data.cleanedText,
          translations: data.translations || {},
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, newMsg]);
        broadcastMessage(newMsg);
      } catch (error: any) {
        console.error('Errore durante la traduzione:', error);
        setErrorBanner(error?.message || 'Error processing AI translation');
        setTimeout(() => setErrorBanner(null), 5000);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, userLang, userId, userName, broadcastMessage]
  );

  processAndTranslateRef.current = processAndTranslate;

  // Inizializzazione Hybrid Voice Engine
  useEffect(() => {
    if (!isConfigured) return;

    const langObj = getLanguage(userLang);

    if (voiceEngineRef.current) {
      voiceEngineRef.current.updateLanguage(langObj.speechCode);
      return;
    }

    const engine = new HybridVoiceEngine({
      lang: langObj.speechCode,
      onInterim: (text) => {
        setInterimText(text);
      },
      onFinalText: (text) => {
        setInterimText('');
        processAndTranslateRef.current({ text });
      },
      onFinalAudio: (audioBase64, mimeType) => {
        setInterimText('');
        processAndTranslateRef.current({ audioBase64, audioMimeType: mimeType });
      },
      onVolumeChange: (vol) => {
        setVolumeLevel(vol);
      },
      onError: (err) => {
        setErrorBanner(err);
        setTimeout(() => setErrorBanner(null), 6000);
      },
      onStatusChange: (listening) => {
        setIsListening(listening);
        if (!listening) {
          setVolumeLevel(0);
        }
      },
    });

    voiceEngineRef.current = engine;

    return () => {
      engine.stop();
      voiceEngineRef.current = null;
    };
  }, [isConfigured, userLang]);

  // Gestione toggle microfono
  const toggleListening = async () => {
    if (!voiceEngineRef.current) return;

    if (isListening) {
      await voiceEngineRef.current.stop();
      setIsListening(false);
      setInterimText('');
      setVolumeLevel(0);
    } else {
      setErrorBanner(null);
      const started = await voiceEngineRef.current.start();
      if (started) {
        setIsListening(true);
      }
    }
  };

  // Setup sincronizzazione Stanza
  useEffect(() => {
    if (!isConfigured || !userId || !roomId) return;

    let isMounted = true;

    const joinRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            participant: {
              id: userId,
              name: userName,
              language: userLang,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.room) {
            setParticipants(data.room.participants || {});
            if (data.room.messages && data.room.messages.length > 0) {
              setMessages(data.room.messages);
            }
          }
        }
      } catch (err) {
        console.warn('Error joining room:', err);
      }
    };

    joinRoom();

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;

          if (data.room?.participants) {
            setParticipants(data.room.participants);
          }

          if (data.messages && Array.isArray(data.messages)) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const missing = data.messages.filter((m: TranslationMessage) => !existingIds.has(m.id));
              if (missing.length > 0) {
                if (ttsEnabled) {
                  const latestOther = missing[missing.length - 1];
                  if (latestOther.speakerId !== userId) {
                    const textToSpeak =
                      latestOther.translations[userLang] || latestOther.cleanedText;
                    speakText(textToSpeak, getLanguage(userLang).speechCode);
                  }
                }
                return [...prev, ...missing];
              }
              return prev;
            });
          }
        }

        await fetch(`/api/rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'heartbeat',
            participant: { id: userId, name: userName, language: userLang },
          }),
        });
      } catch (err) {
        // Ignore
      }
    }, 2000);

    // Inizializzazione PeerJS
    import('peerjs').then(({ default: Peer }) => {
      if (!isMounted) return;

      const peer = new Peer();
      peerInstanceRef.current = peer;

      peer.on('connection', (conn) => {
        connectedPeersRef.current.set(conn.peer, conn);

        conn.on('data', (payload: any) => {
          if (payload?.type === 'message' && payload.data) {
            const incomingMsg: TranslationMessage = payload.data;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incomingMsg.id)) return prev;
              if (ttsEnabled && incomingMsg.speakerId !== userId) {
                const speechContent =
                  incomingMsg.translations[userLang] || incomingMsg.cleanedText;
                speakText(speechContent, getLanguage(userLang).speechCode);
              }
              return [...prev, incomingMsg];
            });
          }
        });

        conn.on('close', () => {
          connectedPeersRef.current.delete(conn.peer);
        });
      });
    });

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (peerInstanceRef.current) {
        peerInstanceRef.current.destroy();
      }
      fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave',
          participant: { id: userId },
        }),
      }).catch(() => {});
    };
  }, [isConfigured, userId, userName, userLang, roomId, ttsEnabled]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {t.joinRoomModalTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.roomLabel}:{' '}
              <span className="font-mono text-indigo-400 font-bold">
                {roomId.toUpperCase()}
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                {t.yourName}
              </label>
              <input
                type="text"
                placeholder={t.namePlaceholder}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={20}
                className="w-full bg-slate-900 text-white font-medium py-3 px-4 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <LanguageSelector
              label={t.yourLanguage}
              selectedCode={userLang}
              onSelect={setUserLang}
            />

            <button
              onClick={() => {
                const finalName =
                  userName.trim() || (uiLang === 'ja' ? 'ゲスト' : 'Guest');
                setUserName(finalName);
                sessionStorage.setItem('livelang_user_name', finalName);
                sessionStorage.setItem('livelang_user_lang', userLang);
                setIsConfigured(true);
              }}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 active:scale-95 mt-2"
            >
              {t.joinRoomSubmit}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myLanguage = getLanguage(userLang);
  const otherParticipants = Object.values(participants).filter((p) => p.id !== userId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Back & Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
              title={t.leaveRoom}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight">LiveLang</span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-semibold uppercase border border-indigo-500/30">
                  {roomId}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {otherParticipants.length === 0
                    ? t.waitingOthers
                    : t.connectedCount(otherParticipants.length + 1)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* UI Language Switcher */}
            <button
              onClick={handleToggleUiLang}
              className="py-1.5 px-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
              title={t.changeUiLang}
            >
              {uiLang === 'ja' ? '🇯🇵 日本語' : '🇬🇧 EN'}
            </button>

            {/* Audio TTS toggle */}
            <button
              onClick={() => {
                const nextState = !ttsEnabled;
                setTtsEnabled(nextState);
                if (nextState) {
                  speakText(t.ttsActive, myLanguage.speechCode);
                }
              }}
              className={`p-2.5 rounded-xl transition border ${
                ttsEnabled
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={ttsEnabled ? t.ttsDisableTooltip : t.ttsEnableTooltip}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* QR Code / Invite */}
            <button
              onClick={() => setIsQrOpen(true)}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">{t.inviteBtn}</span>
            </button>
          </div>
        </div>

        {/* Participants Pill Strip */}
        <div className="max-w-2xl mx-auto mt-2 pt-2 border-t border-slate-800/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
            {t.lobby}:
          </span>
          <div className="flex items-center gap-1.5">
            {/* You */}
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-xs text-indigo-200">
              <span>{myLanguage.flag}</span>
              <span className="font-semibold">
                {userName} {t.youBadge}
              </span>
            </div>

            {/* Other participants */}
            {otherParticipants.map((p) => {
              const lang = getLanguage(p.language);
              return (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 shrink-0"
                >
                  <span>{lang.flag}</span>
                  <span>{p.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {errorBanner && (
        <div className="bg-rose-500 text-white text-xs font-semibold py-2.5 px-4 text-center shadow-lg animate-pulse">
          ⚠️ {errorBanner}
        </div>
      )}

      {/* Main Conversation Feed */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 my-auto min-h-[40vh]">
            <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 mb-3">
              <Radio className="w-10 h-10 text-indigo-400 animate-pulse" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">
              {t.roomReadyTitle}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
              {t.roomReadyDesc(myLanguage.name)}
            </p>
            {otherParticipants.length === 0 && (
              <button
                onClick={() => setIsQrOpen(true)}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-900 border border-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-medium"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t.shareQrWithOther}</span>
              </button>
            )}
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => {
          const isMe = msg.speakerId === userId;
          const speakerLangObj = getLanguage(msg.speakerLang);

          const translatedForMe = isMe
            ? msg.cleanedText
            : msg.translations[userLang] || msg.cleanedText;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} transition-all`}
            >
              {/* Speaker info */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                <span>{speakerLangObj.flag}</span>
                <span className="font-semibold">{isMe ? t.youSpoke : msg.speakerName}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Message Card */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-xl border ${
                  isMe
                    ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500/30 text-white rounded-tr-none'
                    : 'bg-slate-900/90 border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Traduzione Principale (In rilievo) */}
                <div className="text-base sm:text-lg font-medium leading-relaxed tracking-wide">
                  {translatedForMe}
                </div>

                {/* Sottotitolo / Dettaglio Originale Rielaborato */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-start justify-between gap-2 text-xs">
                  <div className="text-slate-400 text-[11px] leading-tight">
                    {isMe ? (
                      <span className="flex items-center gap-1 text-indigo-300">
                        <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                        {t.cleanedAndTranslated}
                      </span>
                    ) : (
                      <span className="italic">
                        {t.originalText(speakerLangObj.name, msg.cleanedText)}
                      </span>
                    )}
                  </div>

                  {/* Pulsante ascolta audio singola frase */}
                  <button
                    onClick={() =>
                      speakText(translatedForMe, myLanguage.speechCode)
                    }
                    className="p-1 text-slate-400 hover:text-indigo-400 rounded transition shrink-0"
                    title={t.listenAudio}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live speech transcription in progress (Interim) */}
        {interimText && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{t.speakingNow}</span>
            </div>
            <div className="max-w-[85%] rounded-2xl p-4 bg-indigo-950/40 border border-indigo-500/50 text-indigo-200 italic rounded-tr-none shadow-lg animate-pulse">
              &ldquo;{interimText}&rdquo;
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Bar: Ergonomic Microphone Controls */}
      <footer className="sticky bottom-0 z-30 glass-panel border-t border-slate-800/80 px-4 pt-3 pb-6 sm:pb-5">
        <div className="max-w-md mx-auto">
          <VoiceIndicator
            isListening={isListening}
            isProcessing={isProcessing}
            hasInterimSpeech={Boolean(interimText)}
            volumeLevel={volumeLevel}
            onToggle={toggleListening}
            languageFlag={myLanguage.flag}
            labels={{
              tapToStart: t.micTapToStart,
              activeListening: t.micActiveListening,
              hearingYou: t.micHearingYou,
              aiProcessing: t.micAiProcessing,
            }}
          />
        </div>
      </footer>

      {/* QR Code Invite Modal */}
      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        roomId={roomId}
        uiLang={uiLang}
      />
    </div>
  );
}
