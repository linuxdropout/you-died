import type { PlayerId } from '@you-died/protocol'
import type { PlayerColor } from '@you-died/assets'

export interface MatchContext {
  readonly localPlayerId: PlayerId
  readonly playerColors: Record<PlayerId, PlayerColor>
  readonly playerNames: Record<PlayerId, string>
}

export interface RendererConfig {
  readonly pixelScale: number
  readonly cameraSmoothing: number
  readonly maxGoreSprites: number
}

export const DEFAULT_RENDERER_CONFIG: RendererConfig = {
  pixelScale: 3,
  cameraSmoothing: 0.1,
  maxGoreSprites: 100,
}

export interface HudData {
  readonly players: readonly HudTimelinePlayer[]
  readonly playerStatuses: readonly HudPlayerStatus[]
  readonly killEvents: readonly HudKillEvent[]
  readonly elapsedSeconds: number
  readonly matchLimitSeconds: number
  readonly winThreshold: number
}

export interface HudTimelinePlayer {
  readonly playerId: string
  readonly name: string
  readonly offsetSeconds: number
  readonly isGhost: boolean
  readonly isDead: boolean
  readonly color: string
}

export interface HudPlayerStatus {
  readonly playerId: string
  readonly name: string
  readonly kills: number
  readonly deaths: number
  readonly timelineCount: number
  readonly isGhost: boolean
  readonly isDead: boolean
  readonly color: string
}

export interface HudKillEvent {
  readonly id: string
  readonly kind: 'kill' | 'rewind' | 'sever' | 'paradox' | 'launch' | 'win'
  readonly tick: number
  readonly killer?: string
  readonly victim?: string
  readonly weapon?: 'slash' | 'shoot'
  readonly message?: string
}

export interface ScreenEvent {
  readonly kind: 'death' | 'rewind' | 'sever' | 'paradox' | 'launch' | 'win'
  readonly killerName?: string
  readonly weapon?: 'slash' | 'shoot'
  readonly winnerId?: string
}
