import { describe, it, expect, beforeEach } from 'vitest'
import { MatchController } from './match-controller.js'
import { MATCH_TIME_LIMIT_SECONDS, TICK_RATE } from '@you-died/protocol'

describe('MatchController', () => {
  let controller: MatchController

  beforeEach(() => {
    controller = new MatchController()
  })

  describe('lobby', () => {
    it('adds players and reports lobby state', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')

      const state = controller.getLobbyState()
      expect(state).toHaveLength(2)
      expect(state[0]).toEqual({ id: 'p1', name: 'Alice', ready: false, color: 'red' })
    })

    it('rejects players beyond max capacity', () => {
      controller.addPlayer('p1', 'A')
      controller.addPlayer('p2', 'B')
      controller.addPlayer('p3', 'C')
      controller.addPlayer('p4', 'D')

      expect(controller.addPlayer('p5', 'E')).toBe(false)
    })

    it('removes players from lobby', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.removePlayer('p1')

      expect(controller.getLobbyState()).toHaveLength(1)
      expect(controller.getLobbyState()[0]?.id).toBe('p2')
    })

    it('updates player name', () => {
      controller.addPlayer('p1', 'Old')
      controller.setName('p1', 'New')

      expect(controller.getLobbyState()[0]?.name).toBe('New')
    })

    it('toggles ready state', () => {
      controller.addPlayer('p1', 'Alice')
      controller.setReady('p1')
      expect(controller.getLobbyState()[0]?.ready).toBe(true)

      controller.setReady('p1')
      expect(controller.getLobbyState()[0]?.ready).toBe(false)
    })
  })

  describe('host', () => {
    it('assigns first player as host', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')

      expect(controller.getHostId()).toBe('p1')
    })

    it('promotes next player when host leaves', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.removePlayer('p1')

      expect(controller.getHostId()).toBe('p2')
    })

    it('sets host to null when all players leave', () => {
      controller.addPlayer('p1', 'Alice')
      controller.removePlayer('p1')

      expect(controller.getHostId()).toBeNull()
    })
  })

  describe('colors', () => {
    it('assigns unique colors to players', () => {
      controller.addPlayer('p1', 'A')
      controller.addPlayer('p2', 'B')
      controller.addPlayer('p3', 'C')
      controller.addPlayer('p4', 'D')

      const state = controller.getLobbyState()
      const colors = state.map(p => p.color)
      expect(new Set(colors).size).toBe(4)
    })

    it('reuses colors when a player leaves', () => {
      controller.addPlayer('p1', 'A')
      controller.addPlayer('p2', 'B')
      const firstColor = controller.getLobbyState()[0]!.color

      controller.removePlayer('p1')
      controller.addPlayer('p3', 'C')

      const state = controller.getLobbyState()
      const colors = state.map(p => p.color)
      expect(colors).toContain(firstColor)
    })
  })

  describe('match start', () => {
    it('can start with a single player', () => {
      controller.addPlayer('p1', 'Alice')
      controller.setReady('p1')

      expect(controller.canStart()).toBe(true)
    })

    it('cannot start when not all players are ready', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')

      expect(controller.canStart()).toBe(false)
    })

    it('can start when all players are ready', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')

      expect(controller.canStart()).toBe(true)
    })

    it('transitions to match phase on start', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')

      const playerIds = controller.startMatch(42)
      expect(playerIds).toEqual(['p1', 'p2'])
      expect(controller.getPhase()).toBe('match')
    })

    it('rejects new players during match', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')
      controller.startMatch(42)

      expect(controller.addPlayer('p3', 'Charlie')).toBe(false)
    })
  })

  describe('countdown', () => {
    it('starts countdown when all players are ready', () => {
      controller.addPlayer('p1', 'Alice')
      controller.setReady('p1')

      expect(controller.startCountdown()).toBe(true)
      expect(controller.countdownSeconds).toBe(3)
    })

    it('rejects countdown when not all players are ready', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')

      expect(controller.startCountdown()).toBe(false)
      expect(controller.countdownSeconds).toBeNull()
    })

    it('ticks down to zero then signals start', () => {
      controller.addPlayer('p1', 'Alice')
      controller.setReady('p1')
      controller.startCountdown()

      expect(controller.tickCountdown()).toBe('tick')
      expect(controller.countdownSeconds).toBe(2)

      expect(controller.tickCountdown()).toBe('tick')
      expect(controller.countdownSeconds).toBe(1)

      expect(controller.tickCountdown()).toBe('start')
      expect(controller.countdownSeconds).toBeNull()
    })

    it('can be cancelled', () => {
      controller.addPlayer('p1', 'Alice')
      controller.setReady('p1')
      controller.startCountdown()

      controller.cancelCountdown()
      expect(controller.countdownSeconds).toBeNull()
    })

    it('cancels when a player unreadies', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')
      controller.startCountdown()

      controller.setReady('p1')
      expect(controller.countdownSeconds).toBeNull()
    })

    it('cancels when a player leaves', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')
      controller.startCountdown()

      controller.removePlayer('p2')
      expect(controller.countdownSeconds).toBeNull()
    })
  })

  describe('match ticking', () => {
    beforeEach(() => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')
      controller.startMatch(42)
    })

    it('produces confirmed inputs with no-op defaults', () => {
      const result = controller.tick()

      expect(result).not.toBeNull()
      expect(result?.tick).toBe(0)
      expect(result?.inputs['p1']).toEqual({
        left: false, right: false, jump: false,
        dash: false, slash: false, shoot: false,
      })
    })

    it('includes submitted inputs in tick output', () => {
      controller.submitInput('p1', 0, {
        left: true, right: false, jump: false,
        dash: false, slash: false, shoot: false,
      })

      const result = controller.tick()
      expect(result?.inputs['p1']?.left).toBe(true)
      expect(result?.inputs['p2']?.left).toBe(false)
    })

    it('increments tick each call', () => {
      expect(controller.tick()?.tick).toBe(0)
      expect(controller.tick()?.tick).toBe(1)
      expect(controller.tick()?.tick).toBe(2)
    })

    it('stores state hashes for recent ticks', () => {
      controller.tick()
      controller.tick()
      controller.tick()

      expect(controller.getHashForTick(1)).toBeTypeOf('number')
      expect(controller.getHashForTick(2)).toBeTypeOf('number')
      expect(controller.getHashForTick(3)).toBeTypeOf('number')
      expect(controller.getHashForTick(999)).toBeUndefined()
    })

    it('prunes old hashes beyond buffer window', () => {
      for (let i = 0; i < 130; i++) {
        controller.tick()
      }

      expect(controller.getHashForTick(1)).toBeUndefined()
      expect(controller.getHashForTick(130)).toBeTypeOf('number')
    })
  })

  describe('match end', () => {
    beforeEach(() => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')
      controller.startMatch(42)
    })

    it('ends match when all players leave', () => {
      controller.removePlayer('p1')
      controller.removePlayer('p2')
      expect(controller.getPhase()).toBe('ended')
    })

    it('continues match with one player remaining', () => {
      controller.removePlayer('p1')
      expect(controller.getPhase()).toBe('match')
    })

    it('ends match after time limit', () => {
      const totalTicks = MATCH_TIME_LIMIT_SECONDS * TICK_RATE
      for (let i = 0; i < totalTicks; i++) {
        controller.tick()
      }

      const result = controller.isMatchOver()
      expect(result).toEqual({ reason: 'timeout' })
      expect(controller.getPhase()).toBe('ended')
    })

    it('does not report match over before time limit', () => {
      controller.tick()
      expect(controller.isMatchOver()).toBeNull()
    })
  })

  describe('resetToLobby', () => {
    it('transitions back to lobby and unreadies players', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')
      controller.startMatch(42)

      controller.tick()
      controller.tick()
      controller.resetToLobby()

      expect(controller.getPhase()).toBe('lobby')
      const state = controller.getLobbyState()
      expect(state).toHaveLength(2)
      expect(state[0]!.ready).toBe(false)
      expect(state[1]!.ready).toBe(false)
      expect(controller.countdownSeconds).toBeNull()
    })

    it('preserves players and host after reset', () => {
      controller.addPlayer('p1', 'Alice')
      controller.addPlayer('p2', 'Bob')
      controller.setReady('p1')
      controller.setReady('p2')
      controller.startMatch(42)

      controller.resetToLobby()

      expect(controller.getHostId()).toBe('p1')
      expect(controller.getLobbyState().map(p => p.id)).toEqual(['p1', 'p2'])
    })
  })
})
