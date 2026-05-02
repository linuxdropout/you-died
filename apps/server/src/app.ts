import { Server } from 'colyseus'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { createServer } from 'http'

export function createApp(port: number) {
  const server = new Server({
    transport: new WebSocketTransport({
      server: createServer(),
    }),
  })

  return { server, port }
}
