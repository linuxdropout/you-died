import { TICK_RATE, REWIND_SECONDS, WIN_LEAD_SECONDS } from '@you-died/protocol'

export const REWIND_TICKS = TICK_RATE * REWIND_SECONDS
export const WIN_LEAD_TICKS = TICK_RATE * WIN_LEAD_SECONDS
export const INVUL_TICKS = TICK_RATE

export const GRAVITY = 0.55
export const MAX_FALL_SPEED = 12
export const MOVE_SPEED = 4
export const JUMP_VELOCITY = -10
export const DASH_SPEED = 14
export const DASH_DURATION = 8
export const DASH_COOLDOWN = 30

export const PLAYER_WIDTH = 32
export const PLAYER_HEIGHT = 48

export const PROJECTILE_SPEED = 10
export const PROJECTILE_LIFETIME = 120
export const SHOOT_COOLDOWN = 30
export const SHOOT_DURATION = 10
export const PROJECTILE_WIDTH = 8
export const PROJECTILE_HEIGHT = 4

export const SLASH_DURATION = 6
export const SLASH_COOLDOWN = 18
export const SLASH_WIDTH = 48
export const SLASH_HEIGHT = 40
export const SLASH_OFFSET_X = 28

export const MAX_GHOST_TIMELINES = 100
