/* ============================================
   Magic Multiples Maze — Particle System
   ============================================ */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.ambientParticles = [];
    this.running = true;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initAmbient();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initAmbient() {
    const count = Math.min(40, Math.floor(window.innerWidth / 30));
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.3 - 0.1,
        opacity: Math.random() * 0.4 + 0.1,
        hue: Math.random() > 0.5 ? 260 : 220,
      });
    }
  }

  // Emit a burst of particles at a position
  emit(x, y, options = {}) {
    const {
      count = 20,
      color = { h: 140, s: 70, l: 60 },
      spread = 100,
      speed = 3,
      size = 4,
      life = 60,
      gravity = 0.05,
      type = 'circle',
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const vel = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: size * (0.5 + Math.random() * 0.5),
        life,
        maxLife: life,
        color: {
          h: color.h + (Math.random() - 0.5) * 20,
          s: color.s,
          l: color.l + (Math.random() - 0.5) * 10,
        },
        gravity,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  // Success explosion (green)
  emitSuccess(x, y) {
    this.emit(x, y, {
      count: 30,
      color: { h: 140, s: 80, l: 55 },
      speed: 5,
      size: 6,
      life: 50,
      type: 'star',
    });
    this.emit(x, y, {
      count: 15,
      color: { h: 50, s: 90, l: 60 },
      speed: 3,
      size: 4,
      life: 40,
      type: 'circle',
    });
  }

  // Error effect (gentle red)
  emitError(x, y) {
    this.emit(x, y, {
      count: 10,
      color: { h: 0, s: 70, l: 55 },
      speed: 2,
      size: 3,
      life: 30,
      gravity: 0.02,
      type: 'circle',
    });
  }

  // Celebration (confetti)
  emitCelebration() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = Math.random() * w;
        const y = h * 0.3 + Math.random() * h * 0.3;
        this.emit(x, y, {
          count: 25,
          color: { h: Math.random() * 360, s: 80, l: 60 },
          speed: 6,
          size: 5,
          life: 80,
          gravity: 0.08,
          type: Math.random() > 0.5 ? 'star' : 'square',
        });
      }, i * 200);
    }
  }

  // Gem fly trail
  emitTrail(x, y) {
    this.emit(x, y, {
      count: 3,
      color: { h: 210, s: 90, l: 65 },
      speed: 1,
      size: 3,
      life: 20,
      gravity: 0,
      type: 'circle',
    });
  }

  animate() {
    if (!this.running || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw ambient
    for (const p of this.ambientParticles) {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.y < -10) { p.y = this.canvas.height + 10; p.x = Math.random() * this.canvas.width; }
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.opacity})`;
      this.ctx.fill();
    }

    // Draw and update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;
      p.rotation += p.rotSpeed;

      const alpha = p.life / p.maxLife;
      const size = p.size * alpha;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = `hsl(${p.color.h}, ${p.color.s}%, ${p.color.l}%)`;

      if (p.type === 'star') {
        this.drawStar(0, 0, size);
      } else if (p.type === 'square') {
        this.ctx.fillRect(-size / 2, -size / 2, size, size);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Glow
      this.ctx.shadowColor = `hsl(${p.color.h}, ${p.color.s}%, ${p.color.l}%)`;
      this.ctx.shadowBlur = size * 2;
      this.ctx.fill();
      this.ctx.restore();

      if (p.life <= 0) this.particles.splice(i, 1);
    }

    requestAnimationFrame(() => this.animate());
  }

  drawStar(x, y, r) {
    const spikes = 5;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - r);
    for (let i = 0; i < spikes; i++) {
      this.ctx.lineTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r);
      rot += step;
      this.ctx.lineTo(x + Math.cos(rot) * (r * 0.4), y + Math.sin(rot) * (r * 0.4));
      rot += step;
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  destroy() {
    this.running = false;
    this.particles = [];
    this.ambientParticles = [];
  }
}
