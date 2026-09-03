/**
 * Tideline - Hydrodynamic Waves & Interactive Particle Engine (Canvas 2.0)
 * Features:
 * - Trochoidal Stokes wave math for realistic ocean wave peaks
 * - Smooth multi-layer transparency & foam crest line rendering
 * - Interactive pointer displacement & dynamic water ripple propagation
 * - Atmospheric particle simulation (sun glints, golden embers, bioluminescent spores)
 * - Dynamic theme color switching with interpolated transitions
 */

class WaveEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.t = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;
    this.currentTheme = 'azure';
    
    // Interactive mouse / pointer state
    this.pointer = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isDown: false,
      speed: 0,
      lastX: 0,
      lastY: 0
    };
    
    // Ripples array
    this.ripples = [];
    
    // Floating particles (bioluminescence / sun sparkles)
    this.particles = [];
    this.particleCount = 55;
    
    // Theme Palettes
    this.palettes = {
      azure: {
        fills: [
          'rgba(215, 234, 255, 0.42)',
          'rgba(188, 220, 255, 0.48)',
          'rgba(152, 202, 255, 0.54)',
          'rgba(115, 178, 252, 0.62)',
          'rgba(75, 152, 245, 0.72)',
          'rgba(45, 125, 235, 0.82)'
        ],
        strokes: [
          'rgba(255, 255, 255, 0.92)',
          'rgba(215, 238, 255, 0.80)',
          'rgba(170, 215, 255, 0.65)'
        ],
        foam: 'rgba(255, 255, 255, 0.85)',
        particleColor: 'rgba(255, 255, 255, 0.75)',
        particleGlow: 'rgba(140, 195, 255, 0.5)'
      },
      sunset: {
        fills: [
          'rgba(255, 224, 210, 0.44)',
          'rgba(255, 192, 175, 0.50)',
          'rgba(250, 155, 142, 0.56)',
          'rgba(235, 115, 125, 0.64)',
          'rgba(205, 80, 120, 0.72)',
          'rgba(140, 48, 105, 0.82)'
        ],
        strokes: [
          'rgba(255, 244, 235, 0.92)',
          'rgba(255, 205, 185, 0.82)',
          'rgba(245, 150, 160, 0.68)'
        ],
        foam: 'rgba(255, 240, 230, 0.88)',
        particleColor: 'rgba(255, 225, 180, 0.85)',
        particleGlow: 'rgba(249, 115, 22, 0.5)'
      },
      bioluminescent: {
        fills: [
          'rgba(8, 32, 60, 0.52)',
          'rgba(6, 52, 85, 0.60)',
          'rgba(5, 78, 110, 0.68)',
          'rgba(6, 115, 140, 0.75)',
          'rgba(8, 155, 170, 0.82)',
          'rgba(12, 195, 205, 0.88)'
        ],
        strokes: [
          'rgba(140, 255, 245, 0.95)',
          'rgba(60, 230, 245, 0.85)',
          'rgba(20, 190, 230, 0.70)'
        ],
        foam: 'rgba(180, 255, 250, 0.95)',
        particleColor: 'rgba(120, 255, 245, 0.95)',
        particleGlow: 'rgba(6, 182, 212, 0.85)'
      },
      dawn: {
        fills: [
          'rgba(240, 230, 250, 0.44)',
          'rgba(222, 208, 242, 0.50)',
          'rgba(200, 180, 232, 0.56)',
          'rgba(175, 148, 222, 0.64)',
          'rgba(148, 118, 208, 0.72)',
          'rgba(118, 88, 188, 0.82)'
        ],
        strokes: [
          'rgba(255, 255, 255, 0.92)',
          'rgba(242, 230, 255, 0.80)',
          'rgba(215, 190, 248, 0.68)'
        ],
        foam: 'rgba(255, 255, 255, 0.88)',
        particleColor: 'rgba(250, 240, 255, 0.85)',
        particleGlow: 'rgba(168, 85, 247, 0.5)'
      }
    };
    
    this.init();
  }

  init() {
    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: this.height * 0.3 + Math.random() * (this.height * 0.65),
        baseY: this.height * 0.3 + Math.random() * (this.height * 0.65),
        size: 1.2 + Math.random() * 2.8,
        speedX: 0.15 + Math.random() * 0.45,
        speedY: (Math.random() - 0.5) * 0.2,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        glow: Math.random() > 0.4
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.initParticles();
    });

    const updatePointer = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      const dx = x - this.pointer.lastX;
      const dy = y - this.pointer.lastY;
      this.pointer.speed = Math.sqrt(dx * dx + dy * dy);
      
      this.pointer.targetX = x;
      this.pointer.targetY = y;
      this.pointer.lastX = x;
      this.pointer.lastY = y;

      // Spawn a water ripple on mouse movement
      if (this.pointer.speed > 8 && Math.random() > 0.4) {
        this.addRipple(x, y, Math.min(this.pointer.speed * 0.6, 25));
      }
    };

    window.addEventListener('mousemove', (e) => {
      updatePointer(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('mousedown', (e) => {
      this.pointer.isDown = true;
      const rect = this.canvas.getBoundingClientRect();
      this.addRipple(e.clientX - rect.left, e.clientY - rect.top, 35);
    });

    window.addEventListener('mouseup', () => {
      this.pointer.isDown = false;
    });

    window.addEventListener('mouseleave', () => {
      this.pointer.targetX = -1000;
      this.pointer.targetY = -1000;
    });
  }

  addRipple(x, y, power = 20) {
    if (this.ripples.length > 25) {
      this.ripples.shift();
    }
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: 120 + power * 3,
      strength: power,
      speed: 2.2 + power * 0.05,
      age: 0
    });
  }

  setTheme(themeName) {
    if (this.palettes[themeName]) {
      this.currentTheme = themeName;
    }
  }

  /* Trochoidal Stokes wave math with organic multi-frequency harmonics */
  getY(x, baseY, amp, freq, spd, ph) {
    const theta = x * freq + this.t * spd + ph;
    
    // Fundamental wave
    let y = baseY + Math.sin(theta) * amp;
    
    // Crest sharpening (Trochoidal Stokes non-linearity)
    y -= Math.cos(2 * theta) * (amp * 0.22);
    
    // High-frequency surface ripples
    y += Math.sin(theta * 2.4 + 1.4) * (amp * 0.28);
    y += Math.sin(theta * 0.48 + 3.8) * (amp * 0.16);

    // Pointer hydrodynamic repulsion / surface depression
    if (this.pointer.x > -500) {
      const pDist = Math.abs(x - this.pointer.x);
      if (pDist < 160) {
        const factor = (1 - pDist / 160);
        y += Math.sin(pDist * 0.06 - this.t * 3) * factor * 14;
      }
    }

    // Ripple wave contribution
    for (let r = 0; r < this.ripples.length; r++) {
      const rip = this.ripples[r];
      const dist = Math.abs(x - rip.x);
      if (dist < rip.radius + 35 && dist > rip.radius - 35) {
        const ringFactor = 1 - Math.abs(dist - rip.radius) / 35;
        const decay = Math.max(0, 1 - rip.age / rip.maxRadius);
        y += Math.sin((dist - rip.radius) * 0.25) * rip.strength * ringFactor * decay * 0.5;
      }
    }

    return y;
  }

  drawWave(i, totalWaves) {
    const W = this.width;
    const H = this.height;
    const pal = this.palettes[this.currentTheme] || this.palettes.azure;
    
    // Layer progression from back to front
    const baseY = H * 0.18 + (i / totalWaves) * H * 0.52;
    const amp   = 22 + (totalWaves - i) * 11;
    const freq  = 0.0055 + i * 0.0016;
    const spd   = 0.32  + i * 0.11;
    const ph    = i * 1.45;

    // Build wave path
    this.ctx.beginPath();
    this.ctx.moveTo(0, H);
    
    const step = 3;
    for (let x = 0; x <= W + step; x += step) {
      const y = this.getY(x, baseY, amp, freq, spd, ph);
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.lineTo(W, H);
    this.ctx.closePath();

    // Fill with layered oceanic color
    this.ctx.fillStyle = pal.fills[Math.min(i, pal.fills.length - 1)];
    this.ctx.fill();

    // Crest foam & specular highlight on top wave layers
    if (i < 4) {
      this.ctx.beginPath();
      for (let x = 0; x <= W + step; x += step) {
        const y = this.getY(x, baseY, amp, freq, spd, ph);
        x === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
      }
      this.ctx.strokeStyle = pal.strokes[Math.min(i, pal.strokes.length - 1)];
      this.ctx.lineWidth = i === 0 ? 2.2 : 1.5;
      this.ctx.stroke();

      // Top wave foam spray highlights
      if (i === 0) {
        this.ctx.strokeStyle = pal.foam;
        this.ctx.lineWidth = 1.0;
        this.ctx.setLineDash([8, 14, 4, 12]);
        this.ctx.lineDashOffset = -this.t * 30;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    }
  }

  updateRipples() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.age += r.speed;
      if (r.age >= r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  }

  drawParticles() {
    const pal = this.palettes[this.currentTheme] || this.palettes.azure;
    const isBio = this.currentTheme === 'bioluminescent';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Drift gently horizontally and ride subtle vertical swells
      p.x += p.speedX;
      if (p.x > this.width + 10) p.x = -10;

      const waveY = this.getY(p.x, p.baseY, 15, 0.006, 0.3, 0);
      const pulse = Math.sin(this.t * 5 + p.phase) * 0.5 + 0.5;

      // Pointer glow reaction
      let proximityBonus = 0;
      if (this.pointer.x > -500) {
        const dx = p.x - this.pointer.x;
        const dy = waveY - this.pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          proximityBonus = (1 - dist / 120) * 1.5;
        }
      }

      this.ctx.save();
      this.ctx.beginPath();
      const currentRadius = p.size * (0.8 + pulse * 0.4 + proximityBonus * 0.5);
      this.ctx.arc(p.x, waveY, Math.max(0.5, currentRadius), 0, Math.PI * 2);

      if (isBio || p.glow || proximityBonus > 0.2) {
        this.ctx.shadowBlur = 10 + proximityBonus * 12;
        this.ctx.shadowColor = pal.particleGlow;
      }

      this.ctx.fillStyle = pal.particleColor;
      this.ctx.globalAlpha = Math.min(1, 0.35 + pulse * 0.45 + proximityBonus * 0.4);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  animate() {
    // Smooth pointer easing
    if (this.pointer.targetX > -500) {
      this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.12;
      this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.12;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update ripples physics
    this.updateRipples();

    // Render multi-layered fluid waves
    const totalWaves = 6;
    for (let i = 0; i < totalWaves; i++) {
      this.drawWave(i, totalWaves);
    }

    // Render floating luminous sea particles / sun glints
    this.drawParticles();

    // Advance time
    this.t += 0.011;

    requestAnimationFrame(() => this.animate());
  }
}

// Global hook
window.WaveEngine = WaveEngine;
