import type { RenderFrame } from '@you-died/sim'
import type { SpriteManager } from '../sprite-manager.js'
import type { LayerManager } from '../layers/layer-manager.js'
import type { RendererConfig, MatchContext } from '../types.js'
import { EntityPool } from './entity-pool.js'
import { PlayerEntity } from './player-entity.js'
import { ProjectileEntity } from './projectile-entity.js'
import { SlashEntity } from './slash-entity.js'
import { GoreEntity } from './gore-entity.js'

const GORE_PER_DEATH = 14

export class EntityManager {
  private readonly sprites: SpriteManager
  private readonly layers: LayerManager
  private readonly context: MatchContext
  private readonly config: RendererConfig

  private readonly playerPool: EntityPool<PlayerEntity>
  private readonly projectilePool: EntityPool<ProjectileEntity>
  private readonly slashPool: EntityPool<SlashEntity>
  private readonly gorePool: EntityPool<GoreEntity>

  private readonly activePlayers = new Map<string, PlayerEntity>()
  private readonly activeProjectiles = new Map<number, ProjectileEntity>()
  private readonly activeSlashes = new Map<number, SlashEntity>()
  private readonly activeGore: GoreEntity[] = []
  private readonly knownGoreEvents = new Set<string>()

  constructor(
    sprites: SpriteManager,
    layers: LayerManager,
    context: MatchContext,
    config: RendererConfig,
  ) {
    this.sprites = sprites
    this.layers = layers
    this.context = context
    this.config = config

    this.playerPool = new EntityPool(
      () => new PlayerEntity(),
      (e) => e.reset(),
      24,
    )
    this.projectilePool = new EntityPool(
      () => new ProjectileEntity(),
      (e) => e.reset(),
      32,
    )
    this.slashPool = new EntityPool(
      () => new SlashEntity(),
      (e) => e.reset(),
      16,
    )
    this.gorePool = new EntityPool(
      () => new GoreEntity(),
      (e) => e.reset(),
      1000,
    )
  }

  update(frame: RenderFrame) {
    this.reconcilePlayers(frame)
    this.reconcileProjectiles(frame)
    this.reconcileSlashes(frame)
    this.processGoreEvents(frame)
    this.updateGore()
  }

  private reconcilePlayers(frame: RenderFrame) {
    const seen = new Set<string>()

    const localId = this.context.localPlayerId
    const localLiveTimelineId = frame.players.find(
      (p) => p.id === localId && !p.isGhost,
    )?.timelineId

    for (const player of frame.players) {
      const key = `${player.id}-${player.timelineId}`
      seen.add(key)

      let entity = this.activePlayers.get(key)
      if (!entity) {
        entity = this.playerPool.acquire()
        this.layers.playerLayer.addChild(entity.container)
        this.activePlayers.set(key, entity)
      }

      let visualGhost = player.isGhost
      if (!visualGhost && player.id === localId && player.timelineId !== localLiveTimelineId) {
        visualGhost = true
      }

      const color = this.context.playerColors[player.id] ?? 'red'
      entity.attach(this.sprites, color, visualGhost)
      const renderPlayer = player.id === localId
        ? { ...player, isParadoxTarget: false }
        : player
      entity.update(renderPlayer, frame.tick)
    }

    for (const [key, entity] of this.activePlayers) {
      if (!seen.has(key)) {
        this.layers.playerLayer.removeChild(entity.container)
        this.playerPool.release(entity)
        this.activePlayers.delete(key)
      }
    }
  }

  private reconcileProjectiles(frame: RenderFrame) {
    const seen = new Set<number>()

    for (const proj of frame.projectiles) {
      seen.add(proj.id)

      let entity = this.activeProjectiles.get(proj.id)
      if (!entity) {
        entity = this.projectilePool.acquire()
        entity.attach(this.sprites)
        this.layers.effectLayer.addChild(entity.container)
        this.activeProjectiles.set(proj.id, entity)
      }

      entity.update(proj)
    }

    for (const [id, entity] of this.activeProjectiles) {
      if (!seen.has(id)) {
        this.layers.effectLayer.removeChild(entity.container)
        this.projectilePool.release(entity)
        this.activeProjectiles.delete(id)
      }
    }
  }

  private reconcileSlashes(frame: RenderFrame) {
    const seen = new Set<number>()

    for (const slash of frame.slashes) {
      seen.add(slash.id)

      let entity = this.activeSlashes.get(slash.id)
      if (!entity) {
        entity = this.slashPool.acquire()
        entity.attach(this.sprites)
        this.layers.effectLayer.addChild(entity.container)
        this.activeSlashes.set(slash.id, entity)
      }

      entity.update(slash)
    }

    for (const [id, entity] of this.activeSlashes) {
      if (!seen.has(id)) {
        this.layers.effectLayer.removeChild(entity.container)
        this.slashPool.release(entity)
        this.activeSlashes.delete(id)
      }
    }
  }

  private processGoreEvents(frame: RenderFrame) {
    for (const event of frame.events) {
      if (event.type !== 'death' && event.type !== 'ghostExpire' && event.type !== 'timelineSevered') continue

      const eventKey = `${event.type}-${event.tick}-${event.playerId}`
      if (this.knownGoreEvents.has(eventKey)) continue
      this.knownGoreEvents.add(eventKey)

      const player = frame.players.find((p) => p.id === event.playerId)
      const x = event.pos?.x ?? player?.pos.x ?? 0
      const y = event.pos?.y ?? player?.pos.y ?? 0
      const playerColor = this.context.playerColors[event.playerId] ?? 'red'

      for (let i = 0; i < GORE_PER_DEATH; i++) {
        const gore = this.gorePool.acquire()
        const seed = event.tick * 1000 + i
        const angle = (Math.PI * 2 * i) / GORE_PER_DEATH + Math.sin(seed * 0.73) * 0.5
        const speed = 2 + (Math.sin(seed * 1.23) * 0.5 + 0.5) * 2.5
        const vx = Math.cos(angle) * speed
        const vy = Math.sin(angle) * speed - 3
        gore.init(
          x + Math.sin(seed * 2.71) * 20,
          y + Math.sin(seed * 1.41) * 10,
          event.tick,
          seed,
          vx,
          vy,
          i,
          playerColor,
          this.context.arena.platforms,
          this.context.arena.killBoundary,
        )
        this.layers.goreLayer.addChild(gore.container)
        this.activeGore.push(gore)
      }
    }

    while (this.activeGore.length > this.config.maxGoreSprites) {
      const oldest = this.activeGore.shift()
      if (oldest) {
        this.layers.goreLayer.removeChild(oldest.container)
        this.gorePool.release(oldest)
      }
    }
  }

  private updateGore() {
    for (let i = this.activeGore.length - 1; i >= 0; i--) {
      const gore = this.activeGore[i]
      if (!gore) continue
      gore.update()
      if (gore.markedForCull) {
        this.layers.goreLayer.removeChild(gore.container)
        this.gorePool.release(gore)
        this.activeGore.splice(i, 1)
      }
    }
  }

  clear() {
    for (const [, entity] of this.activePlayers) {
      this.layers.playerLayer.removeChild(entity.container)
      this.playerPool.release(entity)
    }
    this.activePlayers.clear()

    for (const [, entity] of this.activeProjectiles) {
      this.layers.effectLayer.removeChild(entity.container)
      this.projectilePool.release(entity)
    }
    this.activeProjectiles.clear()

    for (const [, entity] of this.activeSlashes) {
      this.layers.effectLayer.removeChild(entity.container)
      this.slashPool.release(entity)
    }
    this.activeSlashes.clear()

    for (const gore of this.activeGore) {
      this.layers.goreLayer.removeChild(gore.container)
      this.gorePool.release(gore)
    }
    this.activeGore.length = 0
    this.knownGoreEvents.clear()
  }
}
