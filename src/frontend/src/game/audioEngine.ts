/**
 * AudioEngine - All sounds generated programmatically via Web Audio API
 * No audio files needed.
 */

const MUTE_STORAGE_KEY = "meteorescape_muted";
const VOLUME_STORAGE_KEY = "meteorescape_volume";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgNodes: AudioNode[] = [];
  private bgInterval: ReturnType<typeof setTimeout> | null = null;
  private bgPlaying = false;
  private masterGain: GainNode | null = null;
  private _muted = false;
  private _volume = 0.6; // 0.0 - 1.0

  constructor() {
    // Restore muted state and volume from localStorage
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

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  /**
   * Background music: 140 BPM chiptune loop
   * Square wave melody + triangle bass + kick + hi-hat
   */
  startBackgroundMusic(): void {
    if (this.bgPlaying) return;
    this.bgPlaying = true;
    // Ensure AudioContext is running before scheduling nodes
    this.getCtx();

    const BPM = 140;
    const BEAT_MS = (60 / BPM) * 1000;

    // Pentatonic minor scale: D4=293.66, F4=349.23, G4=392, A4=440, C5=523.25
    const notes = [293.66, 349.23, 392, 440, 392, 349.23, 293.66, 523.25];
    let noteIndex = 0;

    const playBeat = () => {
      if (!this.bgPlaying) return;
      const ctx = this.getCtx();
      const now = ctx.currentTime;
      const master = this.getMaster();

      // --- Melody: square wave ---
      const melodyOsc = ctx.createOscillator();
      const melodyGain = ctx.createGain();
      melodyOsc.type = "square";
      melodyOsc.frequency.value = notes[noteIndex % notes.length];
      melodyGain.gain.setValueAtTime(0.08, now);
      melodyGain.gain.exponentialRampToValueAtTime(
        0.001,
        now + (BEAT_MS / 1000) * 0.9,
      );
      melodyOsc.connect(melodyGain);
      melodyGain.connect(master);
      melodyOsc.start(now);
      melodyOsc.stop(now + BEAT_MS / 1000);

      // --- Bass: triangle wave (octave down) ---
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = "triangle";
      bassOsc.frequency.value = notes[noteIndex % notes.length] / 2;
      bassGain.gain.setValueAtTime(0.12, now);
      bassGain.gain.exponentialRampToValueAtTime(
        0.001,
        now + (BEAT_MS / 1000) * 0.8,
      );
      bassOsc.connect(bassGain);
      bassGain.connect(master);
      bassOsc.start(now);
      bassOsc.stop(now + BEAT_MS / 1000);

      // --- Kick: every 2 beats ---
      if (noteIndex % 2 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = "sine";
        kickOsc.frequency.setValueAtTime(300, now);
        kickOsc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        kickGain.gain.setValueAtTime(0.4, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        kickOsc.connect(kickGain);
        kickGain.connect(master);
        kickOsc.start(now);
        kickOsc.stop(now + 0.2);
      }

      // --- Hi-hat: every beat ---
      {
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        const hihatFilter = ctx.createBiquadFilter();
        hihatFilter.type = "highpass";
        hihatFilter.frequency.value = 7000;
        const hihatGain = ctx.createGain();
        hihatGain.gain.setValueAtTime(0.06, now);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        noiseSource.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(master);
        noiseSource.start(now);
        noiseSource.stop(now + 0.06);
      }

      noteIndex++;
    };

    playBeat();
    this.bgInterval = setInterval(playBeat, BEAT_MS);
  }

  stopBackgroundMusic(): void {
    this.bgPlaying = false;
    if (this.bgInterval !== null) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    // Suspend the AudioContext so no scheduled nodes produce sound
    if (this.ctx && this.ctx.state === "running") {
      this.ctx.suspend();
    }
  }

  /**
   * Meteor hit sound
   * White noise burst + low freq sine + metallic click
   */
  playHitSound(): void {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;

    // White noise
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
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
  }

  /**
   * Meteor dodge sound - frequency sweep down
   */
  playDodgeSound(): void {
    const ctx = this.getCtx();
    const master = this.getMaster();
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
  }

  /**
   * Level up sound - pentatonic minor ascending arpeggio
   */
  playLevelUpSound(): void {
    const ctx = this.getCtx();
    const master = this.getMaster();
    // D4, F4, G4, A4, C5
    const arpNotes = [293.66, 349.23, 392, 440, 523.25];
    const noteLen = 0.08;

    arpNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + i * noteLen;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLen * 0.9);
      osc.connect(gain);
      gain.connect(master);
      osc.start(startTime);
      osc.stop(startTime + noteLen);
    });
  }

  /**
   * Power-up pickup sound - bright ascending chime (distinct from level-up)
   */
  playPickupSound(type: "heart" | "coin"): void {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;

    if (type === "heart") {
      // Heart: warm two-note chime going up
      const notes = [523.25, 783.99]; // C5, G5
      notes.forEach((freq, i) => {
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
      // Coin: short bright blip + shimmer
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
  }

  /**
   * Game over sound - descending dramatic sawtooth + rumble
   */
  playGameOverSound(): void {
    const ctx = this.getCtx();
    const master = this.getMaster();
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
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(master);
    rumbleOsc.start(ctx.currentTime);
    rumbleOsc.stop(ctx.currentTime + 0.9);
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
