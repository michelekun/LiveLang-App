// Motore vocale ibrido: Web Speech API (riconoscimento in tempo reale) + MediaRecorder (cattura audio diretta con Gemini)

export interface HybridSpeechOptions {
  lang: string; // e.g. 'it-IT'
  onInterim: (text: string) => void;
  onFinalText: (text: string) => void;
  onFinalAudio: (audioBase64: string, mimeType: string) => void;
  onVolumeChange?: (volume: number) => void;
  onError: (err: string) => void;
  onStatusChange?: (isListening: boolean) => void;
}

export class HybridVoiceEngine {
  private options: HybridSpeechOptions;
  private lang: string;
  private isListening = false;

  // Web Speech API
  private recognition: any = null;
  private accumulatedSpeech = '';
  private silenceTimer: any = null;

  // MediaRecorder & Web Audio API
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  constructor(options: HybridSpeechOptions) {
    this.options = options;
    this.lang = options.lang;
  }

  public updateLanguage(newLang: string) {
    this.lang = newLang;
    if (this.recognition) {
      try {
        this.recognition.lang = newLang;
      } catch (e) {
        console.warn('Errore cambio lingua:', e);
      }
    }
  }

  public async start(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Richiedi esplicitamente l'accesso al microfono
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.options.onError(
          'Il tuo browser non consente l\'accesso al microfono (serve connessione sicura HTTPS).'
        );
        return false;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      console.error('Errore getUserMedia:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.options.onError(
          'Accesso al microfono negato. Consenti l\'uso del microfono nelle impostazioni del browser.'
        );
      } else {
        this.options.onError('Impossibile accedere al microfono: ' + (err.message || 'Errore sconosciuto'));
      }
      return false;
    }

    this.isListening = true;
    if (this.options.onStatusChange) {
      this.options.onStatusChange(true);
    }

    // 1. Avvia Analizzatore Volume Audio in tempo reale
    this.setupAudioAnalyser(this.mediaStream);

    // 2. Avvia MediaRecorder per catturare l'audio direttamente
    this.setupMediaRecorder(this.mediaStream);

    // 3. Avvia Web Speech API (se disponibile nel browser)
    this.setupSpeechRecognition();

    return true;
  }

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Volume normalizzato 0 - 100
        const volume = Math.min(100, Math.round((average / 128) * 100));

        if (this.options.onVolumeChange) {
          this.options.onVolumeChange(volume);
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Errore setup Analyser:', e);
    }
  }

  private setupMediaRecorder(stream: MediaStream) {
    try {
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      }

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Raccoglie frammenti ogni secondo
      this.mediaRecorder.start(1000);
    } catch (e) {
      console.warn('MediaRecorder non supportato:', e);
    }
  }

  private setupSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log('Web Speech API non disponibile, uso registrazione audio diretta con Gemini');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        const fullText = (currentFinal || currentInterim).trim();
        if (fullText) {
          this.accumulatedSpeech = fullText;
          this.options.onInterim(fullText);

          // Rilevamento automatico fine frase / pausa nel parlato
          clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            this.flushSpeech();
          }, 1200);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        console.warn('SpeechRecognition error:', event.error);
      };

      this.recognition.onend = () => {
        // Riavvio istantaneo finché l'utente non preme stop
        if (this.isListening) {
          try {
            this.recognition?.start();
          } catch {
            // Ignore
          }
        }
      };

      this.recognition.start();
    } catch (e) {
      console.warn('Errore avvio SpeechRecognition:', e);
    }
  }

  // Invia il parlato accumulato o l'audio registrato
  public async flushSpeech() {
    clearTimeout(this.silenceTimer);

    const textToSend = this.accumulatedSpeech.trim();
    this.accumulatedSpeech = '';

    if (textToSend) {
      this.options.onFinalText(textToSend);
      // Resetta i chunk audio perché il testo è stato catturato con successo
      this.audioChunks = [];
      return;
    }

    // Se il riconoscimento vocale non ha prodotto testo, usa l'audio registrato con Gemini
    if (this.audioChunks.length > 0) {
      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      this.audioChunks = [];

      // Se l'audio ha una dimensione sufficiente (> 1KB)
      if (audioBlob.size > 1024) {
        try {
          const base64 = await this.blobToBase64(audioBlob);
          this.options.onFinalAudio(base64, mimeType);
        } catch (e) {
          console.error('Errore conversione audio:', e);
        }
      }
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Rimuove il prefisso "data:audio/webm;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  public async stop() {
    this.isListening = false;
    clearTimeout(this.silenceTimer);

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.options.onVolumeChange) {
      this.options.onVolumeChange(0);
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch {
        // Ignore
      }
      this.audioContext = null;
    }

    // Esegui un ultimo flush se c'è discorso in sospeso
    await this.flushSpeech();

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
