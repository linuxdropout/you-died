import { ColorMatrixFilter, type Container } from 'pixi.js'

const DURATION = 60
const HUE_SPEED = 60

export class ParadoxEffect {
  private readonly target: Container
  private active = false
  private timer = 0
  private filter = new ColorMatrixFilter()

  constructor(target: Container) {
    this.target = target
  }

  start() {
    this.active = true
    this.timer = DURATION
    const filters = this.target.filters
    if (!filters || filters.length === 0) {
      this.target.filters = [this.filter]
    } else if (!filters.includes(this.filter)) {
      this.target.filters = [...filters, this.filter]
    }
  }

  update() {
    if (!this.active) return

    this.timer--
    const progress = 1 - this.timer / DURATION

    this.filter.reset()
    this.filter.hue(Math.sin((this.timer * HUE_SPEED * Math.PI) / 180) * 60, false)
    this.filter.saturate(0.5, false)
    const flashPhase = this.timer > DURATION - 10 ? 1.3 - (DURATION - this.timer) * 0.03 : 1.0
    this.filter.brightness(flashPhase, false)
    this.filter.alpha = 1 - progress * 0.5

    if (this.timer <= 0) {
      this.active = false
      this.filter.reset()
      this.removeFilter()
    }
  }

  private removeFilter() {
    const filters = this.target.filters
    if (!filters || filters.length === 0) return
    this.target.filters = filters.filter((f) => f !== this.filter)
    if (this.target.filters!.length === 0) this.target.filters = null
  }

  reset() {
    this.active = false
    this.timer = 0
    this.filter.reset()
    this.removeFilter()
  }
}
