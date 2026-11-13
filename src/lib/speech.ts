// Gestione Speech-to-Text (riconoscimento vocale) e Text-to-Speech (sintesi vocale)

export interface SpeechRecognizerOptions {
  lang: string; // e.g. 'it-IT'
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (err: any) => void;
  onStatusChange?: (isListening: boolean) => void;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isExplicitlyStopped = false;
  private lang: string;
  private options: SpeechRecognizerOptions;
  private restartTimeout: any = null;

  constructor(options: SpeechRecognizerOptions) {
    this.options = options;
    this.lang = options.lang;
  }

  public updateLanguage(newLang: string) {
    this.lang = newLang;
    if (this.recognition) {
      try {
        this.recognition.lang = newLang;
      } catch (e) {
        console.warn('Errore cambio lingua dinamica:', e);
      }
    }
  }

  public start() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.options.onError(
        new Error('Il tuo browser non supporta il riconoscimento vocale. Usa Chrome o Safari.')
      );
      return;
    }

    this.isExplicitlyStopped = false;

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        if (this.options.onStatusChange) this.options.onStatusChange(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (interimTranscript.trim()) {
          this.options.onInterim(interimTranscript.trim());
        }

        if (finalTranscript.trim()) {
          this.options.onFinal(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        // 'no-speech' è normale quando l'utente fa una pausa
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'network' || event.error === 'aborted') {
          return;
        }
        console.warn('SpeechRecognition error:', event.error);
        this.options.onError(event);
      };

      this.recognition.onend = () => {
        if (this.options.onStatusChange) this.options.onStatusChange(false);
        // Riavvio automatico su dispositivi mobile se l'ascolto è ancora attivo
        if (!this.isExplicitlyStopped) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (!this.isExplicitlyStopped) {
              try {
                this.recognition?.start();
              } catch {
                // Ignore already started error
              }
            }
          }, 300);
        }
      };

      this.recognition.start();
    } catch (e: any) {
      console.error('Errore avvio SpeechRecognition:', e);
      this.options.onError(e);
    }
  }

  public stop() {
    this.isExplicitlyStopped = true;
    clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
    }
    if (this.options.onStatusChange) this.options.onStatusChange(false);
  }
}

// Sintesi vocale (TTS) per ascoltare la traduzione in cuffia
export function speakText(text: string, langCode: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Interrompi frasi precedenti
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Cerca una voce nativa corrispondente
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(langCode) || v.lang.replace('_', '-').startsWith(langCode));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Errore SpeechSynthesis:', err);
  }
}
