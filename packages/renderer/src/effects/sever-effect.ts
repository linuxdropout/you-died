import { Container, Graphics } from 'pixi.js'

interface SeverFlash {
  gfx: Graphics
  timer: number
}

const DURATION = 15
const CRACK_SEGMENTS = 6
const CRACK_SPREAD = 30

export class SeverEffect {
  private readonly container: Container
  private flashes: SeverFlash[] = []

  constructor(container: Container) {
    this.container = container
  }

  flash(x: number, y: number) {
    const gfx = new Graphics()

    let cx = x
    let cy = y - CRACK_SPREAD
    gfx.moveTo(cx, cy)
    for (let i = 0; i < CRACK_SEGMENTS; i++) {
      cx += (Math.random() - 0.5) * 16
      cy += CRACK_SPREAD * 2 / CRACK_SEGMENTS
      gfx.lineTo(cx, cy)
    }
    gfx.stroke({ width: 2, color: 0xffffff })

    this.container.addChild(gfx)
    this.flashes.push({ gfx, timer: DURATION })
  }

  update() {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i]!
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
