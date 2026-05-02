import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const OUT_DIR = path.resolve(import.meta.dirname, '../sprites')

const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'] as const

interface FrameDef {
  name: string
  x: number
  y: number
  w: number
  h: number
}

interface AnimDef {
  name: string
  frameCount: number
  frameWidth: number
  frameHeight: number
}

const ANIMATIONS: AnimDef[] = [
  { name: 'idle',  frameCount: 10, frameWidth: 48, frameHeight: 48 },
  { name: 'run',   frameCount: 8,  frameWidth: 48, frameHeight: 48 },
  { name: 'jump',  frameCount: 6,  frameWidth: 48, frameHeight: 48 },
  { name: 'dash',  frameCount: 9,  frameWidth: 48, frameHeight: 48 },
  { name: 'slash', frameCount: 6,  frameWidth: 64, frameHeight: 64 },
  { name: 'shoot', frameCount: 10, frameWidth: 48, frameHeight: 48 },
  { name: 'death', frameCount: 10, frameWidth: 48, frameHeight: 48 },
]

const COLS = 10

function generatePlayerSheetJson(variant: string, imageFile: string) {
  const pngPath = path.join(OUT_DIR, imageFile)
  const pngData = PNG.sync.read(fs.readFileSync(pngPath))
  const maxFrameWidth = Math.max(...ANIMATIONS.map((a) => a.frameWidth))
  const maxFrameHeight = Math.max(...ANIMATIONS.map((a) => a.frameHeight))

  const frames: Record<string, object> = {}
  const animations: Record<string, string[]> = {}

  let frameIdx = 0

  for (const anim of ANIMATIONS) {
    const frameNames: string[] = []

    for (let f = 0; f < anim.frameCount; f++) {
      const col = frameIdx % COLS
      const row = Math.floor(frameIdx / COLS)
      const x = col * maxFrameWidth
      const y = row * maxFrameHeight
      const frameName = `${variant}/${anim.name}_${f}`

      frames[frameName] = {
        frame: { x, y, w: anim.frameWidth, h: anim.frameHeight },
        sourceSize: { w: anim.frameWidth, h: anim.frameHeight },
        spriteSourceSize: { x: 0, y: 0, w: anim.frameWidth, h: anim.frameHeight },
        anchor: { x: 0.5, y: 1.0 },
      }

      frameNames.push(frameName)
      frameIdx++
    }

    animations[anim.name] = frameNames
  }

  return {
    frames,
    animations,
    meta: {
      image: imageFile,
      format: 'RGBA8888',
      size: { w: pngData.width, h: pngData.height },
      scale: '1',
    },
  }
}

function generateEffectSheetJson(name: string, imageFile: string, frameWidth: number, frameCount: number) {
  const pngPath = path.join(OUT_DIR, imageFile)
  const pngData = PNG.sync.read(fs.readFileSync(pngPath))

  const frames: Record<string, object> = {}
  const frameNames: string[] = []

  for (let f = 0; f < frameCount; f++) {
    const frameName = `${name}/${name}_${f}`
    frames[frameName] = {
      frame: { x: f * frameWidth, y: 0, w: frameWidth, h: pngData.height },
      sourceSize: { w: frameWidth, h: pngData.height },
      spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: pngData.height },
      anchor: { x: 0.5, y: 0.5 },
    }
    frameNames.push(frameName)
  }

  return {
    frames,
    animations: { [name]: frameNames },
    meta: {
      image: imageFile,
      format: 'RGBA8888',
      size: { w: pngData.width, h: pngData.height },
      scale: '1',
    },
  }
}

function writeJson(filePath: string, data: object) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function main() {
  for (const color of PLAYER_COLORS) {
    console.log(`Generating metadata for player-${color}...`)
    const playerJson = generatePlayerSheetJson(`player-${color}`, `player-${color}.png`)
    writeJson(path.join(OUT_DIR, `player-${color}.json`), playerJson)
  }

  console.log('Generating metadata for ghost...')
  const ghostJson = generatePlayerSheetJson('ghost', 'ghost.png')
  writeJson(path.join(OUT_DIR, 'ghost.json'), ghostJson)

  console.log('Generating metadata for bullet...')
  const bulletJson = generateEffectSheetJson('bullet', 'bullet.png', 8, 3)
  writeJson(path.join(OUT_DIR, 'bullet.json'), bulletJson)

  console.log('Generating metadata for slash-effect...')
  const slashJson = generateEffectSheetJson('slash-effect', 'slash-effect.png', 32, 4)
  writeJson(path.join(OUT_DIR, 'slash-effect.json'), slashJson)

  console.log('Metadata generation complete.')
}

main()
