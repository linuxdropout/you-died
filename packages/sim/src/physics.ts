import type { PlayerInput, PlayerState } from './types.ts'
import type { Arena } from './arena.ts'
import {
  GRAVITY,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  JUMP_VELOCITY,
  DASH_SPEED,
  DASH_DURATION,
  DASH_COOLDOWN,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
} from './constants.ts'

export function applyMovement(player: PlayerState, input: PlayerInput): void {
  if (!player.alive) return

  if (input.dash && player.dashTicksRemaining === 0 && player.dashCooldownTicks === 0) {
    player.dashTicksRemaining = DASH_DURATION
    player.dashCooldownTicks = DASH_COOLDOWN
  }

  if (player.dashTicksRemaining > 0) {
    player.vel.x = player.facingRight ? DASH_SPEED : -DASH_SPEED
    player.vel.y = 0
    player.dashTicksRemaining--
    if (player.dashTicksRemaining === 0) {
      player.vel.x = 0
    }
  } else {
    if (input.left && !input.right) {
      player.vel.x = -MOVE_SPEED
      player.facingRight = false
    } else if (input.right && !input.left) {
      player.vel.x = MOVE_SPEED
      player.facingRight = true
    } else {
      player.vel.x = 0
    }
  }

  if (player.dashCooldownTicks > 0) {
    player.dashCooldownTicks--
  }

  if (player.dashTicksRemaining === 0) {
    player.vel.y += GRAVITY
    if (player.vel.y > MAX_FALL_SPEED) {
      player.vel.y = MAX_FALL_SPEED
    }
  }

  if (input.jump && player.grounded) {
    player.vel.y = JUMP_VELOCITY
    player.grounded = false
  }

  player.pos.x += player.vel.x
  player.pos.y += player.vel.y
}

export function resolvePlayerPlatformCollisions(player: PlayerState, arena: Arena): void {
  if (!player.alive) return

  const playerLeft = player.pos.x - PLAYER_WIDTH / 2
  const playerRight = player.pos.x + PLAYER_WIDTH / 2
  const playerBottom = player.pos.y
  const prevPlayerBottom = player.pos.y - player.vel.y

  player.grounded = false

  for (const platform of arena.platforms) {
    if (playerRight <= platform.x || playerLeft >= platform.x + platform.width) continue

    if (prevPlayerBottom <= platform.y && playerBottom >= platform.y && player.vel.y >= 0) {
      player.pos.y = platform.y
      player.vel.y = 0
      player.grounded = true
      break
    }
  }
}

export function isOutOfBounds(player: PlayerState, arena: Arena): boolean {
  return (
    player.pos.y > arena.killBoundary ||
    player.pos.x < -PLAYER_WIDTH ||
    player.pos.x > arena.width + PLAYER_WIDTH
  )
}

export function playerAABB(player: PlayerState): {
  left: number
  right: number
  top: number
  bottom: number
} {
  return {
    left: player.pos.x - PLAYER_WIDTH / 2,
    right: player.pos.x + PLAYER_WIDTH / 2,
    top: player.pos.y - PLAYER_HEIGHT,
    bottom: player.pos.y,
  }
}
