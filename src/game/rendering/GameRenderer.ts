import type { GameWorld } from '@/game/core/GameWorld'

export interface GameRenderer {
  render(world: GameWorld): void
}
