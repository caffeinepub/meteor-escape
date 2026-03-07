/**
 * AudioEngine - All sounds generated programmatically via Web Audio API
 * No audio files needed.
 */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgNodes: AudioNode[] = [];
  private bgInterval: ReturnType<typeof setTimeout> | null = null;
  private bgPlaying = false;
  private masterGain: GainNode | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
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
