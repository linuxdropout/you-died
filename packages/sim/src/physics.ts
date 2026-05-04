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
  MAX_AIR_JUMPS,
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
    player.invulTicksRemaining = Math.max(player.invulTicksRemaining, 1)
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

  const jumpPressed = input.jump && !player.jumpHeld
  if (jumpPressed) {
    if (player.grounded) {
      player.vel.y = JUMP_VELOCITY
      player.grounded = false
    } else if (player.airJumpsRemaining > 0) {
      player.vel.y = JUMP_VELOCITY
      player.airJumpsRemaining--
    }
  }
  player.jumpHeld = input.jump

  player.pos.x += player.vel.x
  player.pos.y += player.vel.y
}

export function resolvePlayerPlatformCollisions(player: PlayerState, arena: Arena, dropThrough: boolean): void {
  if (!player.alive) return

  const playerLeft = player.pos.x - PLAYER_WIDTH / 2
  const playerRight = player.pos.x + PLAYER_WIDTH / 2
  const playerBottom = player.pos.y
  const prevPlayerBottom = player.pos.y - player.vel.y

  player.grounded = false

  for (const platform of arena.platforms) {
    if (platform.isWall) continue
    if (dropThrough) continue
    if (playerRight <= platform.x || playerLeft >= platform.x + platform.width) continue

    if (prevPlayerBottom <= platform.y && playerBottom >= platform.y && player.vel.y >= 0) {
      player.pos.y = platform.y
      player.vel.y = 0
      player.grounded = true
      player.airJumpsRemaining = MAX_AIR_JUMPS
      break
    }
  }

  resolveWallCollisions(player, arena)
}

function resolveWallCollisions(player: PlayerState, arena: Arena): void {
  const pLeft = player.pos.x - PLAYER_WIDTH / 2
  const pRight = player.pos.x + PLAYER_WIDTH / 2
  const pTop = player.pos.y - PLAYER_HEIGHT
  const pBottom = player.pos.y

  for (const wall of arena.platforms) {
    if (!wall.isWall) continue

    const wLeft = wall.x
    const wRight = wall.x + wall.width
    const wTop = wall.y
    const wBottom = wall.y + wall.height

    if (pRight <= wLeft || pLeft >= wRight || pBottom <= wTop || pTop >= wBottom) continue

    const overlapLeft = pRight - wLeft
    const overlapRight = wRight - pLeft
    if (overlapLeft < overlapRight) {
      player.pos.x -= overlapLeft
    } else {
      player.pos.x += overlapRight
    }
    player.vel.x = 0
  }
}

export function isOutOfBounds(player: PlayerState, arena: Arena): boolean {
  return (
    player.pos.y > arena.killBoundary ||
    player.pos.x < -PLAYER_WIDTH ||
    player.pos.x > arena.width + PLAYER_WIDTH
  )
}
