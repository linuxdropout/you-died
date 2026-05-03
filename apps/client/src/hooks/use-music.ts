import { useEffect, useRef } from 'react'
import { MusicEngine } from '@you-died/renderer'
import type { AudioContextGuard } from '@you-died/renderer'

type Track = 'lobby' | 'battle'

export function useMusic(guard: AudioContextGuard, track: Track | null) {
  const engineRef = useRef<MusicEngine | null>(null)

  useEffect(() => {
    engineRef.current ??= new MusicEngine(guard)
    const engine = engineRef.current

    if (track) {
      engine.play(track)
    } else {
      engine.stop()
    }

    return () => {
      engine.stop()
    }
  }, [guard, track])

  useEffect(() => {
    return () => {
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [])
}
