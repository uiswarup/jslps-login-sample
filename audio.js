/**
 * Tideline - Procedural Tidal Soundscape (Web Audio API)
 * Synthesizes realistic ocean surf, gentle wave crests, and sea foam whispers.
 * Zero external audio files required. Instant, soothing, and fully procedural.
 */

class TidalAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.swellFilter = null;
    this.foamFilter = null;
    this.noiseNode = null;
    this.volume = 0.45;
    this.timerId = null;
    this.onStateChange = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master gain node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Noise buffer generator (12 seconds of smooth oceanic noise)
    const bufferSize = this.ctx.sampleRate * 12;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    
    // Generate pink-brownish noise for deep water rumble and airy foam
    for (let channel = 0; channel < 2; channel++) {
      const output = noiseBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
        b6 = white * 0.115926;
      }
    }

    // Looping noise source
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // 2. High-pass filter to eliminate mud / sub-frequencies
    const hpFilter = this.ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 65;

    // 3. Main tidal swell filter (dynamic sweeping bandpass / lowpass)
    this.swellFilter = this.ctx.createBiquadFilter();
    this.swellFilter.type = 'lowpass';
    this.swellFilter.frequency.value = 350;
    this.swellFilter.Q.value = 1.8;

    // 4. Subtle foam spray filter (air and mist)
    this.foamFilter = this.ctx.createBiquadFilter();
    this.foamFilter.type = 'bandpass';
    this.foamFilter.frequency.value = 1800;
    this.foamFilter.Q.value = 0.9;

    const foamGain = this.ctx.createGain();
    foamGain.gain.value = 0.28;

    // Routing
    this.noiseNode.connect(hpFilter);
    hpFilter.connect(this.swellFilter);
    this.swellFilter.connect(this.masterGain);

    hpFilter.connect(this.foamFilter);
    this.foamFilter.connect(foamGain);
    foamGain.connect(this.masterGain);

    this.noiseNode.start(0);
  }

  startSwellLoop() {
    if (!this.ctx) return;

    const cycleTime = 7.5; // Seconds per ocean swell cycle

    const scheduleWaveCycle = () => {
      if (!this.isPlaying) return;
      const now = this.ctx.currentTime;

      // Swell rise (Incoming tide)
      this.swellFilter.frequency.cancelScheduledValues(now);
      this.swellFilter.frequency.setValueAtTime(this.swellFilter.frequency.value, now);
      this.swellFilter.frequency.exponentialRampToValueAtTime(850, now + cycleTime * 0.42);

      // Crest & Wash back (Outgoing tide)
      this.swellFilter.frequency.exponentialRampToValueAtTime(240, now + cycleTime);

      this.timerId = setTimeout(scheduleWaveCycle, (cycleTime - 0.2) * 1000);
    };

    scheduleWaveCycle();
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.ctx) this.init();
    this.isPlaying = true;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 1.2);
    this.startSwellLoop();

    if (this.onStateChange) this.onStateChange(true);
  }

  pause() {
    if (!this.ctx) return;
    this.isPlaying = false;
    clearTimeout(this.timerId);
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.8);

    if (this.onStateChange) this.onStateChange(false);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.isPlaying) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.1);
    }
  }
}

window.TidalAudio = TidalAudio;
