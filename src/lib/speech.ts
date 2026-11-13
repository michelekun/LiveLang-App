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
  private isExplicitlyStopped = true;
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
    clearTimeout(this.restartTimeout);

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {
          // Ignore
        }
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        if (!this.isExplicitlyStopped && this.options.onStatusChange) {
          this.options.onStatusChange(true);
        }
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
        // 'no-speech' è normale nei periodi di pausa e silenzio del parlato
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'network' || event.error === 'aborted') {
          return;
        }
        console.warn('SpeechRecognition error:', event.error);
        if (this.options.onError) {
          this.options.onError(event);
        }
      };

      this.recognition.onend = () => {
        // Non spegnere lo stato UI se l'utente desidera continuare ad ascoltare
        if (!this.isExplicitlyStopped) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (!this.isExplicitlyStopped) {
              try {
                this.recognition?.start();
              } catch {
                // Ignore already started / busy
              }
            }
          }, 100);
        } else {
          if (this.options.onStatusChange) {
            this.options.onStatusChange(false);
          }
        }
      };

      this.recognition.start();
      if (this.options.onStatusChange) {
        this.options.onStatusChange(true);
      }
    } catch (e: any) {
      console.error('Errore avvio SpeechRecognition:', e);
      this.options.onError(e);
      if (this.options.onStatusChange) {
        this.options.onStatusChange(false);
      }
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
    if (this.options.onStatusChange) {
      this.options.onStatusChange(false);
    }
  }
}

// Sintesi vocale (TTS) per ascoltare la traduzione in cuffia
export function speakText(text: string, langCode: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) =>
        v.lang.startsWith(langCode) ||
        v.lang.replace('_', '-').startsWith(langCode)
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Errore SpeechSynthesis:', err);
  }
}
