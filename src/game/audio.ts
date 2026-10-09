/**
 * High-fidelity Procedural Formula 1 Web Audio Synthesizer
 * Generates V6 Turbo Hybrid engine harmonics, turbo whine, tire scrub,
 * kerb rumble, DRS beeps, and start lights. Zero external asset dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine audio nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private turboOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private turboGain: GainNode | null = null;

  // Noise / tire / curb nodes
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;

  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;

  private isRunning: boolean = false;

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public startEngine() {
    if (this.isRunning) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Master engine gain
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.001, now);
      this.engineGain.connect(this.masterGain);

      // Osc 1: Primary V6 fundamental
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(90, now);

      // Osc 2: 2nd harmonic with slight detune
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sawtooth';
      this.osc2.frequency.setValueAtTime(180, now);
      this.osc2.detune.setValueAtTime(7, now);

      // Sub bass rumble
      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'triangle';
      this.oscSub.frequency.setValueAtTime(45, now);

      // Turbo charger spool (high sine whistling)
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(800, now);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0.001, now);
      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);

      // Connect engine oscillators to engine gain
      this.osc1.connect(this.engineGain);
      this.osc2.connect(this.engineGain);
      this.oscSub.connect(this.engineGain);

      this.osc1.start();
      this.osc2.start();
      this.oscSub.start();
      this.turboOsc.start();

      // Tire noise buffer setup
      this.setupTireAudio();
      this.setupRainAudio();

      this.isRunning = true;
    } catch {
      // Audio autoplay policy handled smoothly
    }
  }

  private setupTireAudio() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.tireNoiseNode = this.ctx.createBufferSource();
    this.tireNoiseNode.buffer = noiseBuffer;
    this.tireNoiseNode.loop = true;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.tireNoiseNode.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);

    this.tireNoiseNode.start();
  }

  private setupRainAudio() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const rainBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = rainBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.15;
    }

    this.rainNoiseNode = this.ctx.createBufferSource();
    this.rainNoiseNode.buffer = rainBuffer;
    this.rainNoiseNode.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.rainNoiseNode.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.rainNoiseNode.start();
  }

  public updateTelemetry(data: {
    rpm: number;
    speedKmh: number;
    throttle: number;
    brake: number;
    tireSlip: number;
    onKerb: boolean;
    rainIntensity: number;
  }) {
    if (!this.ctx || !this.isRunning || this.isMuted) return;

    const now = this.ctx.currentTime;
    const normRpm = Math.max(0.1, Math.min(1.0, (data.rpm - 3500) / (15000 - 3500)));

    // V6 fundamental freq ~ 70Hz at idle to ~ 420Hz at 15,000 RPM
    const baseFreq = 70 + normRpm * 360;

    if (this.osc1 && this.osc2 && this.oscSub && this.engineGain) {
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.osc2.frequency.setTargetAtTime(baseFreq * 2.01, now, 0.04);
      this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

      const targetGain = 0.08 + data.throttle * 0.22 + (data.rpm / 15000) * 0.08;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
    }

    // Turbo whistle
    if (this.turboOsc && this.turboGain) {
      const turboFreq = 600 + normRpm * 2200 + data.throttle * 500;
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.08);
      const turboVol = data.throttle * 0.035 * (normRpm > 0.4 ? 1 : 0.2);
      this.turboGain.gain.setTargetAtTime(turboVol, now, 0.06);
    }

    // Tire squeal
    if (this.tireGain && this.tireFilter) {
      const slipAmount = Math.max(0, Math.min(1, data.tireSlip + (data.brake > 0.8 && data.speedKmh > 60 ? 0.35 : 0)));
      const tireVol = slipAmount > 0.15 ? Math.min(0.25, (slipAmount - 0.15) * 0.35) : 0.0001;
      this.tireGain.gain.setTargetAtTime(tireVol, now, 0.04);
      this.tireFilter.frequency.setTargetAtTime(800 + data.speedKmh * 6, now, 0.05);
    }

    // Rain sound
    if (this.rainGain) {
      const rainVol = Math.min(0.2, data.rainIntensity * 0.18 + (data.speedKmh / 350) * data.rainIntensity * 0.08);
      this.rainGain.gain.setTargetAtTime(rainVol, now, 0.1);
    }
  }

  public playGearShift() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(140, now);
    popOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    popGain.gain.setValueAtTime(0.25, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    popOsc.connect(popGain);
    popGain.connect(this.masterGain!);
    popOsc.start(now);
    popOsc.stop(now + 0.1);
  }

  public playKerbClack() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(65, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playDrsChirp(activated: boolean) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startFreq = activated ? 880 : 550;
    const endFreq = activated ? 1320 : 330;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playStartLightBeep(isLightsOut: boolean) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const freq = isLightsOut ? 1500 : 750;
    const duration = isLightsOut ? 0.35 : 0.12;

    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  public playDevCheatSound() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.07);
      gain.gain.setValueAtTime(0.2, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.18);
    });
  }

  public stopEngine() {
    if (!this.isRunning) return;
    try {
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0.001, this.ctx!.currentTime, 0.1);
      }
      if (this.tireGain) {
        this.tireGain.gain.setTargetAtTime(0.001, this.ctx!.currentTime, 0.1);
      }
    } catch {
      // Ignored
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const sound = new SoundEngine();
