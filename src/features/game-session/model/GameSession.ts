import { GameEngine } from '@/game/core/GameEngine'

export interface GameSessionSnapshot {
  elapsedTimeSeconds: number
  money: number
  deliveredPassengers: number
  accidents: number
}

export class GameSession {
  readonly engine: GameEngine

  constructor(engine: GameEngine = new GameEngine()) {
    this.engine = engine
  }

  start(): void {
    this.engine.start()
  }

  pause(): void {
    this.engine.pause()
  }

  resume(): void {
    this.engine.start()
  }

  restart(): void {
    this.engine.reset()
    this.engine.start()
  }

  update(deltaSeconds: number): void {
    this.engine.update(deltaSeconds)
  }

  getSnapShot(): Readonly<GameSessionSnapshot> {
    const { clock, world } = this.engine
    return {
      elapsedTimeSeconds: clock.elapsedTime,
      money: world.money,
      deliveredPassengers: world.deliveredPassengers,
      accidents: world.accidents,
    }
  }

  dispose(): void {
    this.engine.reset()
  }
}
