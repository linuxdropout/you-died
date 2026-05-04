import { Container, Graphics, Text, TextStyle } from 'pixi.js'

interface SeverFlash {
  gfx: Graphics
  text: Text | null
  timer: number
  startY: number
}

const DURATION = 30
const CRACK_SEGMENTS = 10
const CRACK_SPREAD = 60
const COLOR = 0x38e888
const FLOAT_DISTANCE = 30

const penaltyStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 14,
  fill: 0xff4444,
  fontWeight: 'bold',
})

export class SeverEffect {
  private readonly container: Container
  private flashes: SeverFlash[] = []

  constructor(container: Container) {
    this.container = container
  }

  flash(x: number, y: number, penaltyTicks?: number) {
    const gfx = new Graphics()

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

    let text: Text | null = null
    if (penaltyTicks != null && penaltyTicks !== 0) {
      const seconds = (Math.abs(penaltyTicks) / 60).toFixed(1)
      text = new Text({ text: `-${seconds}s`, style: penaltyStyle })
      text.anchor.set(0.5)
      text.position.set(x, y - 40)
      this.container.addChild(text)
    }

    this.container.addChild(gfx)
    this.flashes.push({ gfx, text, timer: DURATION, startY: y - 40 })
  }

  update() {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i]
      if (!f) continue
      f.timer--
      const progress = 1 - f.timer / DURATION
      f.gfx.alpha = f.timer / DURATION

      if (f.text) {
        f.text.alpha = f.timer / DURATION
        f.text.position.y = f.startY - progress * FLOAT_DISTANCE
      }

      if (f.timer <= 0) {
        this.container.removeChild(f.gfx)
        f.gfx.destroy()
        if (f.text) {
          this.container.removeChild(f.text)
          f.text.destroy()
        }
        this.flashes.splice(i, 1)
      }
    }
  }

  clear() {
    for (const f of this.flashes) {
      this.container.removeChild(f.gfx)
      f.gfx.destroy()
      if (f.text) {
        this.container.removeChild(f.text)
        f.text.destroy()
      }
    }
    this.flashes.length = 0
  }
}
