import { WebSocketTransport } from '@colyseus/ws-transport'
import Colyseus from 'colyseus'
import { createServer } from 'http'
import { GameRoom } from './rooms/game-room.js'

export function createApp(port: number) {
  const httpServer = createServer((req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('ok\n')
      return
    }
    res.writeHead(404)
    res.end()
  })

  const server = new Colyseus.Server({
    transport: new WebSocketTransport({
      server: httpServer,
    }),
  })

  server.define('game', GameRoom)

  return { server, port }
}
