import Colyseus from 'colyseus'
import type { Client } from 'colyseus'

const { Room } = Colyseus
import { TICK_RATE } from '@you-died/protocol'
import type { PlayerInput } from '@you-died/protocol'
import { MatchController } from './match-controller.js'

export class GameRoom extends Room {
  private controller = new MatchController()
  private countdownInterval: ReturnType<typeof setInterval> | null = null

  override onCreate() {
    this.maxClients = 4
    this.patchRate = 0

    this.onMessage('setName', (client: Client, msg: { name: string }) => {
      this.controller.setName(client.sessionId, msg.name)
      this.broadcastLobbyState()
    })

    this.onMessage('ready', (client: Client) => {
      this.controller.setReady(client.sessionId)
      this.broadcastLobbyState()
    })

    this.onMessage('startCountdown', () => {
      if (this.controller.startCountdown()) {
        this.broadcastLobbyState()
        this.runCountdown()
      }
    })

    this.onMessage('cancelCountdown', () => {
      this.stopCountdown()
      this.controller.cancelCountdown()
      this.broadcastLobbyState()
    })

    this.onMessage('input', (_client: Client, msg: { tick: number; input: PlayerInput }) => {
      this.controller.submitInput(_client.sessionId, msg.tick, msg.input)
    })
  }

  override onJoin(client: Client) {
    const added = this.controller.addPlayer(client.sessionId, `Player ${this.clients.length}`)
    if (!added) {
      this.send(client, 'error', { message: 'Cannot join' })
      client.leave()
      return
    }
    this.broadcastLobbyState()
  }

  override onLeave(client: Client) {
    const wasMidMatch = this.controller.getPhase() === 'match'
    this.controller.removePlayer(client.sessionId)

    if (wasMidMatch && this.controller.getPhase() === 'ended') {
      this.broadcast('matchEnd', { reason: 'timeout' as const })
      this.setSimulationInterval()
    } else if (wasMidMatch && this.controller.getPhase() === 'match') {
      this.broadcast('playerLeft', { playerId: client.sessionId })
    } else if (this.controller.getPhase() === 'lobby') {
      this.stopCountdown()
      this.broadcastLobbyState()
    }
  }

  private broadcastLobbyState() {
    this.broadcast('roomState', {
      players: this.controller.getLobbyState(),
      countdownSeconds: this.controller.countdownSeconds,
    })
  }

  private runCountdown() {
    this.stopCountdown()
    this.countdownInterval = setInterval(() => {
      const result = this.controller.tickCountdown()
      if (result === 'start') {
        this.stopCountdown()
        this.beginMatch()
      } else if (result === 'tick') {
        this.broadcastLobbyState()
      }
    }, 1000)
  }

  private stopCountdown() {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
  }

  private beginMatch() {
    const seed = Math.floor(Math.random() * 2 ** 32)
    const playerIds = this.controller.startMatch(seed)
    const { playerNames, playerColors } = this.controller.getPlayerMeta()

    for (const client of this.clients) {
      if (playerIds.includes(client.sessionId)) {
        this.send(client, 'startMatch', {
          seed,
          playerId: client.sessionId,
          playerIds,
          playerNames,
          playerColors,
        })
      }
    }

    void this.lock()

    this.setSimulationInterval(((_deltaTime) => {
      const result = this.controller.tick()
      if (!result) return

      this.broadcast('inputs', { tick: result.tick, inputs: result.inputs })

      const matchEnd = this.controller.isMatchOver()
      if (matchEnd) {
        this.broadcast('matchEnd', matchEnd)
        this.setSimulationInterval()
      }
    }), 1000 / TICK_RATE)
  }
}
