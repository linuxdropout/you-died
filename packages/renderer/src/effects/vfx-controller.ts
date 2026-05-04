import type { GameEvent, RenderFrame } from '@you-died/sim'
import type { PlayerId } from '@you-died/protocol'
import type { LayerManager } from '../layers/layer-manager.js'
import type { MatchContext, ScreenEvent } from '../types.js'
import type { SoundManager } from '../audio/sound-manager.js'
import { ScreenShake } from '../camera/screen-shake.js'
import { DeathParticles } from './death-particles.js'
import { RewindEffect } from './rewind-effect.js'
import { SeverEffect } from './sever-effect.js'
import { ParadoxEffect } from './paradox-effect.js'
import { LaunchEffect } from './launch-effect.js'
import { LightningEffect } from './lightning-effect.js'

const SHAKE_DEATH = 5
const SHAKE_SEVER = 4
const SHAKE_PARADOX = 5
const SHAKE_LAUNCH = 4
const SHAKE_GHOST_EXPIRE = 3

export class VfxController {
  readonly shake: ScreenShake
  private readonly deathParticles: DeathParticles
  private readonly rewind: RewindEffect
  private readonly sever: SeverEffect
  private readonly paradox: ParadoxEffect
  private readonly launch: LaunchEffect
  private readonly lightning: LightningEffect
  private readonly context: MatchContext
  private readonly sound: SoundManager | null

  private screenEventCallback: ((event: ScreenEvent) => void) | null = null
  private processedTick = -1
  private pendingTimer: ReturnType<typeof setTimeout> | null = null

  constructor(layers: LayerManager, context: MatchContext, sound: SoundManager | null = null) {
    this.context = context
    this.sound = sound
    this.shake = new ScreenShake()
    this.deathParticles = new DeathParticles(layers.effectLayer)
    this.rewind = new RewindEffect(layers.overlayLayer)
    this.sever = new SeverEffect(layers.effectLayer)
    this.paradox = new ParadoxEffect(layers.root)
    this.launch = new LaunchEffect(layers.effectLayer)
    this.lightning = new LightningEffect(layers.effectLayer)
  }

  onScreenEvent(cb: (event: ScreenEvent) => void) {
    this.screenEventCallback = cb
  }

  processEvents(frame: RenderFrame, screenWidth: number, screenHeight: number) {
    if (frame.tick <= this.processedTick) return
    this.processedTick = frame.tick

    for (const event of frame.events) {
      if (event.tick !== frame.tick - 1) continue
      const pos = event.pos ?? findEventPosition(frame, event.playerId)
      this.dispatchEvent(event, pos, screenWidth, screenHeight)
    }
  }

  private dispatchEvent(
    event: GameEvent,
    pos: { x: number; y: number },
    screenWidth: number,
    screenHeight: number,
  ) {
    const isLocal = event.playerId === this.context.localPlayerId

    this.sound?.processGameEvent(event, isLocal)

    switch (event.type) {
      case 'death':
        this.deathParticles.spawn(pos.x, pos.y)
        this.shake.trigger(SHAKE_DEATH)
        if (isLocal) {
          this.emitScreenEvent({ kind: 'death' })
        }
        break

      case 'rewind':
        this.shake.trigger(SHAKE_SEVER)
        if (isLocal) {
          this.rewind.start(screenWidth, screenHeight)
          this.emitScreenEvent({ kind: 'rewind' })
        }
        break

      case 'timelineSevered':
        this.lightning.strike(pos.x, pos.y)
        this.sever.flash(pos.x, pos.y, event.ticksDelta != null ? Math.abs(event.ticksDelta) : undefined)
        this.shake.trigger(SHAKE_SEVER)
        if (isLocal) {
          this.emitScreenEvent({
            kind: 'sever',
            ...(event.ticksDelta != null ? { ticksDelta: event.ticksDelta } : {}),
            ...(event.attackerId
              ? { killerName: this.context.playerNames[event.attackerId] ?? event.attackerId }
              : {}),
          })
        }
        break

      case 'paradox':
        this.paradox.start()
        this.shake.trigger(SHAKE_PARADOX)
        this.pendingTimer = setTimeout(() => {
          this.shake.trigger(3)
          this.pendingTimer = null
        }, 200)
        if (isLocal) {
          this.emitScreenEvent({
            kind: 'paradox',
            ...(event.ticksDelta != null ? { ticksDelta: event.ticksDelta } : {}),
            victimName: this.context.playerNames[event.playerId] ?? event.playerId,
          })
        }
        break

      case 'ghostExpire':
        this.lightning.strike(pos.x, pos.y)
        this.shake.trigger(SHAKE_GHOST_EXPIRE)
        break

      case 'futureLaunch':
        this.launch.start(pos.x, pos.y)
        this.shake.trigger(SHAKE_LAUNCH)
        if (isLocal) {
          this.emitScreenEvent({ kind: 'launch' })
        }
        break

      case 'win':
        this.emitScreenEvent({ kind: 'win', winnerId: event.playerId })
        break
    }
  }

  private emitScreenEvent(event: ScreenEvent) {
    this.screenEventCallback?.(event)
  }

  update() {
    this.shake.update()
    this.deathParticles.update()
    this.rewind.update()
    this.sever.update()
    this.paradox.update()
    this.launch.update()
    this.lightning.update()
  }

  clear() {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer)
      this.pendingTimer = null
    }
    this.shake.reset()
    this.deathParticles.clear()
    this.rewind.reset()
    this.sever.clear()
    this.paradox.reset()
    this.launch.reset()
    this.lightning.clear()
    this.processedTick = -1
  }
}

function findEventPosition(frame: RenderFrame, playerId: PlayerId): { x: number; y: number } {
  const player = frame.players.find((p) => p.id === playerId)
  if (player) return { x: player.pos.x, y: player.pos.y }
  return { x: 0, y: 0 }
}
