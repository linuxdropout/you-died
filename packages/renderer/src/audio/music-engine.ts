import type { AudioContextGuard } from './audio-context-guard.js'

type Track = 'lobby' | 'battle'

const BPM = 140
const STEP_TIME = 60 / BPM / 4

const NOTE = (semitone: number) => 440 * Math.pow(2, (semitone - 69) / 12)

const Fs2 = NOTE(42)
const G2 = NOTE(43)
const A2 = NOTE(45)
const B2 = NOTE(47)
const D3 = NOTE(50)
const E3 = NOTE(52)
const Fs3 = NOTE(54)
const G3 = NOTE(55)
const A3 = NOTE(57)
const B3 = NOTE(59)
const D4 = NOTE(62)
const E4 = NOTE(64)
const Fs4 = NOTE(66)
const G4 = NOTE(67)
const A4 = NOTE(69)
const B4 = NOTE(71)
const D5 = NOTE(74)
const E5 = NOTE(76)
const Fs5 = NOTE(78)
const G5 = NOTE(79)
const A5 = NOTE(81)
const B5 = NOTE(83)

// --- LOBBY: 8 distinct sections (128 steps = ~14 seconds each cycle) ---

const LOBBY_SECTIONS: { lead: (number | null)[]; bass: (number | null)[]; kick: number[]; hihat: number[]; snare: number[] }[] = [
  // Section A: Gentle arp rising
  {
    lead: [
      B3, null, D4, null, Fs4, null, B4, null,
      A3, null, D4, null, Fs4, null, A4, null,
      G3, null, B3, null, D4, null, G4, null,
      Fs3, null, A3, null, D4, null, Fs4, null,
    ],
    bass: [
      B2, null, null, null, null, null, B2, null,
      A2, null, null, null, null, null, A2, null,
      G2, null, null, null, null, null, G2, null,
      Fs2, null, null, null, null, null, Fs2, null,
    ],
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // Section B: Pulsing lead with more rhythm
  {
    lead: [
      B4, null, B4, null, A4, null, Fs4, null,
      E4, null, E4, null, Fs4, null, null, null,
      D4, null, D4, null, E4, null, Fs4, null,
      A4, null, B4, null, null, null, null, null,
    ],
    bass: [
      B2, null, B2, null, null, null, B2, null,
      E3, null, E3, null, null, null, E3, null,
      D3, null, D3, null, null, null, D3, null,
      A2, null, null, null, B2, null, null, null,
    ],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // Section C: Breakdown - sparse with echoing melody
  {
    lead: [
      Fs4, null, null, null, null, null, null, null,
      E4, null, null, null, null, null, null, null,
      D4, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
    ],
    bass: [
      B2, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      G2, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
    ],
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // Section D: Build-up - rising energy, snare rolls
  {
    lead: [
      B3, B3, D4, D4, E4, E4, Fs4, Fs4,
      G4, G4, A4, A4, B4, B4, D5, D5,
      E5, null, E5, null, D5, null, B4, null,
      Fs5, null, E5, null, D5, null, B4, null,
    ],
    bass: [
      B2, null, B2, null, B2, null, B2, null,
      E3, null, E3, null, E3, null, E3, null,
      G2, null, G2, null, G2, null, G2, null,
      A2, null, A2, null, B2, null, B2, null,
    ],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1],
  },
]

// Lobby cycles through sections in order: A, B, A, C, B, D, A, B (never gets stale)
const LOBBY_ORDER = [0, 1, 0, 2, 1, 3, 0, 1]

// --- BATTLE: 6 intense sections with drops and builds ---

const BATTLE_SECTIONS: { lead: (number | null)[]; bass: (number | null)[]; kick: number[]; hihat: number[]; snare: number[] }[] = [
  // Section A: The iconic rapid-fire riff
  {
    lead: [
      B4, B4, B4, B4, B4, B4, B4, null,
      D5, D5, D5, D5, E5, E5, Fs5, null,
      B4, B4, B4, B4, B4, B4, B4, null,
      E5, null, D5, null, B4, null, A4, null,
    ],
    bass: [
      B2, null, B2, null, B2, null, B2, null,
      E3, null, E3, null, E3, null, E3, null,
      B2, null, B2, null, B2, null, B2, null,
      E3, null, B2, null, E3, null, B2, null,
    ],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // Section B: Higher variation - melodic answer phrase
  {
    lead: [
      Fs5, null, E5, null, D5, null, B4, null,
      A4, null, B4, null, D5, null, E5, null,
      Fs5, Fs5, Fs5, null, E5, E5, E5, null,
      D5, null, B4, null, A4, null, null, null,
    ],
    bass: [
      Fs3, null, Fs3, null, null, null, Fs3, null,
      D3, null, D3, null, null, null, D3, null,
      A2, null, A2, null, null, null, A2, null,
      B2, null, null, null, B2, null, B2, null,
    ],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  },
  // Section C: Drop - bass and kick only, maximum tension
  {
    lead: [
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      B4, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
    ],
    bass: [
      B2, B2, B2, B2, null, null, B2, B2,
      B2, B2, null, null, E3, E3, E3, E3,
      B2, B2, B2, B2, null, null, B2, B2,
      E3, null, Fs3, null, G3, null, A3, null,
    ],
    kick: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // Section D: Build-up with rising pitch fill
  {
    lead: [
      B4, null, B4, null, D5, null, D5, null,
      E5, null, E5, null, Fs5, null, Fs5, null,
      G5, null, G5, null, A5, null, A5, null,
      B5, B5, B5, B5, B5, B5, B5, B5,
    ],
    bass: [
      B2, null, B2, null, B2, null, B2, null,
      B2, null, B2, null, B2, null, B2, null,
      E3, null, E3, null, E3, null, E3, null,
      E3, null, E3, null, E3, null, E3, null,
    ],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1],
  },
  // Section E: Syncopated variation - offbeat stabs
  {
    lead: [
      null, B4, null, B4, null, null, D5, null,
      null, E5, null, E5, null, null, Fs5, null,
      null, D5, null, D5, null, null, B4, null,
      null, A4, null, B4, null, null, null, null,
    ],
    bass: [
      B2, null, null, B2, null, null, B2, null,
      E3, null, null, E3, null, null, E3, null,
      G2, null, null, G2, null, null, G2, null,
      A2, null, null, null, B2, null, null, null,
    ],
    kick: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // Section F: Double-time madness
  {
    lead: [
      B4, D5, B4, D5, E5, D5, E5, Fs5,
      B4, D5, B4, D5, E5, Fs5, E5, D5,
      Fs5, E5, D5, B4, A4, B4, D5, E5,
      Fs5, null, null, null, E5, null, null, null,
    ],
    bass: [
      B2, null, B2, null, B2, null, B2, null,
      E3, null, E3, null, E3, null, E3, null,
      Fs3, null, Fs3, null, G3, null, G3, null,
      A3, null, null, null, B2, null, null, null,
    ],
    kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  },
]

// Battle arrangement: verse, variation, drop, build, verse again, syncopated, build, double-time
const BATTLE_ORDER = [0, 1, 2, 3, 0, 4, 3, 5]

const SECTION_LENGTH = 32
const SCHEDULE_AHEAD = 0.15

export class MusicEngine {
  private readonly guard: AudioContextGuard
  private masterGain: GainNode | null = null
  private currentTrack: Track | null = null
  private schedulerTimer: ReturnType<typeof setInterval> | null = null
  private stepIndex = 0
  private nextStepTime = 0
  private noiseBuffer: AudioBuffer | null = null
  private volume = 0.12

  constructor(guard: AudioContextGuard) {
    this.guard = guard
  }

  play(track: Track): void {
    if (this.currentTrack === track) return
    this.stop()
    this.currentTrack = track
    this.stepIndex = 0

    const ctx = this.guard.getContext()
    if (!this.guard.ready) return

    if (!this.masterGain) {
      this.masterGain = ctx.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(ctx.destination)
    }

    this.noiseBuffer ??= this.createNoise(ctx)
    this.nextStepTime = ctx.currentTime + 0.05
    this.schedulerTimer = setInterval(() => this.schedule(), 25)
  }

  stop(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer)
      this.schedulerTimer = null
    }
    this.currentTrack = null
    this.stepIndex = 0
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }
  }

  destroy(): void {
    this.stop()
    if (this.masterGain) {
      this.masterGain.disconnect()
      this.masterGain = null
    }
    this.noiseBuffer = null
  }

  private schedule(): void {
    const ctx = this.guard.getContext()
    if (!this.guard.ready || !this.masterGain || !this.noiseBuffer) return

    while (this.nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
      this.playStep(ctx, this.masterGain, this.noiseBuffer, this.nextStepTime)
      this.nextStepTime += STEP_TIME
      this.stepIndex++
    }
  }

  private playStep(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, time: number): void {
    const sections = this.currentTrack === 'lobby' ? LOBBY_SECTIONS : BATTLE_SECTIONS
    const order = this.currentTrack === 'lobby' ? LOBBY_ORDER : BATTLE_ORDER

    const totalSteps = order.length * SECTION_LENGTH
    const posInCycle = this.stepIndex % totalSteps
    const sectionOrderIdx = Math.floor(posInCycle / SECTION_LENGTH)
    const sectionIdx = order[sectionOrderIdx] ?? 0
    const section = sections[sectionIdx]
    if (!section) return
    const stepInSection = posInCycle % SECTION_LENGTH

    const leadNote = section.lead[stepInSection]
    if (leadNote) {
      const vol = this.currentTrack === 'lobby' ? 0.2 : 0.28
      this.playSquareTone(ctx, dest, leadNote, time, STEP_TIME * 0.75, vol)
    }

    const bassNote = section.bass[stepInSection]
    if (bassNote) {
      const vol = this.currentTrack === 'lobby' ? 0.3 : 0.38
      this.playBassTone(ctx, dest, bassNote, time, STEP_TIME * 1.4, vol)
    }

    if (section.kick[stepInSection]) {
      this.playKick(ctx, dest, time, this.currentTrack === 'lobby' ? 0.35 : 0.45)
    }

    if (section.snare[stepInSection]) {
      this.playSnare(ctx, dest, noise, time, this.currentTrack === 'lobby' ? 0.2 : 0.28)
    }

    if (section.hihat[stepInSection]) {
      this.playHihat(ctx, dest, noise, time, this.currentTrack === 'lobby' ? 0.06 : 0.09)
    }
  }

  private playSquareTone(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    time: number,
    duration: number,
    vol: number,
  ): void {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(freq, time)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, time)
    gain.gain.setValueAtTime(vol * 0.7, time + duration * 0.6)
    gain.gain.linearRampToValueAtTime(0, time + duration)
    osc.connect(gain).connect(dest)
    osc.start(time)
    osc.stop(time + duration + 0.01)
  }

  private playBassTone(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    time: number,
    duration: number,
    vol: number,
  ): void {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, time)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 450
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(lp).connect(gain).connect(dest)
    osc.start(time)
    osc.stop(time + duration + 0.01)
  }

  private playKick(ctx: AudioContext, dest: AudioNode, time: number, vol: number): void {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.08)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
    osc.connect(gain).connect(dest)
    osc.start(time)
    osc.stop(time + 0.11)
  }

  private playSnare(
    ctx: AudioContext,
    dest: AudioNode,
    noise: AudioBuffer,
    time: number,
    vol: number,
  ): void {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3000
    bp.Q.value = 1
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07)
    src.connect(bp).connect(gain).connect(dest)
    src.start(time)
    src.stop(time + 0.08)

    const body = ctx.createOscillator()
    body.type = 'triangle'
    body.frequency.setValueAtTime(200, time)
    body.frequency.exponentialRampToValueAtTime(80, time + 0.04)
    const bodyGain = ctx.createGain()
    bodyGain.gain.setValueAtTime(vol * 0.5, time)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    body.connect(bodyGain).connect(dest)
    body.start(time)
    body.stop(time + 0.06)
  }

  private playHihat(
    ctx: AudioContext,
    dest: AudioNode,
    noise: AudioBuffer,
    time: number,
    vol: number,
  ): void {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7000
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03)
    src.connect(hp).connect(gain).connect(dest)
    src.start(time)
    src.stop(time + 0.04)
  }

  private createNoise(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }
}
