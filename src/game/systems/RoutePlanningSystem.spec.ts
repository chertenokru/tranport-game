import { describe, expect, it } from 'vitest'

import { createWorldWithResident } from '@/game/testing/createWorldWithResident'

import { RoutePlanningSystem } from './RoutePlanningSystem'

describe('RoutePlanningSystem', () => {
  it('chooses stops for the return journey without preassigned transit', () => {
    const world = createWorldWithResident()
    const resident = world.residents.get('resident-main')!
    const office = world.buildings.get('building-office')!
    resident.position = { ...office.entrance }
    resident.journey = {
      originBuildingId: office.id,
      destinationBuildingId: 'building-house',
      transit: null,
    }
    world.buses.delete('bus-main')
    const bus = world.buses.get('bus-main1')!
    bus.waitingSecondsRemaining = 4
    new RoutePlanningSystem().update(world, 0)
    expect(resident.state).toBe('walkingToStop')
    expect(resident.journey.transit).toEqual({
      routeId: 'route-main',
      boardingStopId: 'stop-office',
      destinationStopId: 'stop-house',
    })
    expect(resident.transportDecision?.evaluatedBusId).toBe(bus.id)
  })

  it('walks to its goal when there are no routes and clears any previous transit choice', () => {
    const world = createWorldWithResident()
    const resident = world.residents.get('resident-main')!
    world.routes.clear()
    new RoutePlanningSystem().update(world, 0)
    expect(resident.state).toBe('walking')
    expect(resident.path.at(-1)).toEqual(world.buildings.get('building-office')!.entrance)
    expect(resident.journey?.transit).toBeNull()
    expect(resident.transportDecision?.reason).toBe('transitUnavailable')
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

    resident.state = 'choosingTransport'
    resident.path = []
    resident.pathIndex = 0

    system.update(world, 0)

    expect(resident.state).toBe('walkingToStop')
    expect(resident.path.at(-1)).toEqual(boardingStop.waitingPosition)
    expect(resident.pathIndex).toBe(1)

    expect(resident.transportDecision).toMatchObject({
      selectedMode: 'bus',
      reason: 'busSelected',
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

    resident.state = 'choosingTransport'
    resident.path = []
    resident.pathIndex = 0

    system.update(world, 0)

    expect(resident.state).toBe('walking')
    expect(resident.path.at(-1)).toEqual(destination.entrance)
    expect(resident.pathIndex).toBe(1)
    expect(resident.transportDecision).toMatchObject({
      selectedMode: 'walking',
      reason: 'busNotCompetitive',
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

    expect(resident.state).toBe('walking')
    expect(resident.transportDecision).toEqual({
      selectedMode: 'walking',
      reason: 'noBusAvailable',
      walkingTime: 17,
      busTime: null,
      evaluatedBusId: null,
    })
  })
})
