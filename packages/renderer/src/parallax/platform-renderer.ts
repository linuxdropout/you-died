import { Graphics, type Container } from 'pixi.js'
import type { Platform } from '@you-died/sim'

export function drawPlatforms(container: Container, platforms: Platform[]): void {
  const gfx = new Graphics()

  for (const p of platforms) {
    if (p.isWall) {
      gfx.rect(p.x, p.y, p.width, p.height)
      gfx.fill({ color: 0x3a3a54 })
      gfx.rect(p.x, p.y, p.width, 2)
      gfx.fill({ color: 0x4e4e6e })
    } else {
      gfx.rect(p.x, p.y, p.width, p.height)
      gfx.fill({ color: 0x2a2a44 })
      gfx.rect(p.x, p.y, p.width, 2)
      gfx.fill({ color: 0x3e3e5e })
    }
  }

  container.addChild(gfx)
}
