import { useState, useRef, useEffect } from 'react'
import type { Room } from 'colyseus.js'
import type { PlayerId, PlayerInput } from '@you-died/protocol'
import type { HudData, ScreenEvent } from '@you-died/renderer'
import {
  GameHud,
  DeathSplash,
  RewindFlash,
  ParadoxAlert,
  SeverNotice,
  WinScreen,
} from '@you-died/ui'
import { createGameLoop } from '../game/game-loop'
import type { GameLoop } from '../game/game-loop'

interface Props {
  room: Room
  playerId: PlayerId
  seed: number
  playerIds: PlayerId[]
  playerNames: Record<PlayerId, string>
  playerColors: Record<PlayerId, string>
}

export function MatchScreen({ room, playerId, seed, playerIds, playerNames, playerColors }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const [hudData, setHudData] = useState<HudData | null>(null)
  const [screenEvent, setScreenEvent] = useState<ScreenEvent | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let clearTimer: ReturnType<typeof setTimeout> | null = null

    const loop = createGameLoop({
      seed,
      playerId,
      playerIds,
      playerNames,
      playerColors,
      room,
      canvas,
      onHudUpdate: setHudData,
      onScreenEvent: (event) => {
        setScreenEvent(event)
        if (clearTimer) clearTimeout(clearTimer)
        if (event.kind !== 'win') {
          clearTimer = setTimeout(() => setScreenEvent(null), 2000)
        }
      },
    })
    gameLoopRef.current = loop
    void loop.start()

    const handler = (msg: { tick: number; inputs: Record<string, PlayerInput> }) => {
      loop.pushConfirmedInputs(msg.tick, msg.inputs)
    }
    const unsub = room.onMessage('inputs', handler)

    return () => {
      unsub()
      if (clearTimer) clearTimeout(clearTimer)
      loop.destroy()
      gameLoopRef.current = null
    }
  }, [room, playerId, seed, playerIds, playerNames, playerColors])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
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
            <RewindFlash
              visible={screenEvent?.kind === 'rewind'}
              secondsBack={10}
            />
            <ParadoxAlert
              visible={screenEvent?.kind === 'paradox'}
            />
            <SeverNotice
              visible={screenEvent?.kind === 'sever'}
            />
            <WinScreen
              visible={screenEvent?.kind === 'win'}
              winnerName={screenEvent?.winnerId ? (playerNames[screenEvent.winnerId] ?? screenEvent.winnerId) : ''}
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
