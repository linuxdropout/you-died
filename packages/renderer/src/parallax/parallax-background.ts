import { Container, Graphics } from 'pixi.js'

const DEFAULT_ARENA_CENTER_Y = 480
const DRAW_HALF = 4000

function seededStars(count: number, w: number, h: number, gfx: Graphics) {
  for (let i = 0; i < count; i++) {
    const x = ((i * 137 + 29) % 200) / 200 * w
    const y = ((i * 73 + 41) % 120) / 200 * h
    const alpha = 0.25 + ((i * 53) % 50) / 100
    gfx.rect(x, y, 1, 1)
    gfx.fill({ color: 0xccccdd, alpha })
  }
}

export class ParallaxBackground {
  private readonly container = new Container()
  private readonly skyGfx = new Graphics()
  private readonly layers: { gfx: Container; scrollFactor: number }[] = []
  private prevW = 0
  private prevH = 0
  private arenaCenterY = DEFAULT_ARENA_CENTER_Y

  init(stage: Container, scale: number, arenaHeight?: number) {
    this.arenaCenterY = arenaHeight != null ? Math.round(arenaHeight * 2 / 3) : DEFAULT_ARENA_CENTER_Y
    stage.addChildAt(this.container, 0)
    this.container.addChild(this.skyGfx)

    this.addSilhouette(scale, 0.12, 0x161630, (wx) =>
      Math.sin(wx * 0.004) * 120 +
      Math.sin(wx * 0.01 + 1.2) * 60 +
      Math.sin(wx * 0.022 + 2.8) * 25 + 180,
    )

    this.addSilhouette(scale, 0.28, 0x0e1e10, (wx) =>
      Math.sin(wx * 0.008) * 55 +
      Math.sin(wx * 0.02 + 1.5) * 35 +
      Math.sin(wx * 0.05 + 0.7) * 15 +
      Math.sin(wx * 0.12 + 2.1) * 8 + 100,
    )

    this.addSilhouette(scale, 0.5, 0x0c180e, (wx) =>
      Math.sin(wx * 0.006) * 40 +
      Math.sin(wx * 0.015 + 2.0) * 25 +
      Math.sin(wx * 0.04 + 1.0) * 12 + 50,
    )
  }

  private addSilhouette(
    scale: number,
    scrollFactor: number,
    color: number,
    profile: (worldX: number) => number,
  ) {
    const gfx = new Graphics()
    gfx.moveTo(-DRAW_HALF, 0)
    for (let x = -DRAW_HALF; x <= DRAW_HALF; x += 3) {
      gfx.lineTo(x, -profile(x / scale))
    }
    gfx.lineTo(DRAW_HALF, 0)
    gfx.closePath()
    gfx.fill({ color })

    const layerContainer = new Container()
    layerContainer.addChild(gfx)
    this.container.addChild(layerContainer)
    this.layers.push({ gfx: layerContainer, scrollFactor })
  }

  private drawSky(w: number, h: number) {
    this.skyGfx.clear()
    const steps = 48
    const stripH = Math.ceil(h / steps) + 1
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const r = Math.round(0x08 + t * 0x0a)
      const g = Math.round(0x08 + t * 0x16)
      const b = Math.round(0x18 + t * 0x16)
      this.skyGfx.rect(0, i * stripH, w, stripH)
      this.skyGfx.fill({ color: (r << 16) | (g << 8) | b })
    }
    seededStars(40, w, h, this.skyGfx)
  }

  updateCamera(
    cameraX: number,
    cameraY: number,
    screenWidth: number,
    screenHeight: number,
    scale: number,
  ) {
    if (screenWidth !== this.prevW || screenHeight !== this.prevH) {
      this.drawSky(screenWidth, screenHeight)
      this.prevW = screenWidth
      this.prevH = screenHeight
    }

    for (const { gfx, scrollFactor } of this.layers) {
      const yShift = -(cameraY - this.arenaCenterY) * scale * scrollFactor * 0.3
      gfx.position.set(
        screenWidth / 2 - cameraX * scale * scrollFactor,
        screenHeight + yShift,
      )
    }
  }

  destroy() {
    this.container.removeFromParent()
    this.container.destroy({ children: true })
    this.layers.length = 0
  }
}
