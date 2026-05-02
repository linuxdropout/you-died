import type { RenderFrame, GameEvent } from '@you-died/sim'
import type { PlayerId } from '@you-died/protocol'
import { TICK_RATE, WIN_LEAD_SECONDS, MATCH_TIME_LIMIT_SECONDS } from '@you-died/protocol'
import type { MatchContext, HudData, HudTimelinePlayer, HudPlayerStatus, HudKillEvent } from './types.js'

export class HudBridge {
  private readonly context: MatchContext
  private readonly kills = new Map<PlayerId, number>()
  private readonly deaths = new Map<PlayerId, number>()
  private readonly timelineCounts = new Map<PlayerId, number>()
  private readonly killEvents: HudKillEvent[] = []
  private nextEventId = 0
  private processedTick = -1

  constructor(context: MatchContext) {
    this.context = context
  }

  processFrame(frame: RenderFrame): HudData {
    this.accumulateEvents(frame)

    const players: HudTimelinePlayer[] = []
    const seen = new Set<PlayerId>()

    for (const p of frame.players) {
      if (seen.has(p.id)) continue
      seen.add(p.id)

      players.push({
        playerId: p.id,
        name: this.context.playerNames[p.id] ?? p.id,
        offsetSeconds: frame.tick / TICK_RATE,
        isGhost: p.isGhost,
        isDead: !p.alive,
        color: this.context.playerColors[p.id] ?? 'red',
      })
    }

    const playerStatuses: HudPlayerStatus[] = []
    for (const [id, name] of Object.entries(this.context.playerNames)) {
      playerStatuses.push({
        playerId: id,
        name,
        kills: this.kills.get(id) ?? 0,
        deaths: this.deaths.get(id) ?? 0,
        timelineCount: this.timelineCounts.get(id) ?? 1,
        isGhost: players.find((p) => p.playerId === id)?.isGhost ?? false,
        isDead: players.find((p) => p.playerId === id)?.isDead ?? false,
        color: this.context.playerColors[id] ?? 'red',
      })
    }

    return {
      players,
      playerStatuses,
      killEvents: this.killEvents,
      elapsedSeconds: frame.tick / TICK_RATE,
      matchLimitSeconds: MATCH_TIME_LIMIT_SECONDS,
      winThreshold: WIN_LEAD_SECONDS,
    }
  }

  private accumulateEvents(frame: RenderFrame) {
    for (const event of frame.events) {
      if (event.tick <= this.processedTick) continue
      this.processEvent(event)
    }
    this.processedTick = frame.tick
  }

  private processEvent(event: GameEvent) {
    const name = this.context.playerNames[event.playerId] ?? event.playerId

    switch (event.type) {
      case 'death':
        this.deaths.set(event.playerId, (this.deaths.get(event.playerId) ?? 0) + 1)
        this.pushKillEvent({
          id: String(this.nextEventId++),
          kind: 'kill',
          tick: event.tick,
          victim: name,
        })
        break

      case 'rewind':
        this.timelineCounts.set(event.playerId, (this.timelineCounts.get(event.playerId) ?? 1) + 1)
        this.pushKillEvent({
          id: String(this.nextEventId++),
          kind: 'rewind',
          tick: event.tick,
          victim: name,
        })
        break

      case 'timelineSevered':
        this.pushKillEvent({
          id: String(this.nextEventId++),
          kind: 'sever',
          tick: event.tick,
          victim: name,
        })
        break

      case 'paradox':
        this.pushKillEvent({
          id: String(this.nextEventId++),
          kind: 'paradox',
          tick: event.tick,
        })
        break

      case 'futureLaunch':
        this.pushKillEvent({
          id: String(this.nextEventId++),
          kind: 'launch',
          tick: event.tick,
          victim: name,
        })
        break

      case 'win':
        this.pushKillEvent({
          id: String(this.nextEventId++),
          kind: 'win',
          tick: event.tick,
          killer: name,
        })
        break
    }
  }

  private pushKillEvent(event: HudKillEvent) {
    this.killEvents.push(event)
  }

  reset() {
    this.kills.clear()
    this.deaths.clear()
    this.timelineCounts.clear()
    this.killEvents.length = 0
    this.nextEventId = 0
    this.processedTick = -1
  }
}
