import { AnimatedSprite, Container, Graphics } from 'pixi.js'
import type { RenderProjectile } from '@you-died/sim'
import type { SpriteManager } from '../sprite-manager.js'

const MAX_TRAIL_LENGTH = 6
const TRAIL_ALPHA_START = 0.4

export class ProjectileEntity {
  readonly container = new Container()
  private sprite: AnimatedSprite | null = null
  private trail = new Graphics()
  private positions: { x: number; y: number }[] = []

  constructor() {
    this.container.addChild(this.trail)
  }

  attach(sprites: SpriteManager) {
    if (this.sprite) return
    this.sprite = sprites.createBulletSprite()
    this.container.addChild(this.sprite)
  }

  update(proj: RenderProjectile) {
    if (!this.sprite) return

    this.sprite.position.set(proj.pos.x, proj.pos.y)
    this.sprite.update({ deltaTime: 1 } as any)
    this.container.alpha = proj.isGhost ? 0.5 : 1

    this.positions.push({ x: proj.pos.x, y: proj.pos.y })
    if (this.positions.length > MAX_TRAIL_LENGTH) this.positions.shift()

    this.trail.clear()
    for (let i = 0; i < this.positions.length - 1; i++) {
      const from = this.positions[i]!
      const to = this.positions[i + 1]!
      const alpha = TRAIL_ALPHA_START * ((i + 1) / this.positions.length)
      this.trail.moveTo(from.x, from.y)
      this.trail.lineTo(to.x, to.y)
      this.trail.stroke({ width: 1, color: 0xffcc00, alpha })
    }
  }

  reset() {
    if (this.sprite) {
      this.container.removeChild(this.sprite)
      this.sprite.destroy()
      this.sprite = null
    }
    this.trail.clear()
    this.positions.length = 0
    this.container.alpha = 1
    this.container.position.set(0, 0)
  }
}
