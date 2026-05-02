import { Assets, AnimatedSprite, Spritesheet, type Ticker } from 'pixi.js'
import {
  ANIMATION_META,
  PLAYER_COLORS,
  getAssetManifest,
  type AnimationName,
  type PlayerColor,
} from '@you-died/assets'

export class PlayerSprite {
  readonly sprite: AnimatedSprite
  private sheet: Spritesheet
  private currentAnimation: AnimationName | null = null

  constructor(sheet: Spritesheet) {
    this.sheet = sheet
    const anims = Object.values(sheet.animations)
    const firstAnim = anims[0]
    if (!firstAnim) throw new Error('Spritesheet has no animations')
    this.sprite = new AnimatedSprite(firstAnim)
    this.sprite.anchor.set(0.5, 1.0)
    this.sprite.autoUpdate = false
  }

  playAnimation(name: AnimationName) {
    if (this.currentAnimation === name) return
    this.currentAnimation = name

    const textures = this.sheet.animations[name]
    if (!textures) return

    const meta = ANIMATION_META[name]
    this.sprite.textures = textures
    this.sprite.animationSpeed = meta.fps / 60
    this.sprite.loop = meta.loop
    this.sprite.gotoAndPlay(0)
  }

  setFrame(name: AnimationName, frameIndex: number) {
    const textures = this.sheet.animations[name]
    if (!textures) return

    if (this.currentAnimation !== name) {
      this.sprite.textures = textures
      this.currentAnimation = name
    }

    this.sprite.gotoAndStop(frameIndex % textures.length)
  }

  update(deltaFrames: number) {
    this.sprite.update({ deltaTime: deltaFrames } as unknown as Ticker)
  }
}

export class SpriteManager {
  private sheets = new Map<string, Spritesheet>()

  async loadAll(basePath: string): Promise<void> {
    const manifest = getAssetManifest(basePath)

    const loadPromises: Promise<void>[] = []

    for (const color of PLAYER_COLORS) {
      const { sheet: sheetUrl } = manifest.players[color]

      loadPromises.push(
        Assets.load(sheetUrl).then((sheet: Spritesheet) => {
          sheet.textureSource.scaleMode = 'nearest'
          this.sheets.set(`player-${color}`, sheet)
        }),
      )
    }

    loadPromises.push(
      Assets.load(manifest.ghost).then((sheet: Spritesheet) => {
        sheet.textureSource.scaleMode = 'nearest'
        this.sheets.set('ghost', sheet)
      }),
    )

    loadPromises.push(
      Assets.load(manifest.effects.bullet).then((sheet: Spritesheet) => {
        sheet.textureSource.scaleMode = 'nearest'
        this.sheets.set('bullet', sheet)
      }),
    )

    loadPromises.push(
      Assets.load(manifest.effects.slashEffect).then((sheet: Spritesheet) => {
        sheet.textureSource.scaleMode = 'nearest'
        this.sheets.set('slash-effect', sheet)
      }),
    )

    await Promise.all(loadPromises)
  }

  createPlayerSprite(color: PlayerColor, ghost = false): PlayerSprite {
    const key = ghost ? 'ghost' : `player-${color}`
    const sheet = this.sheets.get(key)
    if (!sheet) throw new Error(`Spritesheet "${key}" not loaded`)
    return new PlayerSprite(sheet)
  }

  createBulletSprite(): AnimatedSprite {
    const sheet = this.sheets.get('bullet')
    if (!sheet) throw new Error('Bullet spritesheet not loaded')
    const textures = sheet.animations['bullet']
    if (!textures) throw new Error('Bullet animation not found in spritesheet')
    const sprite = new AnimatedSprite(textures)
    sprite.anchor.set(0.5, 0.5)
    sprite.animationSpeed = 0.2
    sprite.loop = true
    sprite.autoUpdate = false
    sprite.play()
    return sprite
  }

  createSlashEffect(): AnimatedSprite {
    const sheet = this.sheets.get('slash-effect')
    if (!sheet) throw new Error('Slash effect spritesheet not loaded')
    const textures = sheet.animations['slash-effect']
    if (!textures) throw new Error('Slash effect animation not found in spritesheet')
    const sprite = new AnimatedSprite(textures)
    sprite.anchor.set(0.5, 0.5)
    sprite.animationSpeed = 0.667
    sprite.loop = false
    sprite.autoUpdate = false
    sprite.play()
    return sprite
  }
}
