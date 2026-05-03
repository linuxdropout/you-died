import { Graphics, type Container } from 'pixi.js'
import type { Platform } from '@you-died/sim'

export function drawPlatforms(container: Container, platforms: Platform[]): void {
  const gfx = new Graphics()

  for (const p of platforms) {
    gfx.rect(p.x, p.y, p.width, p.height)
    gfx.fill({ color: 0x2a2a44 })

    gfx.rect(p.x, p.y, p.width, 2)
    gfx.fill({ color: 0x3e3e5e })
  }

  container.addChild(gfx)
}
