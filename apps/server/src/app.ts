import { WebSocketTransport } from '@colyseus/ws-transport'
import Colyseus from 'colyseus'
import { createServer } from 'http'
import { GameRoom } from './rooms/game-room.js'

export function createApp(port: number) {
  const server = new Colyseus.Server({
    transport: new WebSocketTransport({
      server: createServer(),
    }),
  })

  server.define('game', GameRoom)

  return { server, port }
}
