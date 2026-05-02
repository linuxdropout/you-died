import { Container } from 'pixi.js'

export class LayerManager {
  readonly root = new Container()
  readonly background = new Container()
  readonly goreLayer = new Container()
  readonly playerLayer = new Container()
  readonly effectLayer = new Container()
  readonly overlayLayer = new Container()

  constructor() {
    this.root.addChild(
      this.background,
      this.goreLayer,
      this.playerLayer,
      this.effectLayer,
      this.overlayLayer,
    )
  }

  destroy() {
    this.root.destroy({ children: true })
  }
}
