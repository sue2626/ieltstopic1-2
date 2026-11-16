/**
 * Text-to-Speech engine using Web Speech Synthesis API
 * Supports reading every word, synonym, antonym, and example sentence.
 */

type SpeechCallback = (isSpeaking: boolean, text: string) => void;

class SpeechController {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<SpeechCallback> = new Set();
  private voicePreference: 'en-US' | 'en-GB' = 'en-US';
  private rate: number = 0.9; // Slightly clearer pace for ESL learners

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(cb: SpeechCallback) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(isSpeaking: boolean, text: string) {
    this.listeners.forEach(cb => cb(isSpeaking, text));
  }

  public setVoice(pref: 'en-US' | 'en-GB') {
    this.voicePreference = pref;
  }

  public getVoice(): 'en-US' | 'en-GB' {
    return this.voicePreference;
  }

  public setRate(newRate: number) {
    this.rate = Math.max(0.6, Math.min(1.4, newRate));
  }

  public getRate(): number {
    return this.rate;
  }

  private speakTimer: ReturnType<typeof setTimeout> | null = null;

  public speak(text: string, onEnd?: () => void) {
    if (!this.synth) {
      return;
    }

    // Clean text: strip parenthesis annotations, symbols like ✔, ✖, =, etc.
    const cleanText = text
      .replace(/[✔✖=·\/\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    if (this.speakTimer) {
      clearTimeout(this.speakTimer);
      this.speakTimer = null;
    }

    // Detach handlers from any previous utterance so cancel() doesn't trigger error callbacks
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }

    const wasBusy = this.synth.speaking || this.synth.pending;
    try {
      if (wasBusy) {
        this.synth.cancel();
      }
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch {
      // Ignore synthesis state errors
    }

    const startUtterance = () => {
      if (!this.synth) return;
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = this.rate;
        utterance.pitch = 1.0;
        utterance.lang = this.voicePreference;

        // Try finding preferred voice
        const voices = this.synth.getVoices();
        const matchedVoice = voices.find(v =>
          v.lang.toLowerCase().includes(this.voicePreference.toLowerCase()) ||
          (this.voicePreference === 'en-US' && v.name.includes('US')) ||
          (this.voicePreference === 'en-GB' && (v.name.includes('UK') || v.name.includes('British')))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onstart = () => {
          this.currentUtterance = utterance;
          this.notify(true, cleanText);
        };

        utterance.onend = () => {
          if (this.currentUtterance === utterance) {
            this.currentUtterance = null;
          }
          this.notify(false, '');
          onEnd?.();
        };

        utterance.onerror = () => {
          if (this.currentUtterance === utterance) {
            this.currentUtterance = null;
          }
          this.notify(false, '');
          onEnd?.();
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
      } catch {
        this.currentUtterance = null;
        this.notify(false, '');
        onEnd?.();
      }
    };

    if (wasBusy) {
      // Brief yield lets Chromium finish flushing cancelled audio queue cleanly
      this.speakTimer = setTimeout(startUtterance, 40);
    } else {
      startUtterance();
    }
  }

  public stop() {
    if (this.speakTimer) {
      clearTimeout(this.speakTimer);
      this.speakTimer = null;
    }
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore
      }
      this.notify(false, '');
    }
  }

  public isSpeaking(): boolean {
    return !!this.synth && this.synth.speaking;
  }
}

export const speech = new SpeechController();
