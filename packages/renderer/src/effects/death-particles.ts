import { Container, Graphics } from 'pixi.js'

interface Particle {
  gfx: Graphics
  vx: number
  vy: number
  life: number
}

const GRAVITY = 0.3
const PARTICLE_COUNT = 10
const MAX_LIFE = 25

export class DeathParticles {
  private readonly container: Container
  private particles: Particle[] = []

  constructor(container: Container) {
    this.container = container
  }

  spawn(x: number, y: number) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4
      const speed = 1.5 + Math.random() * 2.5
      const size = 1 + Math.random() * 2
      const gfx = new Graphics()
      gfx.circle(0, 0, size)
      gfx.fill(0x8b0000)
      gfx.position.set(x, y)
      this.container.addChild(gfx)
      this.particles.push({
        gfx,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: MAX_LIFE,
      })
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!
      p.vy += GRAVITY
      p.gfx.position.x += p.vx
      p.gfx.position.y += p.vy
      p.life--
      p.gfx.alpha = p.life / MAX_LIFE

      if (p.life <= 0) {
        this.container.removeChild(p.gfx)
        p.gfx.destroy()
        this.particles.splice(i, 1)
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.container.removeChild(p.gfx)
      p.gfx.destroy()
    }
    this.particles.length = 0
  }
}
