import { Container, Graphics } from 'pixi.js'

const DURATION = 30
const LINE_COUNT = 8
const LINE_LENGTH = 60

export class LaunchEffect {
  private readonly container: Container
  private active = false
  private timer = 0
  private gfx = new Graphics()
  private originX = 0
  private originY = 0

  constructor(container: Container) {
    this.container = container
    this.container.addChild(this.gfx)
    this.gfx.visible = false
  }

  start(x: number, y: number) {
    this.active = true
    this.timer = DURATION
    this.originX = x
    this.originY = y
    this.gfx.visible = true
  }

  update() {
    if (!this.active) return

    this.timer--
    if (this.timer <= 0) {
      this.active = false
      this.gfx.visible = false
      this.gfx.clear()
      return
    }

    const progress = 1 - this.timer / DURATION
    const alpha = 0.6 * (1 - progress)

    this.gfx.clear()
    for (let i = 0; i < LINE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / LINE_COUNT
      const innerR = LINE_LENGTH * progress * 0.3
      const outerR = LINE_LENGTH * progress
      const x1 = this.originX + Math.cos(angle) * innerR
      const y1 = this.originY + Math.sin(angle) * innerR
      const x2 = this.originX + Math.cos(angle) * outerR
      const y2 = this.originY + Math.sin(angle) * outerR
      this.gfx.moveTo(x1, y1)
      this.gfx.lineTo(x2, y2)
      this.gfx.stroke({ width: 2, color: 0x00ccff, alpha })
    }
  }

  reset() {
    this.active = false
    this.timer = 0
    this.gfx.visible = false
    this.gfx.clear()
  }
}
