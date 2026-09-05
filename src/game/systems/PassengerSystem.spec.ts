import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory'

import { PassengerSystem } from './PassengerSystem'

describe('PassengerSystem', () => {
  it('boards and drops off a passenger', () => {
    const world = createVerticalSliceWorld()
    const system = new PassengerSystem()
    const bus = world.buses.get('bus-main')
    const pedestrian = world.pedestrians.get('pedestrian-main')

    const houseStop = world.stops.get('stop-house')
    const officeStop = world.stops.get('stop-office')
    expect(pedestrian).toBeDefined()
    const destination = world.buildings.get(pedestrian!.destinationBuildingId)

    if (!bus || !pedestrian || !houseStop || !officeStop) {
      throw new Error('Initial entities are missing')
    }
    pedestrian.position = {
      ...houseStop.waitingPosition,
    }
    pedestrian.path = []
    pedestrian.pathIndex = 0
    pedestrian.state = 'waitingBus'

    system.update(world, 0)

    expect(pedestrian.state).toBe('insideBus')
    expect(bus.passengerIds).toContain(pedestrian.id)

    bus.position = {
      ...officeStop.vehiclePosition,
    }
    bus.currentStopIndex = 1
    bus.state = 'waitingAtStop'

    system.update(world, 0)

    expect(bus.passengerIds).not.toContain(pedestrian.id)
    expect(pedestrian.state).toBe('walkingFromStop')
    expect(pedestrian.position).toEqual(officeStop.waitingPosition)
    expect(pedestrian.path.at(-1)).toEqual(destination!.entrance)
  })
})
