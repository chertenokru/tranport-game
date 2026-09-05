import { GameClock } from './GameClock'
import type { GameSystem } from './GameSystem'
import { GameWorld } from './GameWorld'

export class GameEngine {
  readonly world: GameWorld
  readonly clock: GameClock

  private readonly systems: readonly GameSystem[]
  private running = false

  constructor(world: GameWorld = new GameWorld(), systems: readonly GameSystem[] = []) {
    this.world = world
    this.clock = new GameClock()
    this.systems = [...systems]
  }

  get isRunning(): boolean {
    return this.running
  }

  start(): void {
    this.running = true
  }

  pause(): void {
    this.running = false
  }

  update(deltaSeconds: number): void {
    if (!this.running) {
      return
    }

    this.clock.advance(deltaSeconds)

    for (const system of this.systems) {
      system.update(this.world, deltaSeconds)
    }
  }

  reset(): void {
    this.pause()
    this.clock.reset()
    this.world.reset()
  }
}
