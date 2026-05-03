import { describe, it, expect } from 'vitest'
import { getTierForPlayerCount, selectArena } from './maps.ts'

describe('getTierForPlayerCount', () => {
  it('returns small for 1-4 players', () => {
    expect(getTierForPlayerCount(1)).toBe('small')
    expect(getTierForPlayerCount(2)).toBe('small')
    expect(getTierForPlayerCount(4)).toBe('small')
  })

  it('returns medium for 5-8 players', () => {
    expect(getTierForPlayerCount(5)).toBe('medium')
    expect(getTierForPlayerCount(6)).toBe('medium')
    expect(getTierForPlayerCount(8)).toBe('medium')
  })

  it('returns large for 9-12 players', () => {
    expect(getTierForPlayerCount(9)).toBe('large')
    expect(getTierForPlayerCount(10)).toBe('large')
    expect(getTierForPlayerCount(12)).toBe('large')
  })
})

describe('selectArena', () => {
  it('is deterministic — same seed and count gives same arena', () => {
    const a1 = selectArena(42, 2)
    const a2 = selectArena(42, 2)
    expect(a1).toEqual(a2)
  })

  it('varies across different seeds', () => {
    const results = new Set<number>()
    for (let seed = 0; seed < 100; seed++) {
      results.add(selectArena(seed, 2).width)
    }
    expect(results.size).toBeGreaterThanOrEqual(1)
  })

  it('returns small arena for small player count', () => {
    const arena = selectArena(1, 2)
    expect(arena.width).toBeLessThanOrEqual(3000)
    expect(arena.spawnPoints.length).toBeGreaterThanOrEqual(4)
  })

  it('returns medium arena for medium player count', () => {
    const arena = selectArena(1, 6)
    expect(arena.width).toBeGreaterThan(3000)
    expect(arena.width).toBeLessThanOrEqual(4500)
    expect(arena.spawnPoints.length).toBeGreaterThanOrEqual(8)
  })

  it('returns large arena for large player count', () => {
    const arena = selectArena(1, 10)
    expect(arena.width).toBeGreaterThan(4500)
    expect(arena.spawnPoints.length).toBeGreaterThanOrEqual(12)
  })

  it('all arenas have valid killBoundary', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const count of [2, 6, 10]) {
        const arena = selectArena(seed, count)
        expect(arena.killBoundary).toBeGreaterThan(arena.height)
      }
    }
  })

  it('all arenas have at least one platform', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const count of [2, 6, 10]) {
        const arena = selectArena(seed, count)
        expect(arena.platforms.length).toBeGreaterThan(0)
      }
    }
  })
})
