export class AudioContextGuard {
  private ctx: AudioContext | null = null
  private resumed = false
  private gestureHandler: (() => void) | null = null

  getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.listenForGesture()
    }
    return this.ctx
  }

  get ready(): boolean {
    return this.resumed && this.ctx?.state === 'running'
  }

  private listenForGesture(): void {
    this.gestureHandler = () => this.tryResume()
    for (const event of ['click', 'keydown', 'touchstart'] as const) {
      document.addEventListener(event, this.gestureHandler, { once: false, passive: true })
    }
    this.tryResume()
  }

  private tryResume(): void {
    if (!this.ctx || this.resumed) return
    if (this.ctx.state === 'running') {
      this.resumed = true
      this.removeGestureListeners()
      return
    }
    void this.ctx.resume().then(() => {
      if (this.ctx?.state === 'running') {
        this.resumed = true
        this.removeGestureListeners()
      }
    })
  }

  private removeGestureListeners(): void {
    if (!this.gestureHandler) return
    for (const event of ['click', 'keydown', 'touchstart'] as const) {
      document.removeEventListener(event, this.gestureHandler)
    }
    this.gestureHandler = null
  }

  destroy(): void {
    this.removeGestureListeners()
    if (this.ctx) {
      void this.ctx.close()
      this.ctx = null
    }
    this.resumed = false
  }
}
