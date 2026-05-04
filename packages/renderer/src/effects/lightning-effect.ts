import { Container, Graphics } from 'pixi.js'

interface LightningBolt {
  gfx: Graphics
  timer: number
  x: number
  y: number
}

const DURATION = 24
const BOLT_WIDTH = 3
const BOLT_HEIGHT = 120
const BRANCH_COUNT = 3
const COLOR_CORE = 0xffffff
const COLOR_GLOW = 0x88ccff

export class LightningEffect {
  private readonly container: Container
  private bolts: LightningBolt[] = []

  constructor(container: Container) {
    this.container = container
  }

  strike(x: number, y: number) {
    const gfx = new Graphics()
    this.drawBolt(gfx, x, y)
    this.container.addChild(gfx)
    this.bolts.push({ gfx, timer: DURATION, x, y })
  }

  private drawBolt(gfx: Graphics, x: number, y: number) {
    const topY = y - BOLT_HEIGHT
    const segments = 8

    // Outer glow
    this.drawZigzag(gfx, x, topY, y, segments, COLOR_GLOW, BOLT_WIDTH + 4, 0.4)
    // Core bolt
    this.drawZigzag(gfx, x, topY, y, segments, COLOR_CORE, BOLT_WIDTH, 1.0)

    // Branches
    for (let b = 0; b < BRANCH_COUNT; b++) {
      const frac = 0.2 + (b / BRANCH_COUNT) * 0.6
      const branchY = topY + (y - topY) * frac
      const branchX = x + (Math.random() - 0.5) * 20
      const endX = branchX + (Math.random() - 0.5) * 40
      const endY = branchY + 20 + Math.random() * 30
      this.drawZigzag(gfx, branchX, branchY, endY, 4, COLOR_GLOW, 1.5, 0.5, endX)
    }

    // Flash circle at strike point
    gfx.circle(x, y, 12)
    gfx.fill({ color: COLOR_CORE, alpha: 0.6 })
    gfx.circle(x, y, 20)
    gfx.fill({ color: COLOR_GLOW, alpha: 0.2 })
  }

  private drawZigzag(
    gfx: Graphics,
    x: number,
    startY: number,
    endY: number,
    segments: number,
    color: number,
    width: number,
    alpha: number,
    endX?: number,
  ) {
    let cx = x
    let cy = startY
    gfx.moveTo(cx, cy)
    const dx = ((endX ?? x) - x) / segments
    for (let i = 1; i <= segments; i++) {
      if (i === segments) {
        cx = endX ?? x
        cy = endY
      } else {
        cx += dx + (Math.random() - 0.5) * 16
        cy += (endY - startY) / segments
      }
      gfx.lineTo(cx, cy)
    }
    gfx.stroke({ width, color, alpha })
  }

  update() {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i]
      if (!bolt) continue
      bolt.timer--

      // Flicker by redrawing at intervals
      if (bolt.timer === Math.floor(DURATION * 0.6)) {
        bolt.gfx.clear()
        this.drawBolt(bolt.gfx, bolt.x, bolt.y)
      }

      const progress = 1 - bolt.timer / DURATION
      bolt.gfx.alpha = 1 - progress * progress

      if (bolt.timer <= 0) {
        this.container.removeChild(bolt.gfx)
        bolt.gfx.destroy()
        this.bolts.splice(i, 1)
      }
    }
  }

  clear() {
    for (const bolt of this.bolts) {
      this.container.removeChild(bolt.gfx)
      bolt.gfx.destroy()
    }
    this.bolts.length = 0
  }
}
