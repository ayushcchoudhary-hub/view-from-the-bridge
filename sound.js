// Atmospheric Black-Box & Bridge Soundscape (Web Audio API)
export class MemorySound {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.master = null;
    this.osc1 = null;
    this.osc2 = null;
    this.filter = null;
    this.crackleGain = null;
    this.currentMood = 'docks';
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.ctx.destination);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 185;

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.05;

    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.value = 65.41;

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.value = 98.0;

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(droneGain);
    droneGain.connect(this.master);

    this.osc1.start();
    this.osc2.start();

    // Soft vinyl room hiss & subtle bridge breeze texture
    const len = this.ctx.sampleRate * 3;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const dust = Math.random() > 0.9988 ? (Math.random() * 2 - 1) * 0.35 : 0;
      data[i] = (Math.random() * 2 - 1) * 0.025 + dust;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1400;
    band.Q.value = 0.8;

    this.crackleGain = this.ctx.createGain();
    this.crackleGain.gain.value = 0.06;

    src.connect(band);
    band.connect(this.crackleGain);
    this.crackleGain.connect(this.master);
    src.start();
  }

  enable() {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    this.enabled = true;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0.65, now, 0.5);
    return true;
  }

  toggle() {
    if (!this.enabled) return this.enable();
    this.enabled = false;
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0.0001, now, 0.35);
    }
    return false;
  }

  setMood(mood) {
    if (mood === this.currentMood) return;
    this.currentMood = mood;
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const moods = {
      docks:    { f1: 65.41, f2: 98.00, cut: 185, crackle: 0.07 },
      warm:     { f1: 82.41, f2: 123.47, cut: 250, crackle: 0.14 },
      tension:  { f1: 73.42, f2: 103.83, cut: 215, crackle: 0.08 },
      crimson:  { f1: 61.74, f2: 87.31, cut: 165, crackle: 0.05 },
      cell:     { f1: 55.00, f2: 82.41, cut: 135, crackle: 0.03 },
      epilogue: { f1: 65.41, f2: 98.00, cut: 160, crackle: 0.06 },
      bridge:   { f1: 58.27, f2: 87.31, cut: 145, crackle: 0.12 } // Bb1 + F2 harbor night
    };
    const m = moods[mood] || moods.docks;
    this.osc1.frequency.setTargetAtTime(m.f1, now, 1.1);
    this.osc2.frequency.setTargetAtTime(m.f2, now, 1.1);
    this.filter.frequency.setTargetAtTime(m.cut, now, 0.9);
    this.crackleGain.gain.setTargetAtTime(m.crackle, now, 0.8);

    if (mood === 'bridge') {
      this.playDistantFoghorn();
    }
  }

  playDistantFoghorn() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(116.54, now);
    f.type = 'lowpass';
    f.frequency.value = 260;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.045, now + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    o.connect(f);
    f.connect(g);
    g.connect(this.master);
    o.start(now);
    o.stop(now + 2.9);
  }
}
