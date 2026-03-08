/**
 * AudioEngine - All sounds generated programmatically via Web Audio API
 * No audio files needed.
 *
 * Music is split into 4 dynamic tiers based on level:
 *   Tier 1 (levels 1-10):  140 BPM - Intro / Calm  - bass + simple drum + lead melody
 *   Tier 2 (levels 11-20): 148 BPM - Fast / Active  - + background synth pad
 *   Tier 3 (levels 21-30): 154 BPM - Intense / Energetic - + arpeggio + complex drum
 *   Tier 4 (levels 31-50): 160 BPM - Chaotic / Peak - full layer with sub-bass & effects
 */

const MUTE_STORAGE_KEY = "meteorescape_muted";
const VOLUME_STORAGE_KEY = "meteorescape_volume";

function getMusicTier(level: number): 1 | 2 | 3 | 4 {
  if (level <= 10) return 1;
  if (level <= 20) return 2;
  if (level <= 30) return 3;
  return 4;
}

function getTierBPM(tier: 1 | 2 | 3 | 4): number {
  switch (tier) {
    case 1:
      return 140;
    case 2:
      return 148;
    case 3:
      return 154;
    case 4:
      return 160;
  }
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgInterval: ReturnType<typeof setInterval> | null = null;
  private bgPlaying = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private _muted = false;
  private _volume = 0.6;
  private bgSession = 0;
  private currentTier: 1 | 2 | 3 | 4 = 1;

  constructor() {
    try {
      this._muted = localStorage.getItem(MUTE_STORAGE_KEY) === "1";
      const storedVol = localStorage.getItem(VOLUME_STORAGE_KEY);
      if (storedVol !== null) {
        const parsed = Number.parseFloat(storedVol);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this._volume = parsed;
        }
      }
    } catch {
      this._muted = false;
    }
  }

  get isMuted(): boolean {
    return this._muted;
  }

  get volume(): number {
    return this._volume;
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, this._muted ? "1" : "0");
    } catch {
      // ignore
    }
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
    }
    return this._muted;
  }

  setMute(muted: boolean): void {
    this._muted = muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
    } catch {
      // ignore
    }
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this._volume;
    }
  }

  setVolume(vol: number): void {
    this._volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, this._volume.toString());
    } catch {
      // ignore
    }
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.value = this._volume;
    }
  }

  private async getCtxAsync(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 1;
      this.musicGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  private getCtxSync(): AudioContext | null {
    return this.ctx;
  }

  private getMaster(): GainNode | null {
    return this.masterGain;
  }

  /**
   * Start or update background music for a given level.
   * If the tier changes, the music restarts seamlessly.
   */
  startBackgroundMusic(level = 1): void {
    const newTier = getMusicTier(level);

    // If already playing the same tier, nothing to do
    if (this.bgPlaying && this.currentTier === newTier) return;

    // If tier changed, stop old music and restart with new tier
    if (this.bgPlaying && this.currentTier !== newTier) {
      this._stopBgInternal();
    }

    this.currentTier = newTier;
    this.bgPlaying = true;
    const session = ++this.bgSession;

    const BPM = getTierBPM(newTier);
    const BEAT_MS = (60 / BPM) * 1000;

    // ─── Scale notes per tier ────────────────────────────────────────────────
    // Tier 1: simple pentatonic minor (D4 scale) - calm, looping
    // Tier 2: same base + higher octave alternation - more energy
    // Tier 3: added chromatic passing tones - tension
    // Tier 4: aggressive syncopated motif - chaos
    const SCALES: Record<number, number[]> = {
      1: [293.66, 349.23, 392.0, 440.0, 392.0, 349.23, 293.66, 523.25],
      2: [349.23, 392.0, 440.0, 523.25, 587.33, 523.25, 440.0, 349.23],
      3: [392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25],
      4: [440.0, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 880.0],
    };
    const notes = SCALES[newTier];
    let noteIndex = 0;
    let _subBeatIndex = 0; // for 16th-note hi-hat in tiers 3-4

    const playBeat = (ctx: AudioContext) => {
      if (!this.bgPlaying || session !== this.bgSession) return;

      const now = ctx.currentTime;
      const music = this.musicGain;
      if (!music) return;

      const beatSec = BEAT_MS / 1000;
      const ni = noteIndex % notes.length;

      // ── MELODY: square wave (all tiers) ────────────────────────────────────
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // Tier 4: add slight detune for gritty feel
        osc.type = "square";
        osc.frequency.value = notes[ni];
        if (newTier >= 3) osc.detune.value = (Math.random() - 0.5) * 8;
        const melVol =
          newTier === 1
            ? 0.07
            : newTier === 2
              ? 0.09
              : newTier === 3
                ? 0.1
                : 0.11;
        gain.gain.setValueAtTime(melVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beatSec * 0.85);
        osc.connect(gain);
        gain.connect(music);
        osc.start(now);
        osc.stop(now + beatSec);
      }

      // ── BASS: triangle (all tiers, gets deeper in t3-t4) ───────────────────
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = notes[ni] / 2;
        const bassVol = newTier <= 2 ? 0.13 : 0.16;
        gain.gain.setValueAtTime(bassVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beatSec * 0.75);
        osc.connect(gain);
        gain.connect(music);
        osc.start(now);
        osc.stop(now + beatSec);
      }

      // ── SUB-BASS: sine an octave lower (tiers 3-4 only) ────────────────────
      if (newTier >= 3 && noteIndex % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = notes[ni] / 4;
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beatSec * 1.8);
        osc.connect(gain);
        gain.connect(music);
        osc.start(now);
        osc.stop(now + beatSec * 2);
      }

      // ── KICK DRUM (all tiers, more frequent in t3-t4) ──────────────────────
      const kickBeats = newTier <= 2 ? 2 : 1; // every beat in t3-t4
      if (noteIndex % kickBeats === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const kickFreqStart = newTier >= 3 ? 180 : 220;
        const kickFreqEnd = newTier >= 3 ? 40 : 55;
        osc.frequency.setValueAtTime(kickFreqStart, now);
        osc.frequency.exponentialRampToValueAtTime(kickFreqEnd, now + 0.12);
        const kickVol = newTier <= 2 ? 0.35 : 0.45;
        gain.gain.setValueAtTime(kickVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(music);
        osc.start(now);
        osc.stop(now + 0.22);

        // Kick click layer (tiers 3-4)
        if (newTier >= 3) {
          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          clickOsc.type = "square";
          clickOsc.frequency.value = 600;
          clickGain.gain.setValueAtTime(0.12, now);
          clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
          clickOsc.connect(clickGain);
          clickGain.connect(music);
          clickOsc.start(now);
          clickOsc.stop(now + 0.03);
        }
      }

      // ── SNARE on beats 2 & 4 (tiers 2-4) ──────────────────────────────────
      if (newTier >= 2 && noteIndex % 4 === 2) {
        const bufSize = ctx.sampleRate * 0.08;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = "bandpass";
        filt.frequency.value = 2000;
        filt.Q.value = 0.8;
        const gain = ctx.createGain();
        const snareVol = newTier === 2 ? 0.12 : newTier === 3 ? 0.16 : 0.2;
        gain.gain.setValueAtTime(snareVol, now + beatSec * 0.5);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          now + beatSec * 0.5 + 0.1,
        );
        src.connect(filt);
        filt.connect(gain);
        gain.connect(music);
        src.start(now + beatSec * 0.5);
        src.stop(now + beatSec * 0.5 + 0.12);
      }

      // ── HI-HAT: every beat (t1-t2) or 16th notes (t3-t4) ──────────────────
      const hatsPerBeat = newTier >= 3 ? 2 : 1;
      for (let h = 0; h < hatsPerBeat; h++) {
        const hatOffset = (h / hatsPerBeat) * beatSec;
        const bufSize = ctx.sampleRate * 0.04;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = "highpass";
        filt.frequency.value = newTier >= 3 ? 9000 : 7000;
        const gain = ctx.createGain();
        const hatVol =
          newTier === 1
            ? 0.05
            : newTier === 2
              ? 0.065
              : newTier === 3
                ? 0.075
                : 0.08;
        gain.gain.setValueAtTime(hatVol, now + hatOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + hatOffset + 0.04);
        src.connect(filt);
        filt.connect(gain);
        gain.connect(music);
        src.start(now + hatOffset);
        src.stop(now + hatOffset + 0.05);
      }
      _subBeatIndex++;

      // ── SYNTH PAD background (tiers 2-4) ───────────────────────────────────
      // Plays every 4 beats on the root note for an atmospheric wash
      if (newTier >= 2 && noteIndex % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = notes[0] * (newTier >= 4 ? 1.5 : 1);
        osc.detune.value = 7; // slight chorus effect
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = newTier >= 4 ? 2000 : 1200;
        const padVol = newTier === 2 ? 0.025 : newTier === 3 ? 0.035 : 0.045;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(padVol, now + beatSec * 0.5);
        gain.gain.linearRampToValueAtTime(0, now + beatSec * 3.5);
        osc.connect(filt);
        filt.connect(gain);
        gain.connect(music);
        osc.start(now);
        osc.stop(now + beatSec * 4);
      }

      // ── ARPEGGIO COUNTER-MELODY (tiers 3-4) ────────────────────────────────
      // Quick ascending run every 8 beats
      if (newTier >= 3 && noteIndex % 8 === 0) {
        const arpNotes = [notes[0], notes[1], notes[2], notes[3], notes[4]];
        arpNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t0 = now + idx * (beatSec / 4);
          osc.type = newTier === 4 ? "square" : "triangle";
          osc.frequency.value = freq * (newTier === 4 ? 2 : 1.5);
          const arpVol = newTier === 3 ? 0.045 : 0.055;
          gain.gain.setValueAtTime(arpVol, t0);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + beatSec * 0.22);
          osc.connect(gain);
          gain.connect(music);
          osc.start(t0);
          osc.stop(t0 + beatSec * 0.25);
        });
      }

      // ── CHAOS LAYER: short noise burst on off-beats (tier 4 only) ──────────
      if (newTier === 4 && noteIndex % 3 === 1) {
        const bufSize = ctx.sampleRate * 0.03;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = "bandpass";
        filt.frequency.value = 3500 + Math.random() * 1500;
        filt.Q.value = 4;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, now + beatSec * 0.75);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          now + beatSec * 0.75 + 0.04,
        );
        src.connect(filt);
        filt.connect(gain);
        gain.connect(music);
        src.start(now + beatSec * 0.75);
        src.stop(now + beatSec * 0.75 + 0.05);
      }

      noteIndex++;
    };

    this.getCtxAsync().then((ctx) => {
      if (!this.bgPlaying || session !== this.bgSession) return;

      if (this.musicGain) {
        this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
        this.musicGain.gain.value = 1;
      }

      playBeat(ctx);
      this.bgInterval = setInterval(() => playBeat(ctx), BEAT_MS);
    });
  }

  private _stopBgInternal(): void {
    this.bgSession++;
    this.bgPlaying = false;
    if (this.bgInterval !== null) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  stopBackgroundMusic(): void {
    this._stopBgInternal();
  }

  /**
   * Update music tier when level changes.
   * Call this from the game loop whenever level advances.
   */
  updateMusicForLevel(level: number): void {
    const newTier = getMusicTier(level);
    if (this.bgPlaying && this.currentTier !== newTier) {
      // Restart with new tier
      this.bgPlaying = false; // trick startBackgroundMusic into restarting
      this.startBackgroundMusic(level);
    }
  }

  /**
   * Meteor hit sound - White noise burst + low freq sine + metallic click
   */
  playHitSound(): void {
    this.getCtxAsync().then((ctx) => {
      const master = this.getMaster();
      if (!master) return;
      const now = ctx.currentTime;

      // White noise
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noiseSource.connect(noiseGain);
      noiseGain.connect(master);
      noiseSource.start(now);
      noiseSource.stop(now + 0.12);

      // Low freq boom
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = "sine";
      boomOsc.frequency.value = 80;
      boomGain.gain.setValueAtTime(0.5, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      boomOsc.connect(boomGain);
      boomGain.connect(master);
      boomOsc.start(now);
      boomOsc.stop(now + 0.2);

      // Metallic click
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = "square";
      clickOsc.frequency.value = 1200;
      clickGain.gain.setValueAtTime(0.2, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      clickOsc.connect(clickGain);
      clickGain.connect(master);
      clickOsc.start(now);
      clickOsc.stop(now + 0.04);
    });
  }

  /**
   * Meteor dodge sound - frequency sweep down
   */
  playDodgeSound(): void {
    this.getCtxAsync().then((ctx) => {
      const master = this.getMaster();
      if (!master) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  /**
   * Level up sound - pentatonic minor ascending arpeggio
   */
  playLevelUpSound(): void {
    this.getCtxAsync().then((ctx) => {
      const master = this.getMaster();
      if (!master) return;
      const arpNotes = [293.66, 349.23, 392, 440, 523.25];
      const noteLen = 0.08;

      arpNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + i * noteLen;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + noteLen * 0.9,
        );
        osc.connect(gain);
        gain.connect(master);
        osc.start(startTime);
        osc.stop(startTime + noteLen);
      });
    });
  }

  /**
   * Power-up pickup sound - bright ascending chime
   */
  playPickupSound(type: "heart" | "coin"): void {
    this.getCtxAsync().then((ctx) => {
      const master = this.getMaster();
      if (!master) return;
      const now = ctx.currentTime;

      if (type === "heart") {
        const heartNotes = [523.25, 783.99];
        heartNotes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t0 = now + i * 0.1;
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.25, t0);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
          osc.connect(gain);
          gain.connect(master);
          osc.start(t0);
          osc.stop(t0 + 0.2);
        });
      } else {
        // Coin: bright blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.12);

        // Shimmer
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.value = 3200;
        gain2.gain.setValueAtTime(0.08, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc2.connect(gain2);
        gain2.connect(master);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.16);
      }
    });
  }

  /**
   * Game over sound - descending dramatic sawtooth + rumble
   */
  playGameOverSound(): void {
    this.getCtxAsync().then((ctx) => {
      const master = this.getMaster();
      if (!master) return;
      const tones = [440, 220, 110, 55];

      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + i * 0.2;
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
        osc.connect(gain);
        gain.connect(master);
        osc.start(startTime);
        osc.stop(startTime + 0.22);
      });

      // Rumble
      const rumbleOsc = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumbleOsc.type = "sine";
      rumbleOsc.frequency.value = 40;
      rumbleGain.gain.setValueAtTime(0.3, ctx.currentTime);
      rumbleGain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.8,
      );
      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(master);
      rumbleOsc.start(ctx.currentTime);
      rumbleOsc.stop(ctx.currentTime + 0.9);
    });
  }

  destroy(): void {
    this.stopBackgroundMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Singleton
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}
