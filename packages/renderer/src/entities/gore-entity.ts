import { Container, Graphics } from 'pixi.js'

const GORE_COLORS = [0x8b0000, 0xa00000, 0x6b0000, 0x990000]
const MIN_SIZE = 2
const MAX_SIZE = 6

export class GoreEntity {
  readonly container = new Container()
  private gfx = new Graphics()
  spawnTick = 0

  constructor() {
    this.container.addChild(this.gfx)
    this.container.cullable = true
  }

  init(x: number, y: number, tick: number, seed: number) {
    this.spawnTick = tick

    const s1 = Math.sin(seed * 13.37) * 0.5 + 0.5
    const s2 = Math.sin(seed * 7.91) * 0.5 + 0.5
    const s3 = Math.sin(seed * 3.14) * 0.5 + 0.5

    const color = GORE_COLORS[Math.floor(s1 * GORE_COLORS.length) % GORE_COLORS.length]!
    const size = MIN_SIZE + s2 * (MAX_SIZE - MIN_SIZE)
    const rotation = s3 * Math.PI * 2

    this.gfx.clear()
    this.gfx.rect(-size / 2, -size / 2, size, size)
    this.gfx.fill(color)
    this.gfx.rotation = rotation

    this.container.position.set(x, y)
  }

  reset() {
    this.gfx.clear()
    this.spawnTick = 0
    this.container.position.set(0, 0)
  }
}
