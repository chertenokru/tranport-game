import { describe, expect, it, vi } from 'vitest'

import { createWorldWithResident } from '@/game/testing/createWorldWithResident.ts'
import { ResidentState } from '@/game/domain/Resident.ts'
import { TransportDecisionReason, TransportMode } from '@/game/domain/TransportDecision.ts'

import { RoutePlanningSystem } from './RoutePlanningSystem.ts'
import { getBuildingEntrance } from '@/game/tools/getBuildingEntrance.ts'

// Времена в тестах жизненного цикла рассчитаны на скорость 40.
// Изменения игрового баланса не должны менять условия этих тестов.
vi.mock('@/game/config/pedestrians.config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/game/config/pedestrians.config')>()

  return {
    ...actual,
    PEDESTRIANS_CONFIG: {
      ...actual.PEDESTRIANS_CONFIG,
      default: {
        ...actual.PEDESTRIANS_CONFIG.default,
        busTimeAdvantageFactor: 1.0,
      },
    },
  }
})

describe('RoutePlanningSystem', () => {
  it('chooses stops for the return journey without preassigned transit', () => {
    const world = createWorldWithResident()
    const resident = world.residents.get('resident-main')!
    const office = world.buildings.get('building-office')!
    resident.position = { ...getBuildingEntrance(office) }
    resident.journey = {
      originBuildingId: office.id,
      destinationBuildingId: 'building-house',
      transit: null,
    }
    world.buses.delete('bus-main')
    const bus = world.buses.get('bus-main1')!
    // Житель должен успеть к автобусу; тест проверяет выбор обратного маршрута.
    bus.waitingSecondsRemaining = 8
    new RoutePlanningSystem().update(world, 0)
    expect(resident.state).toBe(ResidentState.WalkingToStop)
    expect(resident.journey.transit).toEqual({
      routeId: 'route-main',
      boardingStopId: 'stop-office',
      destinationStopId: 'stop-house',
      boardingLegIndex: 1,
      destinationLegIndex: 0,
    })
    expect(resident.transportDecision?.evaluatedBusId).toBe(bus.id)
  })

  it('accounts for terminal detours when comparing a missed return bus with walking', () => {
    const world = createWorldWithResident()
    const resident = world.residents.get('resident-main')!
    const office = world.buildings.get('building-office')!
    resident.position = { ...getBuildingEntrance(office) }
    resident.journey = {
      originBuildingId: office.id,
      destinationBuildingId: 'building-house',
      transit: null,
    }
    world.buses.delete('bus-main')
    world.buses.get('bus-main1')!.waitingSecondsRemaining = 4

    new RoutePlanningSystem().update(world, 0)

    expect(resident.state).toBe(ResidentState.Walking)
    expect(resident.journey.transit).toBeNull()
    expect(resident.transportDecision!.busTime!).toBeGreaterThan(
      resident.transportDecision!.walkingTime,
    )
  })

  it('walks to its goal when there are no routes and clears any previous transit choice', () => {
    const world = createWorldWithResident()
    const resident = world.residents.get('resident-main')!
    world.routes.clear()
    new RoutePlanningSystem().update(world, 0)
    expect(resident.state).toBe(ResidentState.Walking)
    expect(resident.path.at(-1)).toEqual(
      getBuildingEntrance(world.buildings.get('building-office')!),
    )
    expect(resident.journey?.transit).toBeNull()
    expect(resident.transportDecision?.reason).toBe(TransportDecisionReason.TransitUnavailable)
  })

  it('chooses the bus when a suitable bus arrives soon enough', () => {
    const world = createWorldWithResident()
    const system = new RoutePlanningSystem()
    const initialResident = world.residents.get('resident-main')
    const boardingStop = world.stops.get('stop-house')
    const approachingBus = world.buses.get('bus-main')

    if (!initialResident || !boardingStop || !approachingBus) {
      throw new Error('Initial entities are missing')
    }

    const resident = {
      ...initialResident,
      walkingSpeed: 40,
      busTimeAdvantageFactor: 0.9,
    }

    world.residents.set(resident.id, resident)

    world.buses.delete('bus-main1')

    world.buses.set(approachingBus.id, {
      ...approachingBus,
      speed: 80,
      stopWaitSeconds: 4,
      waitingSecondsRemaining: 4,
    })

    resident.state = ResidentState.ChoosingTransport
    resident.path = []
    resident.pathIndex = 0

    system.update(world, 0)

    expect(resident.state).toBe(ResidentState.WalkingToStop)
    expect(resident.path.at(-1)).toEqual(boardingStop.waitingPosition)
    expect(resident.pathIndex).toBe(1)

    expect(resident.transportDecision).toMatchObject({
      selectedMode: TransportMode.Bus,
      reason: TransportDecisionReason.BusSelected,
      walkingTime: 17,
      evaluatedBusId: 'bus-main',
    })

    expect(resident.transportDecision?.busTime).toBeLessThan(17)
  })

  it('chooses walking when the passenger misses the nearby bus', () => {
    const world = createWorldWithResident()
    const system = new RoutePlanningSystem()
    const initialResident = world.residents.get('resident-main')
    const destination = world.buildings.get('building-office')
    const availableBus = world.buses.get('bus-main')

    if (!initialResident || !destination || !availableBus) {
      throw new Error('Initial entities are missing')
    }

    const resident = {
      ...initialResident,
      walkingSpeed: 40,
      busTimeAdvantageFactor: 0.9,
    }

    world.residents.set(resident.id, resident)

    world.buses.delete('bus-main1')
    world.buses.set(availableBus.id, {
      ...availableBus,
      speed: 40,
      stopWaitSeconds: 1,
      waitingSecondsRemaining: 1,
    })

    resident.state = ResidentState.ChoosingTransport
    resident.path = []
    resident.pathIndex = 0

    system.update(world, 0)

    expect(resident.state).toBe(ResidentState.Walking)
    expect(resident.path.at(-1)).toEqual(getBuildingEntrance(destination))
    expect(resident.pathIndex).toBe(1)
    expect(resident.transportDecision).toMatchObject({
      selectedMode: TransportMode.Walking,
      reason: TransportDecisionReason.BusNotCompetitive,
      walkingTime: 17,
      evaluatedBusId: 'bus-main',
    })
  })

  it('records that bus service is unavailable', () => {
    const world = createWorldWithResident()
    const system = new RoutePlanningSystem()
    const initialResident = world.residents.get('resident-main')

    if (!initialResident) {
      throw new Error('Initial resident is missing')
    }

    const resident = {
      ...initialResident,
      walkingSpeed: 40,
      busTimeAdvantageFactor: 0.9,
    }

    world.residents.set(resident.id, resident)

    world.buses.clear()

    system.update(world, 0)

    expect(resident.state).toBe(ResidentState.Walking)
    expect(resident.transportDecision).toEqual({
      selectedMode: TransportMode.Walking,
      reason: TransportDecisionReason.NoBusAvailable,
      walkingTime: 17,
      busTime: null,
      evaluatedBusId: null,
    })
  })
})
