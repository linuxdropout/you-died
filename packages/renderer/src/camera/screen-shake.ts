const DECAY = 0.9
const THRESHOLD = 0.5

export class ScreenShake {
  private intensity = 0
  offsetX = 0
  offsetY = 0

  trigger(intensity: number) {
    this.intensity += intensity
  }

  update() {
    if (this.intensity < THRESHOLD) {
      this.intensity = 0
      this.offsetX = 0
      this.offsetY = 0
      return
    }

    this.offsetX = (Math.random() * 2 - 1) * this.intensity
    this.offsetY = (Math.random() * 2 - 1) * this.intensity
    this.intensity *= DECAY
  }

  reset() {
    this.intensity = 0
    this.offsetX = 0
    this.offsetY = 0
  }
}
