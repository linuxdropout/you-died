import type { GameEvent, RenderFrame } from '@you-died/sim'
import type { PlayerId } from '@you-died/protocol'
import type { AudioContextGuard } from './audio-context-guard.js'
import {
  createNoiseBuffer,
  playSlashSwing,
  playShoot,
  playJump,
  playLand,
  playDash,
  playDeath,
  playRewind,
  playSever,
  playParadox,
  playLaunch,
  playWinLocal,
  playWinRemote,
} from './synth.js'

const MAX_CONCURRENT = 12

const COOLDOWNS: Record<string, number> = {
  slash: 30,
  shoot: 50,
  jump: 40,
  land: 30,
  dash: 50,
  death: 100,
  rewind: 200,
  sever: 80,
  paradox: 200,
  launch: 150,
  win: 500,
}

const REMOTE_VOLUME = 0.3

interface PlayerSnapshot {
  grounded: boolean
  isDashing: boolean
}

export class SoundManager {
  private readonly guard: AudioContextGuard
  private readonly localPlayerId: PlayerId
  private masterGain: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null

  private prevProjectileIds = new Set<number>()
  private prevSlashIds = new Set<number>()
  private prevPlayerStates = new Map<string, PlayerSnapshot>()
  private activeCount = 0
  private lastPlayTime = new Map<string, number>()

  constructor(guard: AudioContextGuard, localPlayerId: PlayerId) {
    this.guard = guard
    this.localPlayerId = localPlayerId
  }

  private ensureNodes(): { ctx: AudioContext; dest: AudioNode; noise: AudioBuffer } | null {
    const ctx = this.guard.getContext()
    if (!this.guard.ready) return null
    if (!this.masterGain) {
      this.masterGain = ctx.createGain()
      this.masterGain.gain.value = 0.7
      this.masterGain.connect(ctx.destination)
    }
    this.noiseBuffer ??= createNoiseBuffer(ctx)
    return { ctx, dest: this.masterGain, noise: this.noiseBuffer }
  }

  private canPlay(soundType: string): boolean {
    if (this.activeCount >= MAX_CONCURRENT) return false
    const cooldown = COOLDOWNS[soundType] ?? 0
    const last = this.lastPlayTime.get(soundType) ?? 0
    const now = performance.now()
    if (now - last < cooldown) return false
    this.lastPlayTime.set(soundType, now)
    return true
  }

  private trackActive(durationMs: number): void {
    this.activeCount++
    setTimeout(() => { this.activeCount-- }, durationMs)
  }

  processGameEvent(event: GameEvent, isLocal: boolean): void {
    const audio = this.ensureNodes()
    if (!audio) return
    const { ctx, dest, noise } = audio
    const vol = isLocal ? 1 : REMOTE_VOLUME

    switch (event.type) {
      case 'death':
        if (!this.canPlay('death')) return
        playDeath(ctx, dest, noise, vol)
        this.trackActive(400)
        break
      case 'rewind':
        if (!isLocal) return
        if (!this.canPlay('rewind')) return
        playRewind(ctx, dest, vol)
        this.trackActive(550)
        this.clearTrackingState()
        break
      case 'timelineSevered':
        if (!this.canPlay('sever')) return
        playSever(ctx, dest, noise, vol)
        this.trackActive(200)
        break
      case 'paradox':
        if (!this.canPlay('paradox')) return
        playParadox(ctx, dest, noise, vol)
        this.trackActive(450)
        break
      case 'futureLaunch':
        if (!this.canPlay('launch')) return
        playLaunch(ctx, dest, vol)
        this.trackActive(400)
        break
      case 'win':
        if (!this.canPlay('win')) return
        if (isLocal) {
          playWinLocal(ctx, dest, vol)
        } else {
          playWinRemote(ctx, dest, vol)
        }
        this.trackActive(500)
        break
    }
  }

  processFrame(frame: RenderFrame): void {
    const audio = this.ensureNodes()
    if (!audio) return
    const { ctx, dest, noise } = audio

    this.detectNewProjectiles(ctx, dest, frame)
    this.detectNewSlashes(ctx, dest, noise, frame)
    this.detectPlayerTransitions(ctx, dest, noise, frame)
  }

  private detectNewProjectiles(ctx: AudioContext, dest: AudioNode, frame: RenderFrame): void {
    const currentIds = new Set<number>()
    for (const proj of frame.projectiles) {
      currentIds.add(proj.id)
      if (proj.isGhost) continue
      if (!this.prevProjectileIds.has(proj.id)) {
        if (this.canPlay('shoot')) {
          playShoot(ctx, dest, REMOTE_VOLUME)
          this.trackActive(150)
        }
      }
    }
    this.prevProjectileIds = currentIds
  }

  private detectNewSlashes(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, frame: RenderFrame): void {
    const currentIds = new Set<number>()
    for (const slash of frame.slashes) {
      currentIds.add(slash.id)
      if (slash.isGhost) continue
      if (!this.prevSlashIds.has(slash.id)) {
        if (this.canPlay('slash')) {
          playSlashSwing(ctx, dest, noise, REMOTE_VOLUME)
          this.trackActive(100)
        }
      }
    }
    this.prevSlashIds = currentIds
  }

  private detectPlayerTransitions(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, frame: RenderFrame): void {
    const currentStates = new Map<string, PlayerSnapshot>()

    for (const player of frame.players) {
      if (player.isGhost) continue
      const key = `${player.id}-${player.timelineId}`
      currentStates.set(key, { grounded: player.grounded, isDashing: player.isDashing })

      const prev = this.prevPlayerStates.get(key)
      if (!prev) continue

      const isLocal = player.id === this.localPlayerId
      const vol = isLocal ? 1 : REMOTE_VOLUME

      if (prev.grounded && !player.grounded) {
        if (this.canPlay('jump')) {
          playJump(ctx, dest, vol)
          this.trackActive(120)
        }
      }

      if (!prev.grounded && player.grounded) {
        if (this.canPlay('land')) {
          playLand(ctx, dest, noise, vol)
          this.trackActive(60)
        }
      }

      if (!prev.isDashing && player.isDashing) {
        if (this.canPlay('dash')) {
          playDash(ctx, dest, noise, vol)
          this.trackActive(100)
        }
      }
    }

    this.prevPlayerStates = currentStates
  }

  private clearTrackingState(): void {
    this.prevProjectileIds.clear()
    this.prevSlashIds.clear()
    this.prevPlayerStates.clear()
  }

  setMasterVolume(v: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v))
    }
  }

  clear(): void {
    this.clearTrackingState()
    this.activeCount = 0
    this.lastPlayTime.clear()
    if (this.masterGain) {
      this.masterGain.disconnect()
      this.masterGain = null
    }
    this.noiseBuffer = null
  }
}
