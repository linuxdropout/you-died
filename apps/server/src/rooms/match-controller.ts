import type { LobbyPlayer, PlayerId, PlayerInput } from '@you-died/protocol'
import { TICK_RATE, MATCH_TIME_LIMIT_SECONDS, MAX_PLAYERS, BOT_ID_PREFIX } from '@you-died/protocol'
import { generateBotInput } from './bot-ai.js'
import {
  createInitialState,
  step,
  getTimeoutWinner,
  hashState,
  selectArena,
  type GameState,
} from '@you-died/sim'

type Phase = 'lobby' | 'match' | 'ended'

interface PlayerEntry {
  name: string
  ready: boolean
  color: string
  isBot: boolean
}

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'white', 'brown', 'lime', 'teal']

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
  private hostId: PlayerId | null = null
  private simState: GameState | null = null
  private currentTick = 0
  private seed = 0
  private latestInputs = new Map<PlayerId, PlayerInput>()
  private hashBuffer = new Map<number, number>()
  private _countdownSeconds: number | null = null
  private inputLog: Record<PlayerId, PlayerInput>[] = []
  private nextBotIndex = 0

  addPlayer(id: PlayerId, name: string): boolean {
    if (this.phase !== 'lobby') return false
    if (this.players.size >= MAX_PLAYERS) return false
    const usedColors = new Set([...this.players.values()].map((p) => p.color))
    const color = COLORS.find((c) => !usedColors.has(c)) ?? COLORS[0] ?? 'red'
    this.players.set(id, { name, ready: false, color, isBot: false })
    this.hostId ??= id
    return true
  }

  addBot(): PlayerId | null {
    if (this.phase !== 'lobby') return null
    if (this.players.size >= MAX_PLAYERS) return null
    const id: PlayerId = `${BOT_ID_PREFIX}${this.nextBotIndex++}`
    const usedColors = new Set([...this.players.values()].map((p) => p.color))
    const color = COLORS.find((c) => !usedColors.has(c)) ?? COLORS[0] ?? 'red'
    this.players.set(id, { name: `Bot ${this.nextBotIndex}`, ready: true, color, isBot: true })
    return id
  }

  removeBot(id: PlayerId): void {
    const entry = this.players.get(id)
    if (!entry?.isBot) return
    this.players.delete(id)
    if (this.phase === 'lobby') {
      this._countdownSeconds = null
    }
  }

  removePlayer(id: PlayerId): void {
    this.players.delete(id)
    if (this.hostId === id) {
      this.hostId = null
      for (const [candidateId, entry] of this.players) {
        if (!entry.isBot) {
          this.hostId = candidateId
          break
        }
      }
    }
    if (this.phase === 'lobby') {
      this._countdownSeconds = null
    }
    if (this.phase === 'match') {
      const hasHumans = [...this.players.values()].some((p) => !p.isBot)
      if (!hasHumans) {
        this.phase = 'ended'
      }
    }
  }

  getHostId(): PlayerId | null {
    return this.hostId
  }

  setName(id: PlayerId, name: string): void {
    const player = this.players.get(id)
    if (player) player.name = name
  }

  setReady(id: PlayerId): void {
    if (this.phase !== 'lobby') return
    const player = this.players.get(id)
    if (!player || player.isBot) return
    player.ready = !player.ready
    if (!player.ready) this._countdownSeconds = null
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
    this.hashBuffer.clear()
    this.inputLog = []
    const playerIds = [...this.players.keys()]
    const arena = selectArena(seed, playerIds.length)
    this.simState = createInitialState({ seed, playerIds, arena })
    return playerIds
  }

  submitInput(playerId: PlayerId, _tick: number, input: PlayerInput): void {
    if (this.phase !== 'match') return
    this.latestInputs.set(playerId, input)
  }

  tick(): { tick: number; inputs: Record<PlayerId, PlayerInput> } | null {
    if (this.phase !== 'match' || !this.simState) return null

    this.updateBotInputs()

    const inputs: Record<PlayerId, PlayerInput> = {}

    for (const id of this.players.keys()) {
      inputs[id] = this.latestInputs.get(id) ?? NO_OP_INPUT
    }
    this.inputLog.push(inputs)
    this.simState = step(this.simState, inputs)

    this.hashBuffer.set(this.simState.tick, hashState(this.simState))
    const HASH_BUFFER_SIZE = 120
    const oldest = this.simState.tick - HASH_BUFFER_SIZE
    if (oldest >= 0) this.hashBuffer.delete(oldest)

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
      result.push({ id, name: entry.name, ready: entry.ready, color: entry.color, isBot: entry.isBot })
    }
    return result
  }

  getPlayerIds(): PlayerId[] {
    return [...this.players.keys()]
  }

  getSeed(): number {
    return this.seed
  }

  getPlayerMeta(): {
    playerNames: Record<PlayerId, string>
    playerColors: Record<PlayerId, string>
  } {
    const playerNames: Record<PlayerId, string> = {}
    const playerColors: Record<PlayerId, string> = {}
    for (const [id, entry] of this.players) {
      playerNames[id] = entry.name
      playerColors[id] = entry.color
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

  getReplayData(): {
    seed: number
    playerIds: PlayerId[]
    inputLog: Record<PlayerId, PlayerInput>[]
  } | null {
    if (this.phase !== 'ended') return null
    return {
      seed: this.seed,
      playerIds: [...this.players.keys()],
      inputLog: this.inputLog,
    }
  }

  getHashForTick(tick: number): number | undefined {
    return this.hashBuffer.get(tick)
  }

  getSimState(): GameState | null {
    return this.simState
  }

  resetToLobby(): void {
    this.phase = 'lobby'
    this.simState = null
    this.currentTick = 0
    this.latestInputs.clear()
    this.hashBuffer.clear()
    this.inputLog = []
    this._countdownSeconds = null
    for (const player of this.players.values()) {
      player.ready = player.isBot
    }
  }

  private updateBotInputs(): void {
    if (!this.simState) return
    for (const [id, entry] of this.players) {
      if (!entry.isBot) continue
      this.latestInputs.set(id, generateBotInput(this.simState, id, this.currentTick, this.seed))
    }
  }
}
