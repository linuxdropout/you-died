import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const OUT_DIR = path.resolve(import.meta.dirname, '../sprites')

function setPixel(png: PNG, x: number, y: number, r: number, g: number, b: number, a: number) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return
  const idx = (y * png.width + x) * 4
  png.data[idx] = r
  png.data[idx + 1] = g
  png.data[idx + 2] = b
  png.data[idx + 3] = a
}

function generateBullet(): PNG {
  const frameW = 8
  const frameH = 8
  const frames = 3
  const png = new PNG({ width: frameW * frames, height: frameH, fill: true })

  const core = [0xff, 0xbe, 0x0b] as const
  const edge = [0xfb, 0x56, 0x07] as const
  const glow = [0xff, 0xe0, 0x66] as const

  for (let f = 0; f < frames; f++) {
    const ox = f * frameW
    const coreSize = f === 1 ? 3 : 2
    const cx = ox + 3
    const cy = 3

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 2) {
          setPixel(png, cx + dx, cy + dy, ...edge, 200)
        }
      }
    }

    for (let dy = 0; dy < coreSize; dy++) {
      for (let dx = 0; dx < coreSize; dx++) {
        setPixel(
          png,
          cx - Math.floor(coreSize / 2) + dx,
          cy - Math.floor(coreSize / 2) + dy,
          ...core,
          255,
        )
      }
    }

    if (f === 1) {
      setPixel(png, cx - 3, cy, ...glow, 100)
      setPixel(png, cx + 3, cy, ...glow, 100)
      setPixel(png, cx, cy - 3, ...glow, 100)
      setPixel(png, cx, cy + 3, ...glow, 100)
    }

    if (f === 2) {
      setPixel(png, cx - 2, cy - 2, ...glow, 80)
      setPixel(png, cx + 2, cy - 2, ...glow, 80)
      setPixel(png, cx - 2, cy + 2, ...glow, 80)
      setPixel(png, cx + 2, cy + 2, ...glow, 80)
    }
  }

  return png
}

function generateSlashEffect(): PNG {
  const frameW = 32
  const frameH = 32
  const frames = 4
  const png = new PNG({ width: frameW * frames, height: frameH, fill: true })

  const white = [0xff, 0xff, 0xff] as const
  const light = [0xdd, 0xdd, 0xff] as const

  for (let f = 0; f < frames; f++) {
    const ox = f * frameW
    const cx = ox + 16
    const cy = 16
    const startAngle = -Math.PI * 0.4 + f * Math.PI * 0.3
    const sweep = Math.PI * 0.5
    const radius = 10 + f
    const alpha = Math.round(255 * (1 - f * 0.2))

    for (let a = 0; a < 40; a++) {
      const angle = startAngle + (a / 40) * sweep
      const r = radius

      const x = Math.round(cx + Math.cos(angle) * r)
      const y = Math.round(cy + Math.sin(angle) * r)
      setPixel(png, x, y, ...white, alpha)

      const x2 = Math.round(cx + Math.cos(angle) * (r - 1))
      const y2 = Math.round(cy + Math.sin(angle) * (r - 1))
      setPixel(png, x2, y2, ...white, alpha)

      const x3 = Math.round(cx + Math.cos(angle) * (r + 1))
      const y3 = Math.round(cy + Math.sin(angle) * (r + 1))
      setPixel(png, x3, y3, ...light, Math.round(alpha * 0.6))
    }
  }

  return png
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('Generating bullet sprite...')
  const bullet = generateBullet()
  fs.writeFileSync(path.join(OUT_DIR, 'bullet.png'), PNG.sync.write(bullet))

  console.log('Generating slash effect sprite...')
  const slash = generateSlashEffect()
  fs.writeFileSync(path.join(OUT_DIR, 'slash-effect.png'), PNG.sync.write(slash))

  console.log('Effects generation complete.')
}

main()
