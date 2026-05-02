import { AnimatedSprite, Container, type Ticker } from 'pixi.js'
import type { RenderSlash } from '@you-died/sim'
import type { SpriteManager } from '../sprite-manager.js'

export class SlashEntity {
  readonly container = new Container()
  private sprite: AnimatedSprite | null = null

  attach(sprites: SpriteManager) {
    if (this.sprite) return
    this.sprite = sprites.createSlashEffect()
    this.container.addChild(this.sprite)
  }

  update(slash: RenderSlash) {
    if (!this.sprite) return

    this.sprite.position.set(slash.pos.x, slash.pos.y + 8)
    this.sprite.width = slash.width
    this.sprite.height = slash.height
    const absX = Math.abs(this.sprite.scale.x)
    this.sprite.scale.x = slash.facingRight ? absX : -absX
    this.container.alpha = slash.isGhost ? 0.5 : 1

    this.sprite.update({ deltaTime: 1 } as unknown as Ticker)
  }

  reset() {
    if (this.sprite) {
      this.container.removeChild(this.sprite)
      this.sprite.destroy()
      this.sprite = null
    }
    this.container.alpha = 1
    this.container.position.set(0, 0)
  }
}
