import { Client, Room } from 'colyseus.js'
import type { ServerMessage, ClientMessage } from '@you-died/protocol'

const DEFAULT_WS_URL = (import.meta as unknown as { env: Record<string, string | undefined> }).env['VITE_WS_URL'] ?? 'ws://localhost:8083'

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
