import { Client, Room } from 'colyseus.js'
import type { ServerMessage, ClientMessage } from '@you-died/protocol'

function getDefaultWsUrl(): string {
  const envUrl = (import.meta as unknown as { env: Record<string, string | undefined> }).env['VITE_WS_URL']
  if (envUrl) return envUrl
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/you-died/ws`
  }
  return 'ws://localhost:8083'
}

const DEFAULT_WS_URL = getDefaultWsUrl()

export function createClient(url = DEFAULT_WS_URL): Client {
  return new Client(url)
}

export async function joinOrCreate(client: Client, roomName: string): Promise<Room> {
  return client.joinOrCreate(roomName)
}

export function sendMessage(room: Room, message: ClientMessage): void {
  const { type, ...payload } = message
  room.send(type, payload)
}

export function onServerMessage(room: Room, handler: (message: ServerMessage) => void): void {
  const messageTypes = ['roomState', 'startMatch', 'inputs', 'matchEnd', 'error'] as const
  for (const msgType of messageTypes) {
    room.onMessage(msgType, (payload: Record<string, unknown>) => {
      handler({ type: msgType, ...payload } as ServerMessage)
    })
  }
}
