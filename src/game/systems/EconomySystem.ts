import type { GameSystem } from '@/game/core/GameSystem.ts'
import type { GameWorld } from '@/game/core/GameWorld.ts'
import { GAME_CONFIG } from '@/game/config/game.config.ts'

export class EconomySystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    void deltaSeconds

    for (const pedestrian of world.pedestrians.values()) {
      if (pedestrian.state !== 'arrived') {
        continue
      }

      world.money += GAME_CONFIG.economy.passengerDeliveredReward
      world.deliveredPassengers += 1

      pedestrian.state = 'idleInBuilding'
    }
  }
}
