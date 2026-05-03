import type { Container } from 'pixi.js'
import type { RendererConfig } from '../types.js'

export class Camera {
  private readonly worldContainer: Container
  private readonly config: RendererConfig
  private targetX = 0
  private targetY = 0
  private currentX = 0
  private currentY = 0
  private shakeX = 0
  private shakeY = 0

  constructor(worldContainer: Container, config: RendererConfig) {
    this.worldContainer = worldContainer
    this.config = config
  }

  get worldX() {
    return this.currentX
  }

  get worldY() {
    return this.currentY
  }

  setTarget(x: number, y: number) {
    this.targetX = x
    this.targetY = y
  }

  setShakeOffset(x: number, y: number) {
    this.shakeX = x
    this.shakeY = y
  }

  update(screenWidth: number, screenHeight: number) {
    const s = this.config.cameraSmoothing
    this.currentX += (this.targetX - this.currentX) * s
    this.currentY += (this.targetY - this.currentY) * s

    const scale = this.config.pixelScale
    this.worldContainer.position.set(
      -this.currentX * scale + screenWidth / 2 + this.shakeX,
      -this.currentY * scale + screenHeight / 2 + this.shakeY,
    )
  }
}
