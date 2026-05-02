import { Container, Graphics } from 'pixi.js'

interface SeverFlash {
  gfx: Graphics
  timer: number
}

const DURATION = 30
const CRACK_SEGMENTS = 10
const CRACK_SPREAD = 60
const COLOR = 0x38e888

export class SeverEffect {
  private readonly container: Container
  private flashes: SeverFlash[] = []

  constructor(container: Container) {
    this.container = container
  }

  flash(x: number, y: number) {
    const gfx = new Graphics()

    // Brief white flash
    gfx.rect(x - 40, y - 50, 80, 100)
    gfx.fill({ color: 0xffffff, alpha: 0.15 })

    // Main crack
    let cx = x
    let cy = y - CRACK_SPREAD
    gfx.moveTo(cx, cy)
    for (let i = 0; i < CRACK_SEGMENTS; i++) {
      cx += (Math.random() - 0.5) * 20
      cy += (CRACK_SPREAD * 2) / CRACK_SEGMENTS
      gfx.lineTo(cx, cy)
    }
    gfx.stroke({ width: 3, color: COLOR })

    // Echo crack (offset, thinner)
    cx = x + 4
    cy = y - CRACK_SPREAD
    gfx.moveTo(cx, cy)
    for (let i = 0; i < CRACK_SEGMENTS; i++) {
      cx += (Math.random() - 0.5) * 18
      cy += (CRACK_SPREAD * 2) / CRACK_SEGMENTS
      gfx.lineTo(cx, cy)
    }
    gfx.stroke({ width: 1, color: COLOR, alpha: 0.5 })

    this.container.addChild(gfx)
    this.flashes.push({ gfx, timer: DURATION })
  }

  update() {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i]
      if (!f) continue
      f.timer--
      f.gfx.alpha = f.timer / DURATION

      if (f.timer <= 0) {
        this.container.removeChild(f.gfx)
        f.gfx.destroy()
        this.flashes.splice(i, 1)
      }
    }
  }

  clear() {
    for (const f of this.flashes) {
      this.container.removeChild(f.gfx)
      f.gfx.destroy()
    }
    this.flashes.length = 0
  }
}
