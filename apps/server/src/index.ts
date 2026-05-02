import { env } from './config/env.js'
import { createApp } from './app.js'

const start = async (): Promise<void> => {
  const { server, port } = createApp(env.PORT)

  await server.listen(port)
  console.log(`game server listening on port ${port}`)
}

void start()
