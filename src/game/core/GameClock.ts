export class GameClock {
  private elapsedSeconds = 0

  get elapsedTime(): number {
    return this.elapsedSeconds
  }

  advance(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError('Delta time must be a finite non-negative number')
    }

    this.elapsedSeconds += deltaSeconds
  }

  reset(): void {
    this.elapsedSeconds = 0
  }
}
