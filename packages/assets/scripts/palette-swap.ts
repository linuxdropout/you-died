import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const SRC_DIR = path.resolve(import.meta.dirname, '../src/2D-Pixel-Art-Character-Template')
const OUT_DIR = path.resolve(import.meta.dirname, '../sprites')

interface ColorMap {
  [sourceHex: string]: string
}

const SOURCE_COLORS = {
  head: '#5fcde4',
  bodyLight: '#ce5050',
  bodyDark: '#ac3232',
  detailLight: '#df7126',
  detailDark: '#b35b20',
  legsLight: '#fbf236',
  legsDark: '#d1cc60',
  armsLight: '#99e550',
  armsDark: '#6abe30',
  weaponLight: '#af1ab2',
  weaponDark: '#951799',
} as const

const PLAYER_PALETTES: Record<string, ColorMap> = {
  red: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#e63946',
    [SOURCE_COLORS.bodyDark]: '#a8201a',
    [SOURCE_COLORS.detailLight]: '#ff6b6b',
    [SOURCE_COLORS.detailDark]: '#c92a2a',
    [SOURCE_COLORS.legsLight]: '#e63946',
    [SOURCE_COLORS.legsDark]: '#a8201a',
    [SOURCE_COLORS.armsLight]: '#ff8787',
    [SOURCE_COLORS.armsDark]: '#e03131',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  blue: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#457b9d',
    [SOURCE_COLORS.bodyDark]: '#1d3557',
    [SOURCE_COLORS.detailLight]: '#74b9d8',
    [SOURCE_COLORS.detailDark]: '#2b5c7e',
    [SOURCE_COLORS.legsLight]: '#457b9d',
    [SOURCE_COLORS.legsDark]: '#1d3557',
    [SOURCE_COLORS.armsLight]: '#a8dadc',
    [SOURCE_COLORS.armsDark]: '#5fa8c8',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  green: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#2a9d8f',
    [SOURCE_COLORS.bodyDark]: '#1a6b5f',
    [SOURCE_COLORS.detailLight]: '#52c7b8',
    [SOURCE_COLORS.detailDark]: '#21867a',
    [SOURCE_COLORS.legsLight]: '#2a9d8f',
    [SOURCE_COLORS.legsDark]: '#1a6b5f',
    [SOURCE_COLORS.armsLight]: '#76d7c4',
    [SOURCE_COLORS.armsDark]: '#3db89e',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  yellow: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#e9c46a',
    [SOURCE_COLORS.bodyDark]: '#c87f2a',
    [SOURCE_COLORS.detailLight]: '#f4e285',
    [SOURCE_COLORS.detailDark]: '#d9a436',
    [SOURCE_COLORS.legsLight]: '#e9c46a',
    [SOURCE_COLORS.legsDark]: '#c87f2a',
    [SOURCE_COLORS.armsLight]: '#f7e8a4',
    [SOURCE_COLORS.armsDark]: '#e0b44c',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  purple: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#7b2d8e',
    [SOURCE_COLORS.bodyDark]: '#5a1d6b',
    [SOURCE_COLORS.detailLight]: '#a855c7',
    [SOURCE_COLORS.detailDark]: '#8634a1',
    [SOURCE_COLORS.legsLight]: '#7b2d8e',
    [SOURCE_COLORS.legsDark]: '#5a1d6b',
    [SOURCE_COLORS.armsLight]: '#c084e0',
    [SOURCE_COLORS.armsDark]: '#9445b5',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  orange: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#e87620',
    [SOURCE_COLORS.bodyDark]: '#b85a10',
    [SOURCE_COLORS.detailLight]: '#ff9a44',
    [SOURCE_COLORS.detailDark]: '#d46820',
    [SOURCE_COLORS.legsLight]: '#e87620',
    [SOURCE_COLORS.legsDark]: '#b85a10',
    [SOURCE_COLORS.armsLight]: '#ffb870',
    [SOURCE_COLORS.armsDark]: '#e88838',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  pink: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#e05090',
    [SOURCE_COLORS.bodyDark]: '#b03070',
    [SOURCE_COLORS.detailLight]: '#f07ab0',
    [SOURCE_COLORS.detailDark]: '#d04888',
    [SOURCE_COLORS.legsLight]: '#e05090',
    [SOURCE_COLORS.legsDark]: '#b03070',
    [SOURCE_COLORS.armsLight]: '#f4a0c4',
    [SOURCE_COLORS.armsDark]: '#e060a0',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  cyan: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#20b2c8',
    [SOURCE_COLORS.bodyDark]: '#108898',
    [SOURCE_COLORS.detailLight]: '#50d0e0',
    [SOURCE_COLORS.detailDark]: '#18a0b0',
    [SOURCE_COLORS.legsLight]: '#20b2c8',
    [SOURCE_COLORS.legsDark]: '#108898',
    [SOURCE_COLORS.armsLight]: '#80e0f0',
    [SOURCE_COLORS.armsDark]: '#38c0d4',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  white: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#d8d8e0',
    [SOURCE_COLORS.bodyDark]: '#a0a0b0',
    [SOURCE_COLORS.detailLight]: '#f0f0f4',
    [SOURCE_COLORS.detailDark]: '#c0c0cc',
    [SOURCE_COLORS.legsLight]: '#d8d8e0',
    [SOURCE_COLORS.legsDark]: '#a0a0b0',
    [SOURCE_COLORS.armsLight]: '#ececf0',
    [SOURCE_COLORS.armsDark]: '#c8c8d4',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  brown: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#8b5e3c',
    [SOURCE_COLORS.bodyDark]: '#5e3a20',
    [SOURCE_COLORS.detailLight]: '#b07850',
    [SOURCE_COLORS.detailDark]: '#7a5030',
    [SOURCE_COLORS.legsLight]: '#8b5e3c',
    [SOURCE_COLORS.legsDark]: '#5e3a20',
    [SOURCE_COLORS.armsLight]: '#c89870',
    [SOURCE_COLORS.armsDark]: '#a06840',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  lime: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#80c020',
    [SOURCE_COLORS.bodyDark]: '#5a9010',
    [SOURCE_COLORS.detailLight]: '#a0e040',
    [SOURCE_COLORS.detailDark]: '#70b018',
    [SOURCE_COLORS.legsLight]: '#80c020',
    [SOURCE_COLORS.legsDark]: '#5a9010',
    [SOURCE_COLORS.armsLight]: '#b8e060',
    [SOURCE_COLORS.armsDark]: '#90d030',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
  teal: {
    [SOURCE_COLORS.head]: '#f4d9a0',
    [SOURCE_COLORS.bodyLight]: '#208070',
    [SOURCE_COLORS.bodyDark]: '#105848',
    [SOURCE_COLORS.detailLight]: '#40a890',
    [SOURCE_COLORS.detailDark]: '#187860',
    [SOURCE_COLORS.legsLight]: '#208070',
    [SOURCE_COLORS.legsDark]: '#105848',
    [SOURCE_COLORS.armsLight]: '#60c0a8',
    [SOURCE_COLORS.armsDark]: '#309880',
    [SOURCE_COLORS.weaponLight]: '#ffffff',
    [SOURCE_COLORS.weaponDark]: '#dee2e6',
  },
}

const GHOST_PALETTE: ColorMap = Object.fromEntries(
  Object.values(SOURCE_COLORS).map((c) => [c, '#8ecae6']),
)
GHOST_PALETTE[SOURCE_COLORS.bodyDark] = '#5fa8d3'
GHOST_PALETTE[SOURCE_COLORS.detailDark] = '#5fa8d3'
GHOST_PALETTE[SOURCE_COLORS.legsDark] = '#5fa8d3'
GHOST_PALETTE[SOURCE_COLORS.armsDark] = '#5fa8d3'
GHOST_PALETTE[SOURCE_COLORS.weaponDark] = '#5fa8d3'
GHOST_PALETTE[SOURCE_COLORS.head] = '#bde0fe'

const GHOST_ALPHA = 80

const ANIMATION_SOURCES: Record<string, { file: string; frameSize: number }> = {
  idle: { file: 'Idle/Player Idle 48x48.png', frameSize: 48 },
  run: { file: 'Run/player run 48x48.png', frameSize: 48 },
  jump: { file: 'Jump/player new jump 48x48.png', frameSize: 48 },
  dash: { file: 'Dash/dash.png', frameSize: 48 },
  slash: { file: 'Sword Attack/player sword atk 64x64.png', frameSize: 64 },
  shoot: { file: 'Shooting (two-handed)/player shoot 2H 48x48.png', frameSize: 48 },
  death: { file: 'Death/Player Death 64x64.png', frameSize: 48 },
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function buildRgbMap(colorMap: ColorMap): Map<string, [number, number, number]> {
  const map = new Map<string, [number, number, number]>()
  for (const [src, dst] of Object.entries(colorMap)) {
    map.set(src, hexToRgb(dst))
  }
  return map
}

function applyPalette(src: PNG, colorMap: ColorMap, alpha?: number): PNG {
  const dst = new PNG({ width: src.width, height: src.height })
  const rgbMap = buildRgbMap(colorMap)

  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const idx = (y * src.width + x) * 4
      const r = src.data[idx]
      const g = src.data[idx + 1]
      const b = src.data[idx + 2]
      const a = src.data[idx + 3]

      if (a === 0) {
        dst.data[idx] = 0
        dst.data[idx + 1] = 0
        dst.data[idx + 2] = 0
        dst.data[idx + 3] = 0
        continue
      }

      const hex = rgbToHex(r, g, b)
      const replacement = rgbMap.get(hex)

      if (replacement) {
        dst.data[idx] = replacement[0]
        dst.data[idx + 1] = replacement[1]
        dst.data[idx + 2] = replacement[2]
      } else {
        dst.data[idx] = r
        dst.data[idx + 1] = g
        dst.data[idx + 2] = b
      }
      dst.data[idx + 3] = alpha ?? a
    }
  }

  return dst
}

function readPng(filePath: string): PNG {
  const buffer = fs.readFileSync(filePath)
  return PNG.sync.read(buffer)
}

function writePng(filePath: string, png: PNG): void {
  const buffer = PNG.sync.write(png)
  fs.writeFileSync(filePath, buffer)
}

function combineSheets(sheets: { png: PNG; frameWidth: number; frameHeight: number }[]): {
  png: PNG
  layout: { anim: string; x: number; y: number; w: number; h: number; frames: number }[]
} {
  const maxFrameWidth = Math.max(...sheets.map((s) => s.frameWidth))
  const totalFrames = sheets.reduce((sum, s) => sum + s.png.width / s.frameWidth, 0)
  const cols = 10
  const rows = Math.ceil(totalFrames / cols)
  const maxFrameHeight = Math.max(...sheets.map((s) => s.frameHeight))

  const atlasW = cols * maxFrameWidth
  const atlasH = rows * maxFrameHeight
  const atlas = new PNG({ width: atlasW, height: atlasH, fill: true })

  const layout: { anim: string; x: number; y: number; w: number; h: number; frames: number }[] = []
  let frameIdx = 0

  for (const sheet of sheets) {
    const numFrames = sheet.png.width / sheet.frameWidth
    const animStartIdx = frameIdx

    for (let f = 0; f < numFrames; f++) {
      const col = frameIdx % cols
      const row = Math.floor(frameIdx / cols)
      const dstX = col * maxFrameWidth
      const dstY = row * maxFrameHeight
      const srcX = f * sheet.frameWidth

      for (let py = 0; py < sheet.frameHeight; py++) {
        for (let px = 0; px < sheet.frameWidth; px++) {
          const si = (py * sheet.png.width + (srcX + px)) * 4
          const di = ((dstY + py) * atlasW + (dstX + px)) * 4
          atlas.data[di] = sheet.png.data[si]
          atlas.data[di + 1] = sheet.png.data[si + 1]
          atlas.data[di + 2] = sheet.png.data[si + 2]
          atlas.data[di + 3] = sheet.png.data[si + 3]
        }
      }
      frameIdx++
    }

    layout.push({
      anim: '',
      x: animStartIdx,
      y: 0,
      w: sheet.frameWidth,
      h: sheet.frameHeight,
      frames: numFrames,
    })
  }

  return { png: atlas, layout }
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const animNames = Object.keys(ANIMATION_SOURCES) as (keyof typeof ANIMATION_SOURCES)[]
  const sourcePngs: { name: string; png: PNG; frameWidth: number; frameHeight: number }[] = []

  for (const anim of animNames) {
    const { file, frameSize } = ANIMATION_SOURCES[anim]
    const filePath = path.join(SRC_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.error(`Missing: ${filePath}`)
      process.exit(1)
    }
    const png = readPng(filePath)
    const frameHeight = png.height
    sourcePngs.push({ name: anim, png, frameWidth: frameSize, frameHeight })
  }

  for (const [color, palette] of Object.entries(PLAYER_PALETTES)) {
    console.log(`Generating player-${color}...`)

    const swappedSheets = sourcePngs.map((s) => ({
      png: applyPalette(s.png, palette),
      frameWidth: s.frameWidth,
      frameHeight: s.frameHeight,
    }))

    const { png: atlas } = combineSheets(swappedSheets)
    writePng(path.join(OUT_DIR, `player-${color}.png`), atlas)
  }

  console.log('Generating ghost...')
  const ghostSheets = sourcePngs.map((s) => ({
    png: applyPalette(s.png, GHOST_PALETTE, GHOST_ALPHA),
    frameWidth: s.frameWidth,
    frameHeight: s.frameHeight,
  }))
  const { png: ghostAtlas } = combineSheets(ghostSheets)
  writePng(path.join(OUT_DIR, 'ghost.png'), ghostAtlas)

  console.log('Palette swap complete.')
}

main()
