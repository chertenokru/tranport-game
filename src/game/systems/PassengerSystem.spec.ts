import { describe, expect, it } from 'vitest'

import { createWorldWithResident } from '@/game/testing/createWorldWithResident'
import { BusState } from '@/game/domain/Bus'
import { ResidentState } from '@/game/domain/Resident'

import { PassengerSystem } from './PassengerSystem'
import { getBuildingEntrance } from '@/game/tools/getBuildingEntrance.ts'
import { createIShapedWorld } from '@/game/world/createIShapedWorld'
import { createResident } from '@/game/world/createResident'

describe('PassengerSystem', () => {
  it('boards only at the selected visit to a repeated stop', () => {
    const world = createIShapedWorld()
    const system = new PassengerSystem()
    const bus = world.buses.get('bus-route-upper-lower')!
    const shop = world.stops.get('stop-shop')!
    const resident = createResident('waiting-at-shop', world.buildings.get('building-shop')!)
    resident.state = ResidentState.WaitingBus
    resident.currentBuildingId = null
    resident.position = { ...shop.waitingPosition }
    resident.journey = {
      originBuildingId: 'building-shop',
      destinationBuildingId: 'building-upper-house',
      transit: {
        routeId: bus.routeId,
        boardingStopId: shop.id,
        destinationStopId: 'stop-upper-house',
        boardingLegIndex: 3,
        destinationLegIndex: 0,
      },
    }
    world.residents.set(resident.id, resident)

    bus.legIndex = 1
    bus.position = { ...shop.vehiclePosition }
    system.update(world, 0)
    expect(resident.state).toBe(ResidentState.WaitingBus)
    expect(bus.passengerIds).not.toContain(resident.id)

    bus.legIndex = 3
    system.update(world, 0)
    expect(resident.state).toBe(ResidentState.InsideBus)
    expect(bus.passengerIds).toContain(resident.id)
  })

  it('drops off only at the selected visit to a repeated stop', () => {
    const world = createIShapedWorld()
    const system = new PassengerSystem()
    const bus = world.buses.get('bus-route-upper-lower')!
    const shop = world.stops.get('stop-shop')!
    const resident = createResident('riding-to-shop', world.buildings.get('building-upper-house')!)
    resident.state = ResidentState.InsideBus
    resident.currentBuildingId = null
    resident.journey = {
      originBuildingId: 'building-upper-house',
      destinationBuildingId: 'building-shop',
      transit: {
        routeId: bus.routeId,
        boardingStopId: 'stop-upper-house',
        destinationStopId: shop.id,
        boardingLegIndex: 0,
        destinationLegIndex: 3,
      },
    }
    world.residents.set(resident.id, resident)
    bus.passengerIds.push(resident.id)
    bus.position = { ...shop.vehiclePosition }
    bus.legIndex = 1

    system.update(world, 0)
    expect(resident.state).toBe(ResidentState.InsideBus)
    expect(bus.passengerIds).toContain(resident.id)

    bus.legIndex = 3
    system.update(world, 0)
    expect(resident.state).toBe(ResidentState.WalkingFromStop)
    expect(resident.position).toEqual(shop.waitingPosition)
    expect(bus.passengerIds).not.toContain(resident.id)
  })

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
    bus.legIndex = 1
    bus.state = BusState.WaitingAtStop

    system.update(world, 0)

    expect(bus.passengerIds).not.toContain(resident.id)
    expect(resident.state).toBe(ResidentState.WalkingFromStop)
    expect(resident.position).toEqual(officeStop.waitingPosition)
    expect(resident.path.at(-1)).toEqual(getBuildingEntrance(destination!))
  })
})
