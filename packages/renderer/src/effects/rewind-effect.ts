import { Container, Graphics } from 'pixi.js'

const DURATION = 30
const LINE_COUNT = 12
const LINE_HEIGHT = 2

export class RewindEffect {
  private readonly container: Container
  private active = false
  private timer = 0
  private gfx = new Graphics()
  private screenW = 0
  private screenH = 0

  constructor(container: Container) {
    this.container = container
    this.container.addChild(this.gfx)
    this.gfx.visible = false
  }

  start(screenWidth: number, screenHeight: number) {
    this.active = true
    this.timer = DURATION
    this.screenW = screenWidth
    this.screenH = screenHeight
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
    const alpha = 0.3 * (1 - progress)
    const scroll = progress * this.screenH

    this.gfx.clear()
    for (let i = 0; i < LINE_COUNT; i++) {
      const y = ((i / LINE_COUNT) * this.screenH + scroll) % this.screenH
      this.gfx.rect(0, y, this.screenW, LINE_HEIGHT)
      this.gfx.fill({ color: 0xffffff, alpha: alpha * (i % 2 === 0 ? 1 : 0.4) })
    }
  }

  reset() {
    this.active = false
    this.timer = 0
    this.gfx.visible = false
    this.gfx.clear()
  }
}
