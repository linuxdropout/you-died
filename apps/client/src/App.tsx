import { useState, useCallback } from 'react'
import type { Room } from 'colyseus.js'
import type { PlayerId, LobbyPlayer } from '@you-died/protocol'
import { ConnectScreen } from './screens/ConnectScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { MatchScreen } from './screens/MatchScreen'
import { EndScreen } from './screens/EndScreen'
import { createClient, joinOrCreate, onServerMessage } from './net/connection'

type Phase =
  | { type: 'connecting'; error: string | null }
  | { type: 'lobby'; room: Room; players: LobbyPlayer[]; countdownSeconds: number | null }
  | { type: 'match'; room: Room; playerId: PlayerId; seed: number; playerIds: PlayerId[]; playerNames: Record<PlayerId, string>; playerColors: Record<PlayerId, string> }
  | { type: 'end'; reason: string; winnerId: PlayerId | undefined }

export default function App() {
  const [phase, setPhase] = useState<Phase>({ type: 'connecting', error: null })

  const connect = useCallback(async () => {
    try {
      const client = createClient()
      const room = await joinOrCreate(client, 'game')
      setPhase({ type: 'lobby', room, players: [], countdownSeconds: null })

      onServerMessage(room, (msg) => {
        switch (msg.type) {
          case 'roomState':
            setPhase((prev) =>
              prev.type === 'lobby'
                ? { ...prev, players: msg.players, countdownSeconds: msg.countdownSeconds }
                : prev,
            )
            break
          case 'startMatch':
            setPhase((prev) =>
              prev.type === 'lobby'
                ? {
                    type: 'match',
                    room: prev.room,
                    playerId: msg.playerId,
                    seed: msg.seed,
                    playerIds: msg.playerIds,
                    playerNames: msg.playerNames,
                    playerColors: msg.playerColors,
                  }
                : prev,
            )
            break
          case 'matchEnd':
            setPhase({ type: 'end', reason: msg.reason, winnerId: msg.winnerId })
            break
        }
      })
    } catch {
      setPhase({ type: 'connecting', error: 'Failed to connect' })
    }
  }, [])

  switch (phase.type) {
    case 'connecting':
      return <ConnectScreen onConnect={() => void connect()} error={phase.error} />
    case 'lobby':
      return (
        <LobbyScreen
          room={phase.room}
          players={phase.players}
          countdownSeconds={phase.countdownSeconds}
        />
      )
    case 'match':
      return (
        <MatchScreen
          room={phase.room}
          playerId={phase.playerId}
          seed={phase.seed}
          playerIds={phase.playerIds}
          playerNames={phase.playerNames}
          playerColors={phase.playerColors}
        />
      )
    case 'end':
      return <EndScreen reason={phase.reason} winnerId={phase.winnerId} />
  }
}
