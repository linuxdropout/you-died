import { Container, Graphics } from 'pixi.js'
import type { Platform } from '@you-died/sim'

const GORE_COLORS = [0x8b0000, 0xa00000, 0x6b0000, 0x990000]
const GORE_GRAVITY = 0.4
const BOUNCE_FACTOR = 0.25
const FRICTION = 0.7
const SETTLE_VY = 0.5
const SETTLE_VX = 0.3

const BODY_L = 0
const BODY_D = 1
const ARMS_L = 2
const ARMS_D = 3
const LEGS_L = 4
const LEGS_D = 5
const HEAD = 6

const GIB_PALETTE: Record<string, number[]> = {
  red:    [0xe63946, 0xa8201a, 0xff8787, 0xe03131, 0xe63946, 0xa8201a, 0xf4d9a0],
  blue:   [0x457b9d, 0x1d3557, 0xa8dadc, 0x5fa8c8, 0x457b9d, 0x1d3557, 0xf4d9a0],
  green:  [0x2a9d8f, 0x1a6b5f, 0x76d7c4, 0x3db89e, 0x2a9d8f, 0x1a6b5f, 0xf4d9a0],
  yellow: [0xe9c46a, 0xc87f2a, 0xf7e8a4, 0xe0b44c, 0xe9c46a, 0xc87f2a, 0xf4d9a0],
  purple: [0x7b2d8e, 0x5a1d6b, 0xc084e0, 0x9445b5, 0x7b2d8e, 0x5a1d6b, 0xf4d9a0],
  orange: [0xe87620, 0xb85a10, 0xffb870, 0xe88838, 0xe87620, 0xb85a10, 0xf4d9a0],
  pink:   [0xe05090, 0xb03070, 0xf4a0c4, 0xe060a0, 0xe05090, 0xb03070, 0xf4d9a0],
  cyan:   [0x20b2c8, 0x108898, 0x80e0f0, 0x38c0d4, 0x20b2c8, 0x108898, 0xf4d9a0],
  white:  [0xd8d8e0, 0xa0a0b0, 0xececf0, 0xc8c8d4, 0xd8d8e0, 0xa0a0b0, 0xf4d9a0],
  brown:  [0x8b5e3c, 0x5e3a20, 0xc89870, 0xa06840, 0x8b5e3c, 0x5e3a20, 0xf4d9a0],
  lime:   [0x80c020, 0x5a9010, 0xb8e060, 0x90d030, 0x80c020, 0x5a9010, 0xf4d9a0],
  teal:   [0x208070, 0x105848, 0x60c0a8, 0x309880, 0x208070, 0x105848, 0xf4d9a0],
}

function drawHead(gfx: Graphics, palette: number[]) {
  gfx.circle(0, 0, 4)
  gfx.fill(palette[HEAD] ?? 0)
  gfx.circle(-1.5, -1, 1)
  gfx.fill(0x333333)
}

function drawTorso(gfx: Graphics, palette: number[], variant: number) {
  const color = variant === 0 ? (palette[BODY_L] ?? 0) : (palette[BODY_D] ?? 0)
  const accent = variant === 0 ? (palette[BODY_D] ?? 0) : (palette[BODY_L] ?? 0)
  gfx.rect(-4, -5, 8, 10)
  gfx.fill(color)
  gfx.rect(-4, -5, 8, 3)
  gfx.fill(accent)
}

function drawArm(gfx: Graphics, palette: number[], variant: number) {
  const color = variant === 0 ? (palette[ARMS_L] ?? 0) : (palette[ARMS_D] ?? 0)
  const accent = variant === 0 ? (palette[ARMS_D] ?? 0) : (palette[ARMS_L] ?? 0)
  gfx.rect(-1.5, -4, 3, 8)
  gfx.fill(color)
  gfx.rect(-1.5, -4, 3, 2)
  gfx.fill(accent)
}

function drawLeg(gfx: Graphics, palette: number[], variant: number) {
  const color = variant === 0 ? (palette[LEGS_L] ?? 0) : (palette[LEGS_D] ?? 0)
  const accent = variant === 0 ? (palette[LEGS_D] ?? 0) : (palette[LEGS_L] ?? 0)
  gfx.rect(-2, -4.5, 4, 9)
  gfx.fill(color)
  gfx.rect(-2, 2.5, 4, 2)
  gfx.fill(accent)
}

function drawChunk(gfx: Graphics, seed: number) {
  const s = 2 + (Math.sin(seed * 7.91) * 0.5 + 0.5) * 4
  const color = GORE_COLORS[Math.floor((Math.sin(seed * 13.37) * 0.5 + 0.5) * GORE_COLORS.length) % GORE_COLORS.length] ?? 0x8b0000
  gfx.rect(-s / 2, -s / 2, s, s)
  gfx.fill(color)
}

export class GoreEntity {
  readonly container = new Container()
  private gfx = new Graphics()
  spawnTick = 0
  settled = false
  markedForCull = false
  private vx = 0
  private vy = 0
  private rotSpeed = 0
  private platforms: Platform[] = []
  private killBoundary = 9999

  constructor() {
    this.container.addChild(this.gfx)
    this.container.cullable = true
  }

  init(
    x: number,
    y: number,
    tick: number,
    seed: number,
    vx: number,
    vy: number,
    gibIndex: number,
    playerColor: string,
    platforms: Platform[],
    killBoundary: number,
  ) {
    this.spawnTick = tick
    this.settled = false
    this.markedForCull = false
    this.vx = vx
    this.vy = vy
    this.platforms = platforms
    this.killBoundary = killBoundary

    const s3 = Math.sin(seed * 3.14) * 0.5 + 0.5
    this.rotSpeed = (s3 - 0.5) * 0.3
    this.gfx.rotation = s3 * Math.PI * 2

    const palette = GIB_PALETTE[playerColor] ?? GIB_PALETTE['red'] ?? []

    this.gfx.clear()
    if (gibIndex === 0) {
      drawHead(this.gfx, palette)
    } else if (gibIndex <= 2) {
      drawTorso(this.gfx, palette, gibIndex - 1)
    } else if (gibIndex <= 4) {
      drawArm(this.gfx, palette, gibIndex - 3)
    } else if (gibIndex <= 6) {
      drawLeg(this.gfx, palette, gibIndex - 5)
    } else {
      drawChunk(this.gfx, seed)
    }

    this.container.position.set(x, y)
  }

  update() {
    if (this.settled) return

    const prevY = this.container.position.y
    this.vy += GORE_GRAVITY
    this.container.position.x += this.vx
    this.container.position.y += this.vy
    this.gfx.rotation += this.rotSpeed

    if (this.vy >= 0) {
      const x = this.container.position.x
      const curY = this.container.position.y

      for (const plat of this.platforms) {
        if (plat.isWall) continue
        if (x < plat.x || x > plat.x + plat.width) continue
        if (prevY <= plat.y && curY >= plat.y) {
          this.container.position.y = plat.y
          this.vy = -this.vy * BOUNCE_FACTOR
          this.vx *= FRICTION
          this.rotSpeed *= 0.5

          if (Math.abs(this.vy) < SETTLE_VY && Math.abs(this.vx) < SETTLE_VX) {
            this.vx = 0
            this.vy = 0
            this.rotSpeed = 0
            this.settled = true
          }
          return
        }
      }
    }

    if (this.container.position.y > this.killBoundary) {
      this.markedForCull = true
    }
  }

  reset() {
    this.gfx.clear()
    this.spawnTick = 0
    this.vx = 0
    this.vy = 0
    this.rotSpeed = 0
    this.settled = false
    this.markedForCull = false
    this.platforms = []
    this.killBoundary = 9999
    this.container.position.set(0, 0)
  }
}
