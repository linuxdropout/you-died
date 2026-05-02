import { useState } from 'react'
import type { Room } from 'colyseus.js'
import type { LobbyPlayer } from '@you-died/protocol'
import { sendMessage } from '../net/connection'

interface Props {
  room: Room
  players: LobbyPlayer[]
  countdownSeconds: number | null
}

export function LobbyScreen({ room, players, countdownSeconds }: Props) {
  const [name, setName] = useState('')

  const allReady = players.length > 0 && players.every((p) => p.ready)
  const counting = countdownSeconds !== null

  const handleSetName = () => {
    if (name.trim()) {
      sendMessage(room, { type: 'setName', name: name.trim() })
    }
  }

  const handleReady = () => {
    sendMessage(room, { type: 'ready' })
  }

  const handleStart = () => {
    sendMessage(room, { type: 'startCountdown' })
  }

  const handleCancel = () => {
    sendMessage(room, { type: 'cancelCountdown' })
  }

  return (
    <main>
      <h1>Lobby</h1>
      <div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSetName() }}
          placeholder="Your name"
        />
        <button onClick={handleSetName}>Set Name</button>
      </div>
      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.name} {p.ready ? '(Ready)' : ''}
          </li>
        ))}
      </ul>
      <button onClick={handleReady} disabled={counting}>Ready</button>
      {counting
        ? <button onClick={handleCancel}>Cancel ({countdownSeconds})</button>
        : <button onClick={handleStart} disabled={!allReady}>Start</button>
      }
    </main>
  )
}
