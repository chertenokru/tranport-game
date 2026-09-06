import type { GameSystem } from '@/game/core/GameSystem.ts'
import type { GameWorld } from '@/game/core/GameWorld.ts'
import { GAME_CONFIG } from '@/game/config/game.config.ts'
import { ResidentState } from '@/game/domain/Resident'

export class EconomySystem implements GameSystem {
  update(world: GameWorld, deltaSeconds: number): void {
    void deltaSeconds

    for (const resident of world.residents.values()) {
      if (resident.state !== ResidentState.Arrived) {
        continue
      }

      world.money += GAME_CONFIG.economy.passengerDeliveredReward
      world.deliveredPassengers += 1

      resident.state = ResidentState.IdleInBuilding
    }
  }
}
