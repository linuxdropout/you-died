import { Application } from 'pixi.js'

export class GameRenderer {
  private app: Application

  constructor() {
    this.app = new Application()
  }

  async init(canvas: HTMLCanvasElement) {
    await this.app.init({ canvas, resizeTo: window })
  }

  destroy() {
    this.app.destroy()
  }
}
