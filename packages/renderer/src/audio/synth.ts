export function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function noiseSource(ctx: AudioContext, noise: AudioBuffer, duration: number): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.start(ctx.currentTime)
  src.stop(ctx.currentTime + duration)
  return src
}

function scheduleCleanup(_ctx: AudioContext, nodes: AudioNode[], duration: number): void {
  const t = duration * 1000 + 100
  setTimeout(() => {
    for (const n of nodes) {
      try { n.disconnect() } catch { /* already disconnected */ }
    }
  }, t)
}

// --- Player action sounds ---

export function playSlashSwing(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, volume: number): void {
  const t = ctx.currentTime
  const src = noiseSource(ctx, noise, 0.08)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2000
  bp.Q.value = 1
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.4 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  src.connect(bp).connect(gain).connect(dest)
  scheduleCleanup(ctx, [src, bp, gain], 0.1)
}

export function playShoot(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(800, t)
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.1)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.3 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.12)
  scheduleCleanup(ctx, [osc, gain], 0.15)
}

export function playJump(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(300, t)
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.08)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.15 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.1)
  scheduleCleanup(ctx, [osc, gain], 0.12)
}

export function playLand(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, volume: number): void {
  const t = ctx.currentTime
  const src = noiseSource(ctx, noise, 0.03)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 500
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.1 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
  src.connect(lp).connect(gain).connect(dest)
  scheduleCleanup(ctx, [src, lp, gain], 0.06)
}

export function playDash(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 150
  const src = noiseSource(ctx, noise, 0.06)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.3 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(gain)
  src.connect(gain)
  gain.connect(dest)
  osc.start(t)
  osc.stop(t + 0.08)
  scheduleCleanup(ctx, [osc, src, gain], 0.1)
}

// --- Game event sounds ---

export function playDeath(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, volume: number): void {
  const t = ctx.currentTime
  const src = noiseSource(ctx, noise, 0.3)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(2000, t)
  lp.frequency.exponentialRampToValueAtTime(100, t + 0.3)
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, t)
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.3)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.4 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
  src.connect(lp).connect(gain)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(t)
  osc.stop(t + 0.35)
  scheduleCleanup(ctx, [src, lp, osc, gain], 0.4)
}

export function playRewind(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(440, t)
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.25)
  osc.frequency.exponentialRampToValueAtTime(440, t + 0.5)
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 20
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.3
  lfo.connect(lfoGain)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.3 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
  lfoGain.connect(gain.gain)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.5)
  lfo.start(t)
  lfo.stop(t + 0.5)
  scheduleCleanup(ctx, [osc, lfo, lfoGain, gain], 0.55)
}

export function playSever(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, volume: number): void {
  const t = ctx.currentTime
  const osc1 = ctx.createOscillator()
  osc1.type = 'square'
  osc1.frequency.value = 300
  const osc2 = ctx.createOscillator()
  osc2.type = 'square'
  osc2.frequency.value = 307
  const src = noiseSource(ctx, noise, 0.08)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.3 * volume, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.25 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  osc1.connect(gain)
  osc2.connect(gain)
  src.connect(noiseGain)
  gain.connect(dest)
  noiseGain.connect(dest)
  osc1.start(t)
  osc1.stop(t + 0.15)
  osc2.start(t)
  osc2.stop(t + 0.15)
  scheduleCleanup(ctx, [osc1, osc2, src, noiseGain, gain], 0.2)
}

export function playParadox(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'square'
  osc.frequency.value = 100
  const stutter = ctx.createOscillator()
  stutter.type = 'square'
  stutter.frequency.value = 30
  const stutterGain = ctx.createGain()
  stutterGain.gain.value = 0.5
  stutter.connect(stutterGain)
  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(0.35 * volume, t)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
  stutterGain.connect(oscGain.gain)
  osc.connect(oscGain)
  const src = noiseSource(ctx, noise, 0.35)
  const noiseLp = ctx.createBiquadFilter()
  noiseLp.type = 'lowpass'
  noiseLp.frequency.setValueAtTime(1500, t)
  noiseLp.frequency.exponentialRampToValueAtTime(200, t + 0.35)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.25 * volume, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
  src.connect(noiseLp).connect(noiseGain)
  oscGain.connect(dest)
  noiseGain.connect(dest)
  osc.start(t)
  osc.stop(t + 0.4)
  stutter.start(t)
  stutter.stop(t + 0.4)
  scheduleCleanup(ctx, [osc, stutter, stutterGain, oscGain, src, noiseLp, noiseGain], 0.45)
}

export function playLaunch(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(200, t)
  osc.frequency.exponentialRampToValueAtTime(2000, t + 0.3)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.1 * volume, t)
  gain.gain.linearRampToValueAtTime(0.4 * volume, t + 0.2)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.35)
  scheduleCleanup(ctx, [osc, gain], 0.4)
}

export function playWinLocal(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const notes = [523, 659, 784]
  const nodes: AudioNode[] = []
  for (const [i, freq] of notes.entries()) {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, t + i * 0.12)
    gain.gain.linearRampToValueAtTime(0.25 * volume, t + i * 0.12 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.15)
    osc.connect(gain).connect(dest)
    osc.start(t + i * 0.12)
    osc.stop(t + i * 0.12 + 0.15)
    nodes.push(osc, gain)
  }
  scheduleCleanup(ctx, nodes, 0.5)
}

export function playWinRemote(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const notes = [330, 262]
  const nodes: AudioNode[] = []
  for (const [i, freq] of notes.entries()) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, t + i * 0.18)
    gain.gain.linearRampToValueAtTime(0.2 * volume, t + i * 0.18 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.2)
    osc.connect(gain).connect(dest)
    osc.start(t + i * 0.18)
    osc.stop(t + i * 0.18 + 0.2)
    nodes.push(osc, gain)
  }
  scheduleCleanup(ctx, nodes, 0.5)
}

// --- UI sounds ---

export function playClick(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'square'
  osc.frequency.value = 800
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.2 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.03)
  scheduleCleanup(ctx, [osc, gain], 0.05)
}

export function playCountdownTick(ctx: AudioContext, dest: AudioNode, volume: number, final: boolean): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = final ? 660 : 440
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.25 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.1)
  scheduleCleanup(ctx, [osc, gain], 0.12)
}

export function playMatchStart(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 880
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.3 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.2)
  scheduleCleanup(ctx, [osc, gain], 0.25)
}

export function playTimerUrgent(ctx: AudioContext, dest: AudioNode, volume: number): void {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 660
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.15 * volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.08)
  scheduleCleanup(ctx, [osc, gain], 0.1)
}
