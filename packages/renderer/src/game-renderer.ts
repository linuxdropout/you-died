import { Application, Graphics } from 'pixi.js'
import { type RenderFrame, DEFAULT_ARENA } from '@you-died/sim'
import { SpriteManager } from './sprite-manager.js'
import { LayerManager } from './layers/layer-manager.js'
import { EntityManager } from './entities/entity-manager.js'
import { Camera } from './camera/camera.js'
import { VfxController } from './effects/vfx-controller.js'
import { HudBridge } from './hud-bridge.js'
import { AudioContextGuard } from './audio/audio-context-guard.js'
import { SoundManager } from './audio/sound-manager.js'
import { ParallaxBackground } from './parallax/parallax-background.js'
import { drawPlatforms } from './parallax/platform-renderer.js'
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
  private sound: SoundManager | null = null
  private parallax: ParallaxBackground | null = null
  private readonly audioGuard: AudioContextGuard
  private config: RendererConfig = DEFAULT_RENDERER_CONFIG
  private context: MatchContext | null = null

  private hudCallback: ((data: HudData) => void) | null = null
  private screenEventCallback: ((event: ScreenEvent) => void) | null = null

  constructor(audioGuard?: AudioContextGuard) {
    this.app = new Application()
    this.sprites = new SpriteManager()
    this.audioGuard = audioGuard ?? new AudioContextGuard()
  }

  async init(canvas: HTMLCanvasElement, spritesBasePath = '/sprites') {
    await this.app.init({
      canvas,
      resizeTo: window,
      antialias: false,
      roundPixels: true,
      preference: 'webgl',
      background: '#1a1a2e',
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

    this.parallax = new ParallaxBackground()
    this.parallax.init(this.app.stage, this.config.pixelScale)

    this.app.stage.addChild(this.layers.root)

    this.entities = new EntityManager(this.sprites, this.layers, context, this.config)
    this.camera = new Camera(this.layers.root, this.config)
    this.sound = new SoundManager(this.audioGuard, context.localPlayerId)
    this.vfx = new VfxController(this.layers, context, this.sound)
    this.hudBridge = new HudBridge(context)

    if (this.screenEventCallback) {
      this.vfx.onScreenEvent(this.screenEventCallback)
    }

    this.drawArena()
  }

  private drawArena() {
    if (!this.layers) return

    drawPlatforms(this.layers.background, DEFAULT_ARENA.platforms)

    const killLine = new Graphics()
    killLine.rect(0, DEFAULT_ARENA.killBoundary, DEFAULT_ARENA.width, 2)
    killLine.fill({ color: 0xff0000, alpha: 0.3 })
    this.layers.background.addChild(killLine)
  }

  renderFrame(frame: RenderFrame) {
    if (
      !this.layers ||
      !this.entities ||
      !this.camera ||
      !this.vfx ||
      !this.hudBridge ||
      !this.context
    )
      return

    this.entities.update(frame)

    const localPlayer = frame.players.find(
      (p) => p.id === this.context?.localPlayerId && !p.isGhost,
    )
    if (localPlayer) {
      this.camera.setTarget(localPlayer.pos.x, localPlayer.pos.y)
    }

    this.vfx.processEvents(frame, this.app.screen.width, this.app.screen.height)
    this.vfx.update()
    this.sound?.processFrame(frame)

    this.camera.setShakeOffset(this.vfx.shake.offsetX, this.vfx.shake.offsetY)
    this.camera.update(this.app.screen.width, this.app.screen.height)

    this.parallax?.updateCamera(
      this.camera.worldX,
      this.camera.worldY,
      this.app.screen.width,
      this.app.screen.height,
      this.config.pixelScale,
    )

    const hudData = this.hudBridge.processFrame(frame)
    this.hudCallback?.(hudData)
  }

  endMatch() {
    this.entities?.clear()
    this.vfx?.clear()
    this.hudBridge?.reset()
    this.sound?.clear()
    this.parallax?.destroy()
    if (this.layers) {
      this.app.stage.removeChild(this.layers.root)
      this.layers.destroy()
    }
    this.layers = null
    this.entities = null
    this.camera = null
    this.vfx = null
    this.hudBridge = null
    this.sound = null
    this.parallax = null
    this.context = null
  }

  onHudUpdate(cb: (data: HudData) => void) {
    this.hudCallback = cb
  }

  onScreenEvent(cb: (event: ScreenEvent) => void) {
    this.screenEventCallback = cb
    this.vfx?.onScreenEvent(cb)
  }

  getAudioGuard(): AudioContextGuard {
    return this.audioGuard
  }

  setMasterVolume(v: number): void {
    this.sound?.setMasterVolume(v)
  }

  destroy() {
    this.endMatch()
    this.app.destroy()
  }
}
