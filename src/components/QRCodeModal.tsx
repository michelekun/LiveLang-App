'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export function QRCodeModal({ isOpen, onClose, roomId }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomId}`
    : `https://livelang.app/room/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Unisciti alla stanza di traduzione LiveLang',
          text: `Entra nella mia stanza di traduzione dal vivo: codice ${roomId}`,
          url: roomUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl p-6 glass-panel border border-slate-700/80 shadow-2xl text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-1">Invita un altro telefono</h3>
        <p className="text-xs text-slate-400 mb-5">
          Fai inquadrare questo codice con la fotocamera per connettersi istantaneamente.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mb-4">
          <QRCodeSVG value={roomUrl} size={180} level="M" />
        </div>

        {/* Room Code */}
        <div className="mb-4">
          <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">Codice Stanza</span>
          <span className="font-mono text-2xl font-bold tracking-widest text-indigo-400 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 inline-block">
            {roomId.toUpperCase()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition border border-slate-700 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copiato!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copia Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Condividi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
