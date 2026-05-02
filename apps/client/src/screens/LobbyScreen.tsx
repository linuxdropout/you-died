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
    <div className="lobbyScreen">
      <div className="lobbyScreenPanel">
        <div className="lobbyScreenHeader">
          <h1 className="lobbyScreenTitle">LOBBY</h1>
        </div>

        <div className="lobbyScreenNameRow">
          <input
            className="lobbyScreenInput"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSetName() }}
            placeholder="Your name"
            maxLength={12}
          />
          <button
            type="button"
            className="lobbyScreenBtn lobbyScreenBtnName"
            onClick={handleSetName}
          >
            SET
          </button>
        </div>

        <div className="lobbyScreenSlots">
          {players.map((p) => (
            <div
              key={p.id}
              className={`lobbyScreenSlot${p.ready ? ' lobbyScreenSlotReady' : ''}`}
            >
              <span className="lobbyScreenSlotName">{p.name}</span>
              <span className="lobbyScreenSlotStatus">
                {p.ready ? 'READY' : '...'}
              </span>
            </div>
          ))}
        </div>

        <div className="lobbyScreenActions">
          <button
            type="button"
            className="lobbyScreenBtn lobbyScreenBtnReady"
            onClick={handleReady}
            disabled={counting}
          >
            READY
          </button>
          {counting ? (
            <button
              type="button"
              className="lobbyScreenBtn lobbyScreenBtnCancel"
              onClick={handleCancel}
            >
              CANCEL ({countdownSeconds})
            </button>
          ) : (
            <button
              type="button"
              className="lobbyScreenBtn lobbyScreenBtnStart"
              onClick={handleStart}
              disabled={!allReady}
            >
              START
            </button>
          )}
        </div>

        {counting && (
          <div className="lobbyScreenCountdown">
            STARTING IN {countdownSeconds}...
          </div>
        )}
      </div>
    </div>
  )
}
