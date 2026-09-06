import { describe, expect, it } from 'vitest'

import { createWorldWithResident } from '@/game/testing/createWorldWithResident'
import { BusState } from '@/game/domain/Bus'
import { ResidentState } from '@/game/domain/Resident'

import { PassengerSystem } from './PassengerSystem'
import { getBuildingEntrance } from '@/game/tools/getBuildingEntrance.ts'

describe('PassengerSystem', () => {
  it('boards residents up to capacity and sends the rest for replanning', () => {
    const world = createWorldWithResident()
    const system = new PassengerSystem()
    const first = world.residents.get('resident-main')!
    first.state = ResidentState.WaitingBus
    const second = { ...first, id: 'second' }
    const third = { ...first, id: 'third' }
    world.residents.set(second.id, second)
    world.residents.set(third.id, third)
    const originalBus = world.buses.get('bus-main')!
    const bus = { ...originalBus, capacity: 2 }
    world.buses.set(bus.id, bus)
    world.buses.delete('bus-main1')

    system.update(world, 0)
    expect(bus.passengerIds).toEqual([first.id, second.id])
    expect(third.state).toBe(ResidentState.ChoosingTransport)
    system.update(world, 0)
    expect(bus.passengerIds).toHaveLength(2)
    expect(bus.passengerIds).not.toContain(third.id)
  })

  it('boards and drops off a passenger', () => {
    const world = createWorldWithResident()
    const system = new PassengerSystem()
    const bus = world.buses.get('bus-main')
    const resident = world.residents.get('resident-main')

    const houseStop = world.stops.get('stop-house')
    const officeStop = world.stops.get('stop-office')
    expect(resident).toBeDefined()
    const destination = world.buildings.get(resident!.journey!.destinationBuildingId)

    if (!bus || !resident || !houseStop || !officeStop) {
      throw new Error('Initial entities are missing')
    }
    resident.position = {
      ...houseStop.waitingPosition,
    }
    resident.path = []
    resident.pathIndex = 0
    resident.state = ResidentState.WaitingBus

    system.update(world, 0)

    expect(resident.state).toBe(ResidentState.InsideBus)
    expect(bus.passengerIds).toContain(resident.id)

    bus.position = {
      ...officeStop.vehiclePosition,
    }
    bus.currentStopIndex = 1
    bus.state = BusState.WaitingAtStop

    system.update(world, 0)

    expect(bus.passengerIds).not.toContain(resident.id)
    expect(resident.state).toBe(ResidentState.WalkingFromStop)
    expect(resident.position).toEqual(officeStop.waitingPosition)
    expect(resident.path.at(-1)).toEqual(getBuildingEntrance(destination!))
  })
})
