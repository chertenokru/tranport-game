import { POPULATION_CONFIG, type PopulationConfig } from '@/game/config/population.config'
import type { GameSystem } from '@/game/core/GameSystem'
import type { GameWorld } from '@/game/core/GameWorld'
import { createResident } from '@/game/world/createResident'

export class PopulationSystem implements GameSystem {
  constructor(
    private readonly config: PopulationConfig = POPULATION_CONFIG,
    private readonly random: () => number = Math.random,
  ) {
    if (
      !Number.isFinite(config.cycleIntervalSeconds) ||
      config.cycleIntervalSeconds <= 0 ||
      !Number.isInteger(config.maxResidents) ||
      config.maxResidents < 0 ||
      !Number.isInteger(config.minGroupSize) ||
      config.minGroupSize < 2 ||
      !Number.isInteger(config.maxGroupSize) ||
      config.maxGroupSize < config.minGroupSize ||
      !Number.isFinite(config.groupProbability) ||
      config.groupProbability < 0 ||
      config.groupProbability > 1
    ) {
      throw new RangeError('Invalid population configuration')
    }
  }

  update(world: GameWorld, deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) return

    world.population.secondsUntilNextCycle -= deltaSeconds

    while (world.population.secondsUntilNextCycle <= 0) {
      world.population.secondsUntilNextCycle += this.config.cycleIntervalSeconds
      this.spawnResidents(world)
      this.assignDestinations(world)
    }
  }

  private spawnResidents(world: GameWorld): void {
    const availableSlots = this.config.maxResidents - world.residents.size
    const buildings = [...world.buildings.values()]
    if (availableSlots <= 0 || buildings.length === 0) return

    const groupSize =
      this.random() < this.config.groupProbability
        ? this.config.minGroupSize +
          Math.floor(this.random() * (this.config.maxGroupSize - this.config.minGroupSize + 1))
        : 1
    // A whole wave leaves the same building, as at the end of a working day.
    const origin = buildings[Math.floor(this.random() * buildings.length)]!

    for (let index = 0; index < Math.min(groupSize, availableSlots); index++) {
      let id: string
      do {
        id = `resident-${world.population.nextResidentId++}`
      } while (world.residents.has(id))
      world.residents.set(id, createResident(id, origin))
    }
  }

  private assignDestinations(world: GameWorld): void {
    for (const resident of world.residents.values()) {
      if (resident.state !== 'idleInBuilding' || resident.journey || !resident.currentBuildingId)
        continue

      // Until the pedestrian graph exists, every other building is reachable on foot.
      const destinations = [...world.buildings.values()].filter(
        (building) => building.id !== resident.currentBuildingId,
      )
      if (destinations.length === 0) continue

      const destination = destinations[Math.floor(this.random() * destinations.length)]!
      resident.journey = {
        originBuildingId: resident.currentBuildingId,
        destinationBuildingId: destination.id,
        transit: null,
      }
      resident.currentBuildingId = null
      resident.transportDecision = null
      resident.path = []
      resident.pathIndex = 0
      resident.state = 'choosingTransport'
    }
  }
}
