import { Application, Graphics } from 'pixi.js'
import type { RenderFrame } from '@you-died/sim'
import { SpriteManager } from './sprite-manager.js'
import { LayerManager } from './layers/layer-manager.js'
import { EntityManager } from './entities/entity-manager.js'
import { Camera } from './camera/camera.js'
import { VfxController } from './effects/vfx-controller.js'
import { HudBridge } from './hud-bridge.js'
import {
  DEFAULT_RENDERER_CONFIG,
  type MatchContext,
  type RendererConfig,
  type HudData,
  type ScreenEvent,
} from './types.js'

export class GameRenderer {
  private app: Application
  readonly sprites: SpriteManager
  private layers: LayerManager | null = null
  private entities: EntityManager | null = null
  private camera: Camera | null = null
  private vfx: VfxController | null = null
  private hudBridge: HudBridge | null = null
  private config: RendererConfig = DEFAULT_RENDERER_CONFIG
  private context: MatchContext | null = null

  private hudCallback: ((data: HudData) => void) | null = null
  private screenEventCallback: ((event: ScreenEvent) => void) | null = null

  constructor() {
    this.app = new Application()
    this.sprites = new SpriteManager()
  }

  async init(canvas: HTMLCanvasElement, spritesBasePath: string = '/sprites') {
    await this.app.init({
      canvas,
      resizeTo: window,
      antialias: false,
      roundPixels: true,
    })

    await this.sprites.loadAll(spritesBasePath)
  }

  get stage() {
    return this.app.stage
  }

  startMatch(context: MatchContext, config?: Partial<RendererConfig>) {
    this.endMatch()

    this.context = context
    this.config = { ...DEFAULT_RENDERER_CONFIG, ...config }

    this.layers = new LayerManager()
    this.layers.root.scale.set(this.config.pixelScale)
    this.app.stage.addChild(this.layers.root)

    this.entities = new EntityManager(this.sprites, this.layers, context, this.config)
    this.camera = new Camera(this.layers.root, this.config)
    this.vfx = new VfxController(this.layers, context)
    this.hudBridge = new HudBridge(context)

    if (this.screenEventCallback) {
      this.vfx.onScreenEvent(this.screenEventCallback)
    }

    this.drawArena()
  }

  private drawArena() {
    if (!this.layers) return
    const gfx = new Graphics()

    const platforms = [
      { x: 200, y: 550, width: 880, height: 32 },
      { x: 100, y: 400, width: 240, height: 24 },
      { x: 940, y: 400, width: 240, height: 24 },
      { x: 480, y: 260, width: 320, height: 24 },
    ]

    for (const p of platforms) {
      gfx.rect(p.x, p.y, p.width, p.height)
      gfx.fill({ color: 0x444466 })
    }

    gfx.rect(0, 800, 1280, 2)
    gfx.fill({ color: 0xff0000, alpha: 0.3 })

    this.layers.background.addChild(gfx)
  }

  renderFrame(frame: RenderFrame) {
    if (!this.layers || !this.entities || !this.camera || !this.vfx || !this.hudBridge || !this.context) return

    this.entities.update(frame)

    const localPlayer = frame.players.find((p) => p.id === this.context!.localPlayerId && !p.isGhost)
    if (localPlayer) {
      this.camera.setTarget(localPlayer.pos.x, localPlayer.pos.y)
    }

    this.vfx.processEvents(frame, this.app.screen.width, this.app.screen.height)
    this.vfx.update()

    this.camera.setShakeOffset(this.vfx.shake.offsetX, this.vfx.shake.offsetY)
    this.camera.update(this.app.screen.width, this.app.screen.height)

    const hudData = this.hudBridge.processFrame(frame)
    this.hudCallback?.(hudData)
  }

  endMatch() {
    this.entities?.clear()
    this.vfx?.clear()
    this.hudBridge?.reset()
    if (this.layers) {
      this.app.stage.removeChild(this.layers.root)
      this.layers.destroy()
    }
    this.layers = null
    this.entities = null
    this.camera = null
    this.vfx = null
    this.hudBridge = null
    this.context = null
  }

  onHudUpdate(cb: (data: HudData) => void) {
    this.hudCallback = cb
  }

  onScreenEvent(cb: (event: ScreenEvent) => void) {
    this.screenEventCallback = cb
    this.vfx?.onScreenEvent(cb)
  }

  destroy() {
    this.endMatch()
    this.app.destroy()
  }
}
