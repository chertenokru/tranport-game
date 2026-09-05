import type { GameWorld } from './GameWorld'

export interface GameSystem {
  update(world: GameWorld, deltaSeconds: number): void
}
