import type { PlayerInput, PlayerId } from '@you-died/protocol'
import type { GameState } from '@you-died/sim'
import { nextSeed, seedToFloat } from '@you-died/sim'

function hashBotId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  return h >>> 0
}

export function generateBotInput(
  state: GameState,
  botId: PlayerId,
  tick: number,
  matchSeed: number,
): PlayerInput {
  const bot = state.players[botId]
  if (!bot?.alive) {
    return { left: false, right: false, jump: false, down: false, dash: false, slash: false, shoot: false }
  }

  let rng = nextSeed((matchSeed ^ tick ^ hashBotId(botId)) >>> 0)
  const rand = () => {
    rng = nextSeed(rng)
    return seedToFloat(rng)
  }

  let nearestDist = Infinity
  let nearestDx = 0
  let nearestDy = 0

  for (const [id, player] of Object.entries(state.players)) {
    if (id === botId || !player.alive || player.isGhost) continue
    const dx = player.pos.x - bot.pos.x
    const dy = player.pos.y - bot.pos.y
    const dist = Math.abs(dx) + Math.abs(dy)
    if (dist < nearestDist) {
      nearestDist = dist
      nearestDx = dx
      nearestDy = dy
    }
  }

  if (nearestDist === Infinity) {
    return { left: false, right: false, jump: false, down: false, dash: false, slash: false, shoot: false }
  }

  const left = nearestDx < -10
  const right = nearestDx > 10
  const jump =
    nearestDy < -30 || (bot.grounded && rand() < 0.1) || (!bot.grounded && bot.airJumpsRemaining > 0 && nearestDy < -50 && rand() < 0.3)
  const slash = nearestDist < 80 && rand() < 0.3
  const shoot = nearestDist >= 80 && nearestDist < 400 && rand() < 0.15
  const dash = nearestDist > 150 && rand() < 0.05

  return { left, right, jump, down: false, dash, slash, shoot }
}
