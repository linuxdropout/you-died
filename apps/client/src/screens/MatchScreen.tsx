import { useState, useRef, useEffect } from 'react'
import type { Room } from 'colyseus.js'
import type { PlayerId, PlayerInput } from '@you-died/protocol'
import type { HudData, ScreenEvent, AudioContextGuard } from '@you-died/renderer'
import { SEVER_EFFECT_SECONDS } from '@you-died/protocol'
import {
  GameHud,
  DeathSplash,
  RewindFlash,
  ParadoxAlert,
  SeverNotice,
  WinScreen,
  ControlHints,
} from '@you-died/ui'
import { createGameLoop } from '../game/game-loop'
import type { GameLoop } from '../game/game-loop'
import { useUiSounds } from '../hooks/use-ui-sounds'
import { useControlHints } from '../hooks/use-control-hints'
import { useMusic } from '../hooks/use-music'

interface Props {
  room: Room
  playerId: PlayerId
  seed: number
  playerIds: PlayerId[]
  playerNames: Record<PlayerId, string>
  playerColors: Record<PlayerId, string>
  audioGuard: AudioContextGuard
}

export function MatchScreen({
  room,
  playerId,
  seed,
  playerIds,
  playerNames,
  playerColors,
  audioGuard,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const [hudData, setHudData] = useState<HudData | null>(null)
  const [screenEvent, setScreenEvent] = useState<ScreenEvent | null>(null)
  const { startTimerUrgent, stopTimerUrgent } = useUiSounds(audioGuard)
  const { hints, onFirstUse, allDismissed } = useControlHints()
  const urgentStarted = useRef(false)
  useMusic(audioGuard, 'battle')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    container.appendChild(canvas)

    let clearTimer: ReturnType<typeof setTimeout> | null = null

    const loop = createGameLoop({
      seed,
      playerId,
      playerIds,
      playerNames,
      playerColors,
      room,
      canvas,
      audioGuard,
      onFirstUse,
      onHudUpdate: setHudData,
      onScreenEvent: (event) => {
        setScreenEvent(event)
        if (clearTimer) clearTimeout(clearTimer)
        if (event.kind !== 'win') {
          const ms = event.kind === 'sever' ? SEVER_EFFECT_SECONDS * 1000 : 2000
          clearTimer = setTimeout(() => setScreenEvent(null), ms)
        }
      },
    })
    gameLoopRef.current = loop
    void loop.start()

    const handler = (msg: { tick: number; inputs: Record<string, PlayerInput> }) => {
      loop.pushConfirmedInputs(msg.tick, msg.inputs)
    }
    const unsub = room.onMessage('inputs', handler) as () => void

    return () => {
      unsub()
      if (clearTimer) clearTimeout(clearTimer)
      loop.destroy()
      gameLoopRef.current = null
      canvas.remove()
      stopTimerUrgent()
    }
  }, [
    room,
    playerId,
    seed,
    playerIds,
    playerNames,
    playerColors,
    audioGuard,
    stopTimerUrgent,
    onFirstUse,
  ])

  useEffect(() => {
    if (!hudData) return
    const remaining = Math.max(0, hudData.matchLimitSeconds - hudData.elapsedSeconds)
    const isUrgent = remaining <= 30 && remaining > 0
    if (isUrgent && !urgentStarted.current) {
      urgentStarted.current = true
      startTimerUrgent()
    } else if (!isUrgent && urgentStarted.current) {
      urgentStarted.current = false
      stopTimerUrgent()
    }
  }, [hudData, startTimerUrgent, stopTimerUrgent])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {!allDismissed && (
          <ControlHints
            showMove={hints.move}
            showJump={hints.jump}
            showDash={hints.dash}
            showShoot={hints.shoot}
            showSlash={hints.slash}
          />
        )}
        {hudData && (
          <GameHud
            players={hudData.players}
            playerStatuses={hudData.playerStatuses}
            killEvents={hudData.killEvents}
            localPlayerId={playerId}
            elapsedSeconds={hudData.elapsedSeconds}
            matchLimitSeconds={hudData.matchLimitSeconds}
            winThreshold={hudData.winThreshold}
          >
            <DeathSplash
              visible={screenEvent?.kind === 'death'}
              {...(screenEvent?.killerName != null ? { killerName: screenEvent.killerName } : {})}
              {...(screenEvent?.weapon != null ? { weapon: screenEvent.weapon } : {})}
            />
            <RewindFlash visible={screenEvent?.kind === 'rewind'} secondsBack={10} />
            <ParadoxAlert
              visible={screenEvent?.kind === 'paradox'}
              {...(screenEvent?.ticksDelta != null ? { ticksDelta: screenEvent.ticksDelta } : {})}
              {...(screenEvent?.victimName != null ? { victimName: screenEvent.victimName } : {})}
            />
            <SeverNotice
              visible={screenEvent?.kind === 'sever'}
              {...(screenEvent?.ticksDelta != null ? { ticksDelta: screenEvent.ticksDelta } : {})}
            />
            <WinScreen
              visible={screenEvent?.kind === 'win'}
              winnerName={
                screenEvent?.winnerId
                  ? (playerNames[screenEvent.winnerId] ?? screenEvent.winnerId)
                  : ''
              }
              isLocalWinner={screenEvent?.winnerId === playerId}
              kills={hudData.playerStatuses.find((p) => p.playerId === playerId)?.kills ?? 0}
              deaths={hudData.playerStatuses.find((p) => p.playerId === playerId)?.deaths ?? 0}
            />
          </GameHud>
        )}
      </div>
    </div>
  )
}
