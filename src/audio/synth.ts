// Web Audio API Sound Engine for Kamioshi.si Ema Shrine Wall
// Featuring a looping traditional Japanese Koto (箏) harp synthesizer & shrine acoustics

interface KotoNoteEvent {
  melodyFreq: number;
  bassFreq?: number;
  harmonyFreq?: number;
  durationBeats: number;
  vibrato?: boolean;
  graceFreq?: number;
}

// Traditional Japanese Hirajōshi (平調子) Koto Tuning Frequencies (D minor / In-sen modal scale)
const N = {
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  A3: 220.00,
  Bb3: 233.08,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  A4: 440.00,
  Bb4: 466.16,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  A5: 880.00
};

// Traditional "Sakura Sakura" (さくらさくら) & Koto Courtyard Variation in Hirajōshi tuning
const KOTO_SCORE: KotoNoteEvent[] = [
  // Verse 1: "Sakura, sakura..."
  { melodyFreq: N.A4, bassFreq: N.D3, harmonyFreq: N.A3, durationBeats: 2 },
  { melodyFreq: N.A4, durationBeats: 2 },
  { melodyFreq: N.Bb4, bassFreq: N.D3, durationBeats: 3, vibrato: true },
  { melodyFreq: 0, durationBeats: 1 }, // gentle breath (ma)

  { melodyFreq: N.A4, bassFreq: N.D3, harmonyFreq: N.A3, durationBeats: 2 },
  { melodyFreq: N.A4, durationBeats: 2 },
  { melodyFreq: N.Bb4, bassFreq: N.D3, durationBeats: 3, vibrato: true },
  { melodyFreq: 0, durationBeats: 1 },

  // "Yayoi no sora wa..."
  { melodyFreq: N.A4, bassFreq: N.F3, durationBeats: 1 },
  { melodyFreq: N.Bb4, durationBeats: 1 },
  { melodyFreq: N.D5, bassFreq: N.Bb3, graceFreq: N.A4, durationBeats: 1 },
  { melodyFreq: N.Bb4, durationBeats: 1 },
  { melodyFreq: N.A4, bassFreq: N.F3, durationBeats: 1 },
  { melodyFreq: N.Bb4, durationBeats: 0.5 },
  { melodyFreq: N.A4, durationBeats: 0.5 },
  { melodyFreq: N.F4, bassFreq: N.D3, durationBeats: 2, vibrato: true },

  // "Miwatasu kagiri..."
  { melodyFreq: N.E4, bassFreq: N.A3, durationBeats: 1 },
  { melodyFreq: N.D4, durationBeats: 1 },
  { melodyFreq: N.E4, bassFreq: N.E3, durationBeats: 1 },
  { melodyFreq: N.F4, durationBeats: 1 },
  { melodyFreq: N.E4, bassFreq: N.A3, durationBeats: 3, vibrato: true },
  { melodyFreq: 0, durationBeats: 1 },

  // "Kasumi ka kumo ka..."
  { melodyFreq: N.A4, bassFreq: N.D3, durationBeats: 1 },
  { melodyFreq: N.Bb4, durationBeats: 1 },
  { melodyFreq: N.D5, bassFreq: N.Bb3, graceFreq: N.A4, durationBeats: 1 },
  { melodyFreq: N.Bb4, durationBeats: 1 },
  { melodyFreq: N.A4, bassFreq: N.F3, durationBeats: 1 },
  { melodyFreq: N.Bb4, durationBeats: 0.5 },
  { melodyFreq: N.A4, durationBeats: 0.5 },
  { melodyFreq: N.F4, bassFreq: N.D3, durationBeats: 2, vibrato: true },

  // "Nioi zo izuru..."
  { melodyFreq: N.E4, bassFreq: N.A3, durationBeats: 1 },
  { melodyFreq: N.D4, durationBeats: 1 },
  { melodyFreq: N.E4, bassFreq: N.E3, durationBeats: 1 },
  { melodyFreq: N.F4, durationBeats: 1 },
  { melodyFreq: N.D4, bassFreq: N.D3, harmonyFreq: N.A3, durationBeats: 3, vibrato: true },
  { melodyFreq: 0, durationBeats: 1 },

  // Bridge: "Izaya, izaya, mini yukan..."
  { melodyFreq: N.D5, bassFreq: N.D4, graceFreq: N.A4, durationBeats: 1 },
  { melodyFreq: N.E5, durationBeats: 1 },
  { melodyFreq: N.F5, bassFreq: N.Bb3, durationBeats: 2, vibrato: true },
  { melodyFreq: N.E5, durationBeats: 1 },
  { melodyFreq: N.D5, bassFreq: N.A3, durationBeats: 1 },
  { melodyFreq: N.Bb4, durationBeats: 1 },
  { melodyFreq: N.A4, bassFreq: N.F3, durationBeats: 2, vibrato: true },

  { melodyFreq: N.Bb4, bassFreq: N.E3, durationBeats: 1 },
  { melodyFreq: N.A4, durationBeats: 1 },
  { melodyFreq: N.F4, bassFreq: N.D3, durationBeats: 1 },
  { melodyFreq: N.E4, durationBeats: 1 },
  { melodyFreq: N.D4, bassFreq: N.D3, harmonyFreq: N.A3, durationBeats: 3, vibrato: true },

  // Traditional Koto Arpeggio Sweep (Sara-rin) turnaround before looping
  { melodyFreq: N.D3, durationBeats: 0.35 },
  { melodyFreq: N.E3, durationBeats: 0.35 },
  { melodyFreq: N.F3, durationBeats: 0.35 },
  { melodyFreq: N.A3, durationBeats: 0.35 },
  { melodyFreq: N.Bb3, durationBeats: 0.35 },
  { melodyFreq: N.D4, durationBeats: 0.35 },
  { melodyFreq: N.E4, durationBeats: 0.35 },
  { melodyFreq: N.F4, durationBeats: 0.35 },
  { melodyFreq: N.A4, bassFreq: N.D3, durationBeats: 2.2, vibrato: true }
];

class ShrineAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterMusicGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private loopTimer: number | null = null;
  private currentStepIndex: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private ensureMusicBus() {
    if (!this.ctx) return;
    if (!this.masterMusicGain) {
      this.masterMusicGain = this.ctx.createGain();
      this.masterMusicGain.gain.setValueAtTime(0.42, this.ctx.currentTime);

      // Gentle courtyard acoustic echo for the Koto strings
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.34, this.ctx.currentTime);

      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.setValueAtTime(0.24, this.ctx.currentTime);

      const echoFilter = this.ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);

      const wetGain = this.ctx.createGain();
      wetGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

      // Dry + Wet routing
      this.masterMusicGain.connect(this.ctx.destination);
      this.masterMusicGain.connect(this.delayNode);
      this.delayNode.connect(echoFilter);
      echoFilter.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      echoFilter.connect(wetGain);
      wetGain.connect(this.ctx.destination);
    }
  }

  public toggleMute(): boolean {
    this.initContext();
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
    return !this.isMuted;
  }

  public getIsPlaying(): boolean {
    return !this.isMuted;
  }

  // Synthesize a single plucked Japanese Koto (箏) silk string over a paulownia soundboard
  private pluckKotoString(
    freq: number,
    startTime: number,
    volume = 0.22,
    sustainSec = 2.8,
    withVibrato = false
  ) {
    if (!this.ctx || !this.masterMusicGain || freq <= 0) return;

    try {
      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, startTime);
      // Fast ivory-pick (tsume) attack
      noteGain.gain.linearRampToValueAtTime(volume, startTime + 0.008);
      // Initial pluck decay into warm paulownia wood sustain
      noteGain.gain.exponentialRampToValueAtTime(volume * 0.38, startTime + 0.28);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + sustainSec);

      // Warm resonant low-pass filter that brightens on pluck and mellows as the string rings
      const stringFilter = this.ctx.createBiquadFilter();
      stringFilter.type = 'lowpass';
      stringFilter.frequency.setValueAtTime(Math.min(6500, freq * 8.5), startTime);
      stringFilter.frequency.exponentialRampToValueAtTime(
        Math.max(550, freq * 2.2),
        startTime + sustainSec * 0.75
      );
      stringFilter.Q.setValueAtTime(1.6, startTime);

      stringFilter.connect(noteGain);
      noteGain.connect(this.masterMusicGain);

      // 1. Fundamental + silk string body (triangle wave with subtle initial pitch-bend from pluck tension)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq * 1.012, startTime);
      osc1.frequency.exponentialRampToValueAtTime(freq, startTime + 0.035);

      // Optional left-hand Koto pitch ornament (oshi-de vibrato) on sustained melody notes
      if (withVibrato) {
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5.2, startTime + 0.35);
        lfoGain.gain.setValueAtTime(0.0, startTime);
        lfoGain.gain.setValueAtTime(0.0, startTime + 0.35);
        lfoGain.gain.linearRampToValueAtTime(freq * 0.007, startTime + 0.65);
        lfoGain.gain.exponentialRampToValueAtTime(0.01, startTime + sustainSec);
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfo.start(startTime);
        lfo.stop(startTime + sustainSec);
      }

      osc1.connect(stringFilter);
      osc1.start(startTime);
      osc1.stop(startTime + sustainSec);

      // 2. Second Harmonic (Octave brightness characteristic of Koto movable bridge ji)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.0, startTime);
      gain2.gain.setValueAtTime(0.36, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + sustainSec * 0.55);
      osc2.connect(gain2);
      gain2.connect(stringFilter);
      osc2.start(startTime);
      osc2.stop(startTime + sustainSec * 0.6);

      // 3. Third Harmonic (Twelfth overtone gives Koto its harp/zither resonance)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 3.0, startTime);
      gain3.gain.setValueAtTime(0.18, startTime);
      gain3.gain.exponentialRampToValueAtTime(0.001, startTime + sustainSec * 0.32);
      osc3.connect(gain3);
      gain3.connect(stringFilter);
      osc3.start(startTime);
      osc3.stop(startTime + sustainSec * 0.35);

      // 4. Ivory Pick (Tsume) Crisp Pluck Transient
      const pickOsc = this.ctx.createOscillator();
      const pickGain = this.ctx.createGain();
      pickOsc.type = 'sawtooth';
      pickOsc.frequency.setValueAtTime(freq * 4.0, startTime);
      pickOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.022);
      pickGain.gain.setValueAtTime(0.14, startTime);
      pickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.025);
      pickOsc.connect(pickGain);
      pickGain.connect(stringFilter);
      pickOsc.start(startTime);
      pickOsc.stop(startTime + 0.028);
    } catch {
      // Audio safety
    }
  }

  // Start looping traditional Japanese Koto (箏) music
  public startAmbient() {
    if (!this.ctx || this.isMuted) return;
    this.stopAmbient();
    this.ensureMusicBus();

    if (this.masterMusicGain) {
      const now = this.ctx.currentTime;
      this.masterMusicGain.gain.cancelScheduledValues(now);
      this.masterMusicGain.gain.setValueAtTime(0.01, now);
      this.masterMusicGain.gain.linearRampToValueAtTime(0.45, now + 0.4);
    }

    const beatDurationSec = 0.56; // Calm, contemplative Koto tempo (~107 eighth-note pulse)

    const playNextStep = () => {
      if (this.isMuted || !this.ctx) return;

      const step = KOTO_SCORE[this.currentStepIndex % KOTO_SCORE.length];
      this.currentStepIndex = (this.currentStepIndex + 1) % KOTO_SCORE.length;

      const now = this.ctx.currentTime + 0.02;

      // Optional grace note (kororin ornament) just before the main melody pluck
      if (step.graceFreq) {
        this.pluckKotoString(step.graceFreq, now, 0.11, 1.2, false);
      }

      // Main melody string pluck
      if (step.melodyFreq > 0) {
        const melodyStart = step.graceFreq ? now + 0.075 : now;
        this.pluckKotoString(
          step.melodyFreq,
          melodyStart,
          0.22,
          Math.max(2.4, step.durationBeats * beatDurationSec * 1.6),
          Boolean(step.vibrato)
        );
      }

      // Deep resonant bass Koto string (thumb pluck)
      if (step.bassFreq) {
        this.pluckKotoString(step.bassFreq, now + 0.015, 0.16, 3.6, false);
      }

      // Open fifth harmony string
      if (step.harmonyFreq) {
        this.pluckKotoString(step.harmonyFreq, now + 0.045, 0.12, 3.0, false);
      }

      const nextDelayMs = step.durationBeats * beatDurationSec * 1000;
      this.loopTimer = window.setTimeout(playNextStep, nextDelayMs);
    };

    playNextStep();
  }

  public stopAmbient() {
    if (this.loopTimer !== null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.masterMusicGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.masterMusicGain.gain.cancelScheduledValues(now);
        this.masterMusicGain.gain.setValueAtTime(this.masterMusicGain.gain.value, now);
        this.masterMusicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      } catch {
        // safe
      }
    }
  }

  // Realistic Japanese wooden clapper (Hyoshigi / Wood on Wood)
  public playWoodClack() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1100, now);
      clickOsc.frequency.exponentialRampToValueAtTime(190, now + 0.02);

      clickGain.gain.setValueAtTime(0.22, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(420, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(310, now + 0.07);

      bodyGain.gain.setValueAtTime(0.18, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(460, now);
      filter.Q.setValueAtTime(3.2, now);

      bodyOsc.connect(filter);
      filter.connect(bodyGain);
      bodyGain.connect(this.ctx.destination);

      bodyOsc.start(now);
      bodyOsc.stop(now + 0.09);
    } catch {
      // Audio safety
    }
  }

  // Warm bronze Japanese shrine bell / Koto harmonic chime
  public playShrineBell(baseFreq = 587.33) {
    this.initContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.99, now + 2.4);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      const overtone = this.ctx.createOscillator();
      const overGain = this.ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(baseFreq * 2.0, now);
      overGain.gain.setValueAtTime(0.06, now);
      overGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      overtone.connect(overGain);
      overGain.connect(this.ctx.destination);

      osc.start(now);
      overtone.start(now);
      osc.stop(now + 2.7);
      overtone.stop(now + 1.3);
    } catch {
      // Audio safety
    }
  }

  public playWindChime() {
    if (this.isMuted || !this.ctx) return;
    this.ensureMusicBus();
    const notes = [N.D4, N.E4, N.F4, N.A4, N.Bb4, N.D5];
    const freq = notes[Math.floor(Math.random() * notes.length)];
    this.pluckKotoString(freq, this.ctx.currentTime, 0.16, 2.2, false);
  }

  // Legacy compatibility helpers
  public playHapticBlip() {
    this.playWoodClack();
  }

  public playOracleAscension() {
    this.playShrineBell(N.A5);
  }
}

export const shrineAudio = new ShrineAudioEngine();
