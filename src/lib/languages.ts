import { Language } from '@/types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'it', speechCode: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', speechCode: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es', speechCode: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', speechCode: 'ja-JP', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'fr', speechCode: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de', speechCode: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', speechCode: 'zh-CN', name: '中文 (Mandarin)', flag: '🇨🇳' },
  { code: 'pt', speechCode: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', speechCode: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', speechCode: 'ar-SA', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'ko', speechCode: 'ko-KR', name: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'hi', speechCode: 'hi-IN', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
];

export function getLanguage(code: string): Language {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
