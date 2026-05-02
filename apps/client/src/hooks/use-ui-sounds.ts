import { useCallback, useRef } from 'react'
import type { AudioContextGuard } from '@you-died/renderer'

export function useUiSounds(guard: AudioContextGuard) {
  const urgentInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const play = useCallback(
    (fn: (ctx: AudioContext, dest: AudioNode) => void) => {
      const ctx = guard.getContext()
      if (!guard.ready) return
      fn(ctx, ctx.destination)
    },
    [guard],
  )

  const playClick = useCallback(() => {
    play((ctx, dest) => {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = 800
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
      osc.connect(gain).connect(dest)
      osc.start(t)
      osc.stop(t + 0.03)
    })
  }, [play])

  const playCountdownTick = useCallback(
    (final: boolean) => {
      play((ctx, dest) => {
        const t = ctx.currentTime
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = final ? 660 : 440
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.2, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
        osc.connect(gain).connect(dest)
        osc.start(t)
        osc.stop(t + 0.1)
      })
    },
    [play],
  )

  const playMatchStart = useCallback(() => {
    play((ctx, dest) => {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 880
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.25, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.connect(gain).connect(dest)
      osc.start(t)
      osc.stop(t + 0.2)
    })
  }, [play])

  const startTimerUrgent = useCallback(() => {
    if (urgentInterval.current) return
    const tick = () => {
      play((ctx, dest) => {
        const t = ctx.currentTime
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = 660
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.12, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
        osc.connect(gain).connect(dest)
        osc.start(t)
        osc.stop(t + 0.08)
      })
    }
    tick()
    urgentInterval.current = setInterval(tick, 1000)
  }, [play])

  const stopTimerUrgent = useCallback(() => {
    if (urgentInterval.current) {
      clearInterval(urgentInterval.current)
      urgentInterval.current = null
    }
  }, [])

  return { playClick, playCountdownTick, playMatchStart, startTimerUrgent, stopTimerUrgent }
}
