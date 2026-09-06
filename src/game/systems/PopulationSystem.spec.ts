import { describe, expect, it } from 'vitest'
import { POPULATION_CONFIG, type PopulationConfig } from '@/game/config/population.config'
import { GAME_CONFIG } from '@/game/config/game.config'
import { GameEngine } from '@/game/core/GameEngine'
import { createVerticalSliceWorld } from '@/game/world/MapFactory'
import { createResident } from '@/game/world/createResident'
import { PopulationSystem } from './PopulationSystem'
import { ResidentArrivalSystem } from './ResidentArrivalSystem'
import { RoutePlanningSystem } from './routePlanning/RoutePlanningSystem.ts'
import { PedestrianMovementSystem } from './PedestrianMovementSystem'
import { EconomySystem } from './EconomySystem'
import { ResidentState } from '@/game/domain/Resident'
import { getBuildingEntrance } from '@/game/tools/getBuildingEntrance.ts'

function config(overrides: Partial<PopulationConfig> = {}): PopulationConfig {
  return { ...POPULATION_CONFIG, cycleIntervalSeconds: 10, groupProbability: 0, ...overrides }
}

describe('PopulationSystem', () => {
  it('spawns one resident at startup and on each cycle, selecting a different building', () => {
    const world = createVerticalSliceWorld()
    const system = new PopulationSystem(config(), () => 0)

    system.update(world, 0)
    expect(world.residents.size).toBe(1)
    const resident = world.residents.get('resident-1')!
    expect(resident).toMatchObject({
      currentBuildingId: null,
      state: ResidentState.ChoosingTransport,
      journey: {
        originBuildingId: 'building-house',
        destinationBuildingId: 'building-office',
        transit: null,
      },
      position: getBuildingEntrance(world.buildings.get('building-house')!),
    })
    system.update(world, 9)
    expect(world.residents.size).toBe(1)
    system.update(world, 1)
    expect(world.residents.size).toBe(2)
    system.update(world, 20)
    expect(world.residents.size).toBe(4)
    expect(world.residents.get('resident-1')).toBe(resident)
  })

  it('spawns a group from one randomly selected building and respects the total cap', () => {
    const world = createVerticalSliceWorld()
    const system = new PopulationSystem(
      config({ groupProbability: 1, minGroupSize: 5, maxGroupSize: 8, maxResidents: 10 }),
      () => 0.99,
    )
    system.update(world, 0)
    expect(world.residents.size).toBe(8)
    for (const resident of world.residents.values()) {
      expect(resident.journey?.originBuildingId).toBe('building-office')
      expect(resident.journey?.destinationBuildingId).toBe('building-house')
    }
    system.update(world, 10)
    expect(world.residents.size).toBe(10)
    system.update(world, 100)
    expect(world.residents.size).toBe(10)
  })

  it('keeps residents without a destination inside and includes them in the cap', () => {
    const world = createVerticalSliceWorld()
    const office = world.buildings.get('building-office')!
    world.buildings.delete(office.id)
    const system = new PopulationSystem(config({ maxResidents: 2 }), () => 0)
    system.update(world, 20)
    expect(world.residents.size).toBe(2)
    for (const resident of world.residents.values()) {
      expect(resident.state).toBe(ResidentState.IdleInBuilding)
      expect(resident.currentBuildingId).toBe('building-house')
      expect(resident.journey).toBeNull()
    }
    world.buildings.set(office.id, office)
    system.update(world, 10)
    expect(world.residents.size).toBe(2)
    for (const resident of world.residents.values()) {
      expect(resident.journey?.destinationBuildingId).toBe(office.id)
    }
  })

  it('handles an empty map and a disabled spawn limit', () => {
    const world = createVerticalSliceWorld()
    const system = new PopulationSystem(config(), () => 0)
    world.buildings.clear()
    system.update(world, 30)
    expect(world.residents.size).toBe(0)
    const disabled = new PopulationSystem(config({ maxResidents: 0 }), () => 0)
    const populatedMap = createVerticalSliceWorld()
    disabled.update(populatedMap, 30)
    expect(populatedMap.residents.size).toBe(0)
  })

  it('pauses generation and resets timers and IDs with the world', () => {
    const world = createVerticalSliceWorld()
    const system = new PopulationSystem(config(), () => 0)
    const engine = new GameEngine(world, [system])
    engine.start()
    engine.update(4)
    engine.pause()
    engine.update(100)
    expect(world.residents.size).toBe(1)
    expect(world.population.secondsUntilNextCycle).toBe(6)
    engine.start()
    engine.update(6)
    expect(world.residents.size).toBe(2)
    engine.reset()
    engine.start()
    engine.update(0)
    expect([...world.residents.keys()]).toEqual(['resident-1'])
    engine.replaceWorld(createVerticalSliceWorld())
    engine.start()
    engine.update(0)
    expect([...engine.world.residents.keys()]).toEqual(['resident-1'])
  })

  it('lets each member of a group choose its own target', () => {
    const world = createVerticalSliceWorld()
    const office = world.buildings.get('building-office')!
    world.buildings.set('another-office', { ...office, id: 'another-office' })
    const draws = [0, 0, 0, 0, 0.99]
    const system = new PopulationSystem(
      config({ groupProbability: 1, minGroupSize: 2, maxGroupSize: 2 }),
      () => draws.shift() ?? 0,
    )
    system.update(world, 0)
    expect(
      [...world.residents.values()].map((resident) => resident.journey?.destinationBuildingId),
    ).toEqual(['building-office', 'another-office'])
  })

  it('creates an inactive resident without a preassigned journey', () => {
    const world = createVerticalSliceWorld()
    const resident = createResident('test', world.buildings.get('building-house')!)
    expect(resident.state).toBe(ResidentState.IdleInBuilding)
    expect(resident.currentBuildingId).toBe('building-house')
    expect(resident.journey).toBeNull()
    expect(resident.transportDecision).toBeNull()
  })
})

describe('Resident lifecycle', () => {
  function simulation(retentionProbability: number) {
    const world = createVerticalSliceWorld()
    world.buses.clear()
    const engine = new GameEngine(world, [
      new PopulationSystem(config({ maxResidents: 1, cycleIntervalSeconds: 30 }), () => 0),
      new RoutePlanningSystem(),
      new PedestrianMovementSystem(),
      new EconomySystem(),
      new ResidentArrivalSystem(retentionProbability, () => 0.5),
    ])
    engine.start()
    engine.update(0)
    return engine
  }

  it('keeps the same resident for a return journey on the next cycle and rewards each arrival once', () => {
    const engine = simulation(1)
    const world = engine.world
    const resident = world.residents.get('resident-1')!
    for (let step = 0; step < 180; step++) engine.update(0.1)
    expect(resident.state).toBe(ResidentState.IdleInBuilding)
    expect(resident.currentBuildingId).toBe('building-office')
    expect(resident.position).toEqual(getBuildingEntrance(world.buildings.get('building-office')!))
    expect(resident.journey).toBeNull()
    expect(resident.transportDecision).toBeNull()
    expect(world.deliveredPassengers).toBe(1)
    for (let step = 0; step < 110; step++) engine.update(0.1)
    expect(resident.state).toBe(ResidentState.IdleInBuilding)
    expect(world.deliveredPassengers).toBe(1)
    for (let step = 0; step < 20; step++) engine.update(0.1)
    expect(world.residents.get(resident.id)).toBe(resident)
    expect(resident.currentBuildingId).toBeNull()
    expect(resident.journey).toMatchObject({
      originBuildingId: 'building-office',
      destinationBuildingId: 'building-house',
    })
    for (let step = 0; step < 180; step++) engine.update(0.1)
    expect(resident.currentBuildingId).toBe('building-house')
    expect(world.deliveredPassengers).toBe(2)
    expect(world.money).toBe(
      GAME_CONFIG.economy.startingMoney + 2 * GAME_CONFIG.economy.passengerDeliveredReward,
    )
  })

  it('removes a resident only after arrival and reuses the freed capacity with a new ID', () => {
    const engine = simulation(0)
    const world = engine.world
    for (let step = 0; step < 100; step++) engine.update(0.1)
    expect(world.residents.has('resident-1')).toBe(true)
    for (let step = 0; step < 80; step++) engine.update(0.1)
    expect(world.residents.size).toBe(0)
    expect(world.deliveredPassengers).toBe(1)
    for (let step = 0; step < 130; step++) engine.update(0.1)
    expect([...world.residents.keys()]).toEqual(['resident-2'])
    expect(world.deliveredPassengers).toBe(1)
  })
})
