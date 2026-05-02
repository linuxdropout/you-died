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

const SHAKE_DEATH = 10
const SHAKE_SEVER = 8
const SHAKE_PARADOX = 10
const SHAKE_LAUNCH = 8

export class VfxController {
  readonly shake: ScreenShake
  private readonly deathParticles: DeathParticles
  private readonly rewind: RewindEffect
  private readonly sever: SeverEffect
  private readonly paradox: ParadoxEffect
  private readonly launch: LaunchEffect
  private readonly context: MatchContext
  private readonly sound: SoundManager | null

  private screenEventCallback: ((event: ScreenEvent) => void) | null = null
  private processedTick = -1

  constructor(layers: LayerManager, context: MatchContext, sound: SoundManager | null = null) {
    this.context = context
    this.sound = sound
    this.shake = new ScreenShake()
    this.deathParticles = new DeathParticles(layers.effectLayer)
    this.rewind = new RewindEffect(layers.overlayLayer)
    this.sever = new SeverEffect(layers.effectLayer)
    this.paradox = new ParadoxEffect(layers.root)
    this.launch = new LaunchEffect(layers.effectLayer)
  }

  onScreenEvent(cb: (event: ScreenEvent) => void) {
    this.screenEventCallback = cb
  }

  processEvents(frame: RenderFrame, screenWidth: number, screenHeight: number) {
    if (frame.tick <= this.processedTick) return
    this.processedTick = frame.tick

    for (const event of frame.events) {
      if (event.tick !== frame.tick) continue
      const pos = findEventPosition(frame, event.playerId)
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
        this.sever.flash(pos.x, pos.y)
        this.shake.trigger(SHAKE_SEVER)
        if (isLocal) {
          this.emitScreenEvent({ kind: 'sever' })
        }
        break

      case 'paradox':
        this.paradox.start()
        this.shake.trigger(SHAKE_PARADOX)
        setTimeout(() => this.shake.trigger(6), 200)
        if (isLocal) {
          this.emitScreenEvent({ kind: 'paradox' })
        }
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
  }

  clear() {
    this.shake.reset()
    this.deathParticles.clear()
    this.rewind.reset()
    this.sever.clear()
    this.paradox.reset()
    this.launch.reset()
    this.processedTick = -1
  }
}

function findEventPosition(frame: RenderFrame, playerId: PlayerId): { x: number; y: number } {
  const player = frame.players.find((p) => p.id === playerId)
  if (player) return { x: player.pos.x, y: player.pos.y }
  return { x: 0, y: 0 }
}
