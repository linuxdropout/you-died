import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('server smoke test', () => {
  it('creates a colyseus server', () => {
    const { server, port } = createApp(8083)

    expect(server).toBeDefined()
    expect(port).toBe(8083)
  })
})
