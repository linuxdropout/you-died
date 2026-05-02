export type AnimationName = 'idle' | 'run' | 'jump' | 'dash' | 'slash' | 'shoot' | 'death'

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow'

export interface AnimationMeta {
  readonly name: AnimationName
  readonly frameCount: number
  readonly loop: boolean
  readonly fps: number
  readonly frameSize: { readonly w: number; readonly h: number }
}

export interface SpriteAssetManifest {
  readonly players: Record<PlayerColor, { readonly sheet: string }>
  readonly ghost: string
  readonly effects: {
    readonly bullet: string
    readonly slashEffect: string
  }
}
