import type {
  AnimationMeta,
  AnimationName,
  PlayerColor,
  SpriteAssetManifest,
} from './sprite-data.js'

export const PLAYER_COLORS: readonly PlayerColor[] = ['red', 'blue', 'green', 'yellow'] as const

export const ANIMATION_META: Record<AnimationName, AnimationMeta> = {
  idle: { name: 'idle', frameCount: 10, loop: true, fps: 8, frameSize: { w: 48, h: 48 } },
  run: { name: 'run', frameCount: 8, loop: true, fps: 10, frameSize: { w: 48, h: 48 } },
  jump: { name: 'jump', frameCount: 6, loop: false, fps: 8, frameSize: { w: 48, h: 48 } },
  dash: { name: 'dash', frameCount: 9, loop: false, fps: 15, frameSize: { w: 48, h: 48 } },
  slash: { name: 'slash', frameCount: 6, loop: false, fps: 60, frameSize: { w: 64, h: 64 } },
  shoot: { name: 'shoot', frameCount: 10, loop: false, fps: 60, frameSize: { w: 48, h: 48 } },
  death: { name: 'death', frameCount: 10, loop: false, fps: 10, frameSize: { w: 48, h: 48 } },
} as const

export function getAssetManifest(basePath: string): SpriteAssetManifest {
  return {
    players: {
      red: { sheet: `${basePath}/player-red.json` },
      blue: { sheet: `${basePath}/player-blue.json` },
      green: { sheet: `${basePath}/player-green.json` },
      yellow: { sheet: `${basePath}/player-yellow.json` },
    },
    ghost: `${basePath}/ghost.json`,
    effects: {
      bullet: `${basePath}/bullet.json`,
      slashEffect: `${basePath}/slash-effect.json`,
    },
  }
}
