import { useState, useCallback, useMemo } from 'react'
import type { Room } from 'colyseus.js'
import type { PlayerId, LobbyPlayer } from '@you-died/protocol'
import { AudioContextGuard } from '@you-died/renderer'
import { ConnectScreen } from './screens/ConnectScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { MatchScreen } from './screens/MatchScreen'
import { EndScreen } from './screens/EndScreen'
import {
  createClient,
  createRoom,
  joinRoom,
  generateRoomCode,
  onServerMessage,
  sendMessage,
} from './net/connection'

type Phase =
  | { type: 'title'; error: string | null }
  | {
      type: 'lobby'
      room: Room
      players: LobbyPlayer[]
      countdownSeconds: number | null
      roomCode: string
      hostId: PlayerId | null
    }
  | {
      type: 'match'
      room: Room
      roomCode: string
      playerId: PlayerId
      seed: number
      playerIds: PlayerId[]
      playerNames: Record<PlayerId, string>
      playerColors: Record<PlayerId, string>
    }
  | {
      type: 'end'
      room: Room
      roomCode: string
      reason: string
      winnerId: PlayerId | undefined
      playerNames: Record<PlayerId, string>
    }

export default function App() {
  const [phase, setPhase] = useState<Phase>({ type: 'title', error: null })
  const audioGuard = useMemo(() => new AudioContextGuard(), [])

  const setupRoomListeners = useCallback((room: Room) => {
    onServerMessage(room, (msg) => {
      switch (msg.type) {
        case 'roomState':
          setPhase((prev) =>
            prev.type === 'lobby'
              ? {
                  ...prev,
                  players: msg.players,
                  countdownSeconds: msg.countdownSeconds,
                  roomCode: msg.roomCode,
                  hostId: msg.hostId,
                }
              : prev,
          )
          break
        case 'startMatch':
          setPhase((prev) =>
            prev.type === 'lobby'
              ? {
                  type: 'match',
                  room: prev.room,
                  roomCode: prev.roomCode,
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
          setPhase((prev) => {
            if (prev.type !== 'match') return prev
            return {
              type: 'end',
              room: prev.room,
              roomCode: prev.roomCode,
              reason: msg.reason,
              winnerId: msg.winnerId,
              playerNames: prev.playerNames,
            }
          })
          break
        case 'error':
          setPhase({ type: 'title', error: msg.message })
          break
      }
    })
  }, [])

  const handleCreateRoom = useCallback(async () => {
    try {
      const client = createClient()
      const code = generateRoomCode()
      const room = await createRoom(client, code)
      setupRoomListeners(room)
      setPhase({
        type: 'lobby',
        room,
        players: [],
        countdownSeconds: null,
        roomCode: code,
        hostId: null,
      })
    } catch {
      setPhase({ type: 'title', error: 'Failed to create room' })
    }
  }, [setupRoomListeners])

  const handleJoinRoom = useCallback(
    async (code: string) => {
      try {
        const client = createClient()
        const room = await joinRoom(client, code)
        setupRoomListeners(room)
        setPhase({
          type: 'lobby',
          room,
          players: [],
          countdownSeconds: null,
          roomCode: code,
          hostId: null,
        })
      } catch {
        setPhase({ type: 'title', error: 'Room not found' })
      }
    },
    [setupRoomListeners],
  )

  const handleReturnToTitle = useCallback((room: Room) => {
    void room.leave()
    setPhase({ type: 'title', error: null })
  }, [])

  const handlePlayAgain = useCallback((room: Room, roomCode: string) => {
    setPhase({ type: 'lobby', room, players: [], countdownSeconds: null, roomCode, hostId: null })
    sendMessage(room, { type: 'rejoinLobby' })
  }, [])

  switch (phase.type) {
    case 'title':
      return (
        <ConnectScreen
          onCreateRoom={() => void handleCreateRoom()}
          onJoinRoom={(code) => void handleJoinRoom(code)}
          error={phase.error}
          audioGuard={audioGuard}
        />
      )
    case 'lobby':
      return (
        <LobbyScreen
          room={phase.room}
          players={phase.players}
          countdownSeconds={phase.countdownSeconds}
          roomCode={phase.roomCode}
          hostId={phase.hostId}
          audioGuard={audioGuard}
          onLeave={() => handleReturnToTitle(phase.room)}
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
          audioGuard={audioGuard}
        />
      )
    case 'end':
      return (
        <EndScreen
          reason={phase.reason}
          winnerId={phase.winnerId}
          playerNames={phase.playerNames}
          onPlayAgain={() => handlePlayAgain(phase.room, phase.roomCode)}
          onLeave={() => handleReturnToTitle(phase.room)}
        />
      )
  }
}
