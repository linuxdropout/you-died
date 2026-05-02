export class EntityPool<T> {
  private readonly pool: T[] = []
  private readonly factory: () => T
  private readonly resetFn: (item: T) => void

  constructor(factory: () => T, resetFn: (item: T) => void, initialSize = 0) {
    this.factory = factory
    this.resetFn = resetFn
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory())
    }
  }

  acquire(): T {
    const item = this.pool.pop()
    if (item !== undefined) return item
    return this.factory()
  }

  release(item: T) {
    this.resetFn(item)
    this.pool.push(item)
  }

  clear() {
    this.pool.length = 0
  }
}
