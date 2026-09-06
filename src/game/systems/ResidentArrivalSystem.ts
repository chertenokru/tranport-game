import { POPULATION_CONFIG } from '@/game/config/population.config'
import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'

// Runs after EconomySystem has accounted for the completed journey.
export class ResidentArrivalSystem implements GameSystem {
  constructor(
    private readonly retentionProbability: number = POPULATION_CONFIG.retentionProbability,
    private readonly random: () => number = Math.random,
  ) {
    if (
      !Number.isFinite(retentionProbability) ||
      retentionProbability < 0 ||
      retentionProbability > 1
    ) {
      throw new RangeError('Invalid resident retention probability')
    }
  }

  update(world: GameWorld, deltaSeconds: number): void {
    void deltaSeconds
    for (const resident of world.residents.values()) {
      if (resident.state !== 'idleInBuilding' || !resident.journey) continue

      resident.currentBuildingId = resident.journey.destinationBuildingId
      resident.journey = null
      resident.transportDecision = null
      resident.path = []
      resident.pathIndex = 0

      if (this.random() >= this.retentionProbability) {
        world.residents.delete(resident.id)
      }
    }
  }
}
