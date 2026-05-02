import { Container } from 'pixi.js'
import type { AnimationName, PlayerColor } from '@you-died/assets'
import type { RenderPlayer } from '@you-died/sim'
import type { PlayerSprite, SpriteManager } from '../sprite-manager.js'

const MOVEMENT_THRESHOLD = 0.5

export class PlayerEntity {
  readonly container = new Container()
  private sprite: PlayerSprite | null = null
  private currentColor: PlayerColor | null = null
  private currentGhost = false
  private prevX = 0

  attach(sprites: SpriteManager, color: PlayerColor, ghost: boolean) {
    if (this.sprite && this.currentColor === color && this.currentGhost === ghost) return
    this.detach()
    this.sprite = sprites.createPlayerSprite(color, ghost)
    this.container.addChild(this.sprite.sprite)
    this.container.alpha = ghost ? 0.6 : 1
    this.currentColor = color
    this.currentGhost = ghost
  }

  update(player: RenderPlayer) {
    if (!this.sprite) return

    this.container.position.set(player.pos.x, player.pos.y)
    this.container.scale.x = player.facingRight ? 1 : -1

    const anim = deriveAnimation(player, Math.abs(player.pos.x - this.prevX))
    this.sprite.playAnimation(anim)
    this.sprite.update(1)

    this.prevX = player.pos.x
  }

  detach() {
    if (!this.sprite) return
    this.container.removeChild(this.sprite.sprite)
    this.sprite.sprite.destroy()
    this.sprite = null
    this.currentColor = null
    this.currentGhost = false
  }

  reset() {
    this.detach()
    this.prevX = 0
    this.container.alpha = 1
    this.container.scale.set(1, 1)
    this.container.position.set(0, 0)
  }
}

function deriveAnimation(player: RenderPlayer, dx: number): AnimationName {
  if (!player.alive) return 'death'
  if (player.isSlashing) return 'slash'
  if (player.isDashing) return 'dash'
  if (!player.grounded) return 'jump'
  if (dx > MOVEMENT_THRESHOLD) return 'run'
  return 'idle'
}
