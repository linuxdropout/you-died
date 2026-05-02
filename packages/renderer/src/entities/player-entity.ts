import { Container, Graphics } from 'pixi.js'
import type { AnimationName, PlayerColor } from '@you-died/assets'
import type { RenderPlayer } from '@you-died/sim'
import type { PlayerSprite, SpriteManager } from '../sprite-manager.js'

const MOVEMENT_THRESHOLD = 0.5
const SPRITE_FOOT_OFFSET = 8

const GHOST_BOB_AMPLITUDE = 3
const GHOST_BOB_FREQUENCY = 0.05
const GHOST_ALPHA_CENTER = 0.55
const GHOST_ALPHA_RANGE = 0.15
const GHOST_ALPHA_FREQUENCY = 0.03
const TRAIL_RECORD_INTERVAL = 3
const MAX_TRAIL_POSITIONS = 4
const TRAIL_COLOR = 0x8ecae6
const TRAIL_PLAYER_W = 32
const TRAIL_PLAYER_H = 48

export class PlayerEntity {
  readonly container = new Container()
  private sprite: PlayerSprite | null = null
  private currentColor: PlayerColor | null = null
  private currentGhost = false
  private prevX = 0
  private lastTick = -1
  private frameCount = 0
  private readonly trailGfx = new Graphics()
  private readonly trailPositions: { x: number; y: number }[] = []

  attach(sprites: SpriteManager, color: PlayerColor, ghost: boolean) {
    if (this.sprite && this.currentColor === color && this.currentGhost === ghost) return
    this.detach()
    this.sprite = sprites.createPlayerSprite(color, ghost)
    if (ghost) {
      this.container.addChild(this.trailGfx)
    }
    this.container.addChild(this.sprite.sprite)
    this.container.alpha = ghost ? GHOST_ALPHA_CENTER : 1
    this.currentColor = color
    this.currentGhost = ghost
  }

  update(player: RenderPlayer, tick: number) {
    if (!this.sprite) return
    this.frameCount++

    this.container.position.set(player.pos.x, player.pos.y + SPRITE_FOOT_OFFSET)
    this.container.scale.x = player.facingRight ? 1 : -1

    if (tick !== this.lastTick) {
      const anim = deriveAnimation(player, Math.abs(player.pos.x - this.prevX))
      this.sprite.playAnimation(anim)
      this.prevX = player.pos.x
      this.lastTick = tick
    }

    this.sprite.update(1)

    if (this.currentGhost) {
      this.container.position.y += Math.sin(this.frameCount * GHOST_BOB_FREQUENCY) * GHOST_BOB_AMPLITUDE
      this.container.alpha = GHOST_ALPHA_CENTER + Math.sin(this.frameCount * GHOST_ALPHA_FREQUENCY) * GHOST_ALPHA_RANGE

      if (this.frameCount % TRAIL_RECORD_INTERVAL === 0) {
        this.trailPositions.push({ x: player.pos.x, y: player.pos.y })
        if (this.trailPositions.length > MAX_TRAIL_POSITIONS) {
          this.trailPositions.shift()
        }
      }

      this.trailGfx.clear()
      for (let i = 0; i < this.trailPositions.length; i++) {
        const tp = this.trailPositions[i]!
        const relX = tp.x - player.pos.x
        const relY = tp.y - player.pos.y
        const alpha = 0.15 * ((i + 1) / this.trailPositions.length)
        this.trailGfx.rect(relX - TRAIL_PLAYER_W / 2, relY - TRAIL_PLAYER_H, TRAIL_PLAYER_W, TRAIL_PLAYER_H)
        this.trailGfx.fill({ color: TRAIL_COLOR, alpha })
      }
    }
  }

  detach() {
    if (!this.sprite) return
    this.container.removeChild(this.sprite.sprite)
    this.sprite.sprite.destroy()
    if (this.currentGhost) {
      this.container.removeChild(this.trailGfx)
    }
    this.trailGfx.clear()
    this.trailPositions.length = 0
    this.sprite = null
    this.currentColor = null
    this.currentGhost = false
  }

  reset() {
    this.detach()
    this.prevX = 0
    this.lastTick = -1
    this.frameCount = 0
    this.container.alpha = 1
    this.container.scale.set(1, 1)
    this.container.position.set(0, 0)
  }
}

function deriveAnimation(player: RenderPlayer, dx: number): AnimationName {
  if (!player.alive) return 'death'
  if (player.isSlashing) return 'slash'
  if (player.isShooting) return 'shoot'
  if (player.isDashing) return 'dash'
  if (!player.grounded) return 'jump'
  if (dx > MOVEMENT_THRESHOLD) return 'run'
  return 'idle'
}
