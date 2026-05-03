import { useState, useEffect, useRef } from 'react'
import type { Room } from 'colyseus.js'
import type { LobbyPlayer, PlayerId } from '@you-died/protocol'
import { MAX_PLAYERS } from '@you-died/protocol'
import type { AudioContextGuard } from '@you-died/renderer'
import { Lobby } from '@you-died/ui'
import { sendMessage } from '../net/connection'
import { useUiSounds } from '../hooks/use-ui-sounds'
import { useMusic } from '../hooks/use-music'

interface Props {
  room: Room
  players: LobbyPlayer[]
  countdownSeconds: number | null
  roomCode: string
  hostId: PlayerId | null
  audioGuard: AudioContextGuard
  onLeave: () => void
}

export function LobbyScreen({
  room,
  players,
  countdownSeconds,
  roomCode,
  hostId,
  audioGuard,
  onLeave,
}: Props) {
  const [name, setName] = useState('')
  const { playClick, playCountdownTick, playMatchStart } = useUiSounds(audioGuard)
  const prevCountdown = useRef<number | null>(null)
  useMusic(audioGuard, 'lobby')

  useEffect(() => {
    if (countdownSeconds !== null && countdownSeconds !== prevCountdown.current) {
      if (countdownSeconds <= 0) {
        playMatchStart()
      } else {
        playCountdownTick(countdownSeconds === 1)
      }
    }
    prevCountdown.current = countdownSeconds
  }, [countdownSeconds, playCountdownTick, playMatchStart])

  const localPlayerId = room.sessionId
  const localPlayer = players.find((p) => p.id === localPlayerId)
  const isReady = localPlayer?.ready ?? false

  const uiPlayers = players.map((p) => ({
    playerId: p.id,
    name: p.name,
    ready: p.ready,
    color: p.color,
    isBot: p.isBot,
  }))

  const handleSetName = () => {
    if (name.trim()) {
      playClick()
      sendMessage(room, { type: 'setName', name: name.trim() })
    }
  }

  return (
    <Lobby
      roomCode={roomCode}
      players={uiPlayers}
      localPlayerId={localPlayerId}
      isReady={isReady}
      maxPlayers={MAX_PLAYERS}
      {...(hostId != null ? { hostId } : {})}
      countdownSeconds={countdownSeconds}
      onReady={() => {
        playClick()
        sendMessage(room, { type: 'ready' })
      }}
      onLeave={() => {
        playClick()
        onLeave()
      }}
      onStart={() => {
        playClick()
        sendMessage(room, { type: 'startCountdown' })
      }}
      onCancel={() => {
        playClick()
        sendMessage(room, { type: 'cancelCountdown' })
      }}
      onAddBot={() => {
        playClick()
        sendMessage(room, { type: 'addBot' })
      }}
      onRemoveBot={(playerId) => {
        playClick()
        sendMessage(room, { type: 'removeBot', playerId })
      }}
    >
      <div className="lobbyNameRow">
        <input
          className="lobbyNameInput"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSetName()
          }}
          placeholder="Your name"
          maxLength={12}
        />
        <button type="button" className="lobbyBtn lobbyBtnName" onClick={handleSetName}>
          SET
        </button>
      </div>
    </Lobby>
  )
}
