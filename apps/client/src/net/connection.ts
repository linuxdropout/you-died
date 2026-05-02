import { Client, Room } from 'colyseus.js'
import type { ServerMessage, ClientMessage } from '@you-died/protocol'
import { ROOM_CODE_LENGTH } from '@you-died/protocol'

function getDefaultWsUrl(): string {
  const envUrl = (import.meta as unknown as { env: Record<string, string | undefined> }).env[
    'VITE_WS_URL'
  ]
  if (envUrl) return envUrl
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/you-died/ws`
  }
  return 'ws://localhost:8083'
}

const DEFAULT_WS_URL = getDefaultWsUrl()

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)] ?? ''
  }
  return code
}

export function createClient(url = DEFAULT_WS_URL): Client {
  return new Client(url)
}

export async function createRoom(client: Client, roomCode: string): Promise<Room> {
  return client.create('game', { roomCode })
}

export async function joinRoom(client: Client, roomCode: string): Promise<Room> {
  return client.join('game', { roomCode })
}

export function sendMessage(room: Room, message: ClientMessage): void {
  const { type, ...payload } = message
  room.send(type, payload)
}

export function onServerMessage(room: Room, handler: (message: ServerMessage) => void): void {
  const messageTypes = [
    'roomState',
    'startMatch',
    'inputs',
    'matchEnd',
    'error',
    'playerLeft',
  ] as const
  for (const msgType of messageTypes) {
    room.onMessage(msgType, (payload: Record<string, unknown>) => {
      handler({ type: msgType, ...payload } as ServerMessage)
    })
  }
}
