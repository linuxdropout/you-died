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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function generateSky(): PNG {
  const width = 128
  const height = 128
  const png = new PNG({ width, height, fill: true })

  const topR = 0x08, topG = 0x08, topB = 0x18
  const botR = 0x12, botG = 0x1e, botB = 0x2e

  for (let y = 0; y < height; y++) {
    const t = y / (height - 1)
    const r = Math.round(lerp(topR, botR, t))
    const g = Math.round(lerp(topG, botG, t))
    const b = Math.round(lerp(topB, botB, t))
    for (let x = 0; x < width; x++) {
      setPixel(png, x, y, r, g, b, 255)
    }
  }

  const rand = seededRandom(42)
  for (let i = 0; i < 35; i++) {
    const x = Math.floor(rand() * width)
    const y = Math.floor(rand() * (height * 0.7))
    const brightness = 0xa0 + Math.floor(rand() * 0x5f)
    const alpha = 120 + Math.floor(rand() * 135)
    setPixel(png, x, y, brightness, brightness, brightness + 0x10, alpha)
  }

  const moonX = 96
  const moonY = 20
  const moonR = 6
  for (let dy = -moonR; dy <= moonR; dy++) {
    for (let dx = -moonR; dx <= moonR; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= moonR) {
        const craterDist = Math.sqrt((dx - 2) * (dx - 2) + (dy + 1) * (dy + 1))
        if (craterDist > 3) {
          const shade = dist < moonR - 1 ? 0xd0 : 0xa0
          setPixel(png, moonX + dx, moonY + dy, shade, shade, shade - 0x10, 200)
        }
      }
    }
  }

  for (let dx = -moonR - 3; dx <= moonR + 3; dx++) {
    for (let dy = -moonR - 3; dy <= moonR + 3; dy++) {
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > moonR && dist <= moonR + 3) {
        const a = Math.round(40 * (1 - (dist - moonR) / 3))
        const px = moonX + dx
        const py = moonY + dy
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4
          const existing = png.data[idx + 3]
          if (existing < 200) {
            setPixel(png, px, py, 0x80, 0x80, 0x90, a + (existing || 0))
          }
        }
      }
    }
  }

  return png
}

function generateMountains(): PNG {
  const width = 256
  const height = 128
  const png = new PNG({ width, height, fill: true })

  for (let x = 0; x < width; x++) {
    const h1 = Math.sin(x * 0.018) * 35
    const h2 = Math.sin(x * 0.045 + 1.2) * 18
    const h3 = Math.sin(x * 0.09 + 2.8) * 8
    const mountainTop = Math.round(height - 55 - h1 - h2 - h3)

    for (let y = mountainTop; y < height; y++) {
      const depth = y - mountainTop
      const baseR = 0x18 + Math.min(depth, 20)
      const baseG = 0x14 + Math.min(depth, 15)
      const baseB = 0x30 + Math.min(depth, 25)
      const highlight = depth < 2 ? 0x10 : 0
      setPixel(png, x, y, baseR + highlight, baseG + highlight, baseB + highlight, 255)
    }
  }

  for (let x = 0; x < width; x++) {
    const h1 = Math.sin(x * 0.025 + 0.5) * 25
    const h2 = Math.sin(x * 0.06 + 3.0) * 12
    const h3 = Math.sin(x * 0.12 + 1.0) * 6
    const mountainTop = Math.round(height - 40 - h1 - h2 - h3)

    for (let y = mountainTop; y < height; y++) {
      const depth = y - mountainTop
      const baseR = 0x10 + Math.min(depth, 15)
      const baseG = 0x10 + Math.min(depth, 12)
      const baseB = 0x25 + Math.min(depth, 20)
      const highlight = depth < 2 ? 0x08 : 0
      setPixel(png, x, y, baseR + highlight, baseG + highlight, baseB + highlight, 255)
    }
  }

  return png
}

function generateTrees(): PNG {
  const width = 256
  const height = 128
  const png = new PNG({ width, height, fill: true })

  const baseY = height - 45

  for (let x = 0; x < width; x++) {
    const profile =
      Math.sin(x * 0.04) * 12 +
      Math.sin(x * 0.09 + 2.0) * 8 +
      Math.sin(x * 0.17 + 0.5) * 5 +
      Math.sin(x * 0.31 + 1.3) * 3
    const treeTop = Math.round(baseY - 25 - profile)

    for (let y = treeTop; y < height; y++) {
      const depth = y - treeTop
      const r = 0x0c + Math.min(depth >> 2, 8)
      const g = 0x1c + Math.min(depth >> 1, 14)
      const b = 0x0c + Math.min(depth >> 2, 6)
      const highlight = depth < 2 ? 0x06 : 0
      setPixel(png, x, y, r + highlight, g + highlight, b + highlight, 255)
    }
  }

  return png
}

function generateFoliage(): PNG {
  const width = 256
  const height = 96
  const png = new PNG({ width, height, fill: true })
  const rand = seededRandom(271)

  const groundY = height - 20

  for (let x = 0; x < width; x++) {
    for (let y = groundY; y < height; y++) {
      const depth = y - groundY
      const r = 0x0c + Math.min(depth, 8)
      const g = 0x18 + Math.min(depth, 10)
      const b = 0x10 + Math.min(depth, 6)
      setPixel(png, x, y, r, g, b, 255)
    }
  }

  for (let i = 0; i < 22; i++) {
    const cx = Math.floor(rand() * width)
    const bushW = 6 + Math.floor(rand() * 14)
    const bushH = 5 + Math.floor(rand() * 10)

    for (let dy = 0; dy < bushH; dy++) {
      const t = dy / bushH
      const layerW = Math.round(bushW * (1 - t * 0.5))
      for (let dx = -layerW; dx <= layerW; dx++) {
        const px = ((cx + dx) % width + width) % width
        const py = groundY - dy
        if (py >= 0) {
          const v = Math.floor(rand() * 4)
          const r = 0x10 + v * 2
          const g = 0x24 + v * 4
          const b = 0x12 + v * 2
          setPixel(png, px, py, r, g, b, 255)
        }
      }
    }
  }

  for (let x = 0; x < width; x++) {
    if (rand() < 0.3) {
      const bladeH = 3 + Math.floor(rand() * 5)
      for (let dy = 0; dy < bladeH; dy++) {
        const py = groundY - dy
        if (py >= 0) {
          const g = 0x2a + Math.floor(rand() * 0x15)
          setPixel(png, x, py, 0x12, g, 0x10, 200)
        }
      }
    }
  }

  const creekY = groundY + 4
  for (let x = 0; x < width; x++) {
    const wave = Math.sin(x * 0.08) * 2
    const cy = Math.round(creekY + wave)
    for (let dy = -2; dy <= 2; dy++) {
      const py = cy + dy
      if (py >= 0 && py < height) {
        const distFromCenter = Math.abs(dy)
        const r = 0x10 + distFromCenter * 4
        const g = 0x20 + distFromCenter * 6
        const b = 0x35 + distFromCenter * 8
        const a = distFromCenter === 2 ? 150 : 200
        setPixel(png, x, py, r, g, b, a)
      }
    }
    if (x % 12 < 3) {
      setPixel(png, x, cy, 0x30, 0x50, 0x60, 180)
    }
  }

  return png
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('Generating sky background...')
  const sky = generateSky()
  fs.writeFileSync(path.join(OUT_DIR, 'bg-sky.png'), PNG.sync.write(sky))

  console.log('Generating mountain background...')
  const mountains = generateMountains()
  fs.writeFileSync(path.join(OUT_DIR, 'bg-mountains.png'), PNG.sync.write(mountains))

  console.log('Generating tree background...')
  const trees = generateTrees()
  fs.writeFileSync(path.join(OUT_DIR, 'bg-trees.png'), PNG.sync.write(trees))

  console.log('Generating foliage background...')
  const foliage = generateFoliage()
  fs.writeFileSync(path.join(OUT_DIR, 'bg-foliage.png'), PNG.sync.write(foliage))

  console.log('Background generation complete.')
}

main()
