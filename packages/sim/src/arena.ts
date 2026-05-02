import type { Vec2 } from './types.ts'

export interface Platform {
  x: number
  y: number
  width: number
  height: number
}

export interface Arena {
  width: number
  height: number
  platforms: Platform[]
  spawnPoints: Vec2[]
  killBoundary: number
}

export const DEFAULT_ARENA: Arena = {
  width: 1280,
  height: 720,
  platforms: [
    { x: 200, y: 550, width: 880, height: 32 },
    { x: 100, y: 400, width: 240, height: 24 },
    { x: 940, y: 400, width: 240, height: 24 },
    { x: 480, y: 260, width: 320, height: 24 },
  ],
  spawnPoints: [
    { x: 320, y: 500 },
    { x: 960, y: 500 },
    { x: 220, y: 350 },
    { x: 1060, y: 350 },
  ],
  killBoundary: 800,
}
