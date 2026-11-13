export interface Language {
  code: string;       // e.g., 'it'
  speechCode: string; // e.g., 'it-IT'
  name: string;       // e.g., 'Italiano'
  flag: string;       // e.g., '🇮🇹'
}

export interface UserParticipant {
  id: string;
  name: string;
  language: string; // code, e.g., 'it'
  isHost?: boolean;
  isSpeaking?: boolean;
}

export interface TranslationMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerLang: string;
  rawText: string;
  cleanedText: string;
  translations: Record<string, string>; // { "en": "...", "ja": "..." }
  timestamp: number;
}

export interface RoomState {
  id: string;
  participants: Record<string, UserParticipant>;
  messages: TranslationMessage[];
  createdAt: number;
  lastUpdated: number;
}

export interface TranslateApiRequest {
  text: string;
  speakerLang: string;
  targetLangs: string[];
  recentHistory?: {
    speaker: string;
    text: string;
  }[];
}

export interface TranslateApiResponse {
  cleanedText: string;
  translations: Record<string, string>;
  detectedTone?: string;
}
