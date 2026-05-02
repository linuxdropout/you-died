import type { LobbyPlayer, PlayerId, PlayerInput } from '@you-died/protocol'
import { TICK_RATE, MATCH_TIME_LIMIT_SECONDS, MAX_PLAYERS } from '@you-died/protocol'
import { createInitialState, step, getTimeoutWinner, type GameState } from '@you-died/sim'

type Phase = 'lobby' | 'match' | 'ended'

interface PlayerEntry {
  name: string
  ready: boolean
}

const NO_OP_INPUT: PlayerInput = {
  left: false,
  right: false,
  jump: false,
  dash: false,
  slash: false,
  shoot: false,
}

export class MatchController {
  private phase: Phase = 'lobby'
  private players = new Map<PlayerId, PlayerEntry>()
  private simState: GameState | null = null
  private currentTick = 0
  private seed = 0
  private latestInputs = new Map<PlayerId, PlayerInput>()
  private _countdownSeconds: number | null = null
  private inputLog: Record<PlayerId, PlayerInput>[] = []

  addPlayer(id: PlayerId, name: string): boolean {
    if (this.phase !== 'lobby') return false
    if (this.players.size >= MAX_PLAYERS) return false
    this.players.set(id, { name, ready: false })
    return true
  }

  removePlayer(id: PlayerId): void {
    this.players.delete(id)
    if (this.phase === 'lobby') {
      this._countdownSeconds = null
    }
    if (this.phase === 'match' && this.players.size === 0) {
      this.phase = 'ended'
    }
  }

  setName(id: PlayerId, name: string): void {
    const player = this.players.get(id)
    if (player) player.name = name
  }

  setReady(id: PlayerId): void {
    if (this.phase !== 'lobby') return
    const player = this.players.get(id)
    if (player) {
      player.ready = !player.ready
      if (!player.ready) this._countdownSeconds = null
    }
  }

  canStart(): boolean {
    if (this.phase !== 'lobby') return false
    if (this.players.size === 0) return false
    for (const player of this.players.values()) {
      if (!player.ready) return false
    }
    return true
  }

  startCountdown(): boolean {
    if (!this.canStart()) return false
    if (this._countdownSeconds !== null) return false
    this._countdownSeconds = 3
    return true
  }

  cancelCountdown(): void {
    this._countdownSeconds = null
  }

  tickCountdown(): 'start' | 'tick' | null {
    if (this._countdownSeconds === null) return null
    this._countdownSeconds--
    if (this._countdownSeconds <= 0) {
      this._countdownSeconds = null
      return 'start'
    }
    return 'tick'
  }

  get countdownSeconds(): number | null {
    return this._countdownSeconds
  }

  startMatch(seed: number): PlayerId[] {
    this.phase = 'match'
    this.seed = seed
    this.currentTick = 0
    this.latestInputs.clear()
    this.inputLog = []
    this.simState = createInitialState({
      seed,
      playerIds: [...this.players.keys()],
    })
    return [...this.players.keys()]
  }

  submitInput(playerId: PlayerId, _tick: number, input: PlayerInput): void {
    if (this.phase !== 'match') return
    this.latestInputs.set(playerId, input)
  }

  tick(): { tick: number; inputs: Record<PlayerId, PlayerInput> } | null {
    if (this.phase !== 'match' || !this.simState) return null

    const inputs: Record<PlayerId, PlayerInput> = {}

    for (const id of this.players.keys()) {
      inputs[id] = this.latestInputs.get(id) ?? NO_OP_INPUT
    }
    this.inputLog.push(inputs)
    this.simState = step(this.simState, inputs)

    const result = { tick: this.currentTick, inputs }
    this.currentTick++
    return result
  }

  getPhase(): Phase {
    return this.phase
  }

  getLobbyState(): LobbyPlayer[] {
    const result: LobbyPlayer[] = []
    for (const [id, entry] of this.players) {
      result.push({ id, name: entry.name, ready: entry.ready })
    }
    return result
  }

  getPlayerIds(): PlayerId[] {
    return [...this.players.keys()]
  }

  getSeed(): number {
    return this.seed
  }

  getPlayerMeta(): { playerNames: Record<PlayerId, string>; playerColors: Record<PlayerId, string> } {
    const COLORS = ['red', 'blue', 'green', 'yellow']
    const playerNames: Record<PlayerId, string> = {}
    const playerColors: Record<PlayerId, string> = {}
    let i = 0
    for (const [id, entry] of this.players) {
      playerNames[id] = entry.name
      playerColors[id] = COLORS[i % COLORS.length]!
      i++
    }
    return { playerNames, playerColors }
  }

  isMatchOver(): { reason: 'timeout' | 'win'; winnerId?: PlayerId | undefined } | null {
    if (this.phase !== 'match' || !this.simState) return null
    if (this.simState.winner !== undefined) {
      this.phase = 'ended'
      return { reason: 'win', winnerId: this.simState.winner }
    }
    if (this.currentTick >= MATCH_TIME_LIMIT_SECONDS * TICK_RATE) {
      this.phase = 'ended'
      return { reason: 'timeout', winnerId: getTimeoutWinner(this.simState) }
    }
    return null
  }

  getReplayData(): { seed: number; playerIds: PlayerId[]; inputLog: Record<PlayerId, PlayerInput>[] } | null {
    if (this.phase !== 'ended') return null
    return {
      seed: this.seed,
      playerIds: [...this.players.keys()],
      inputLog: this.inputLog,
    }
  }

  getSimState(): GameState | null {
    return this.simState
  }
}
