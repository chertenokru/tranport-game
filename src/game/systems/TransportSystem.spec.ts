import { describe, expect, it } from 'vitest'
import { BusState } from '@/game/domain/Bus'
import { ResidentState } from '@/game/domain/Resident'
import { createWorldWithResident } from '@/game/testing/createWorldWithResident'
import { TransportSystem } from './TransportSystem'

function createTransportWorld() {
  const world = createWorldWithResident()
  world.buses.delete('bus-main1')
  const bus = world.buses.get('bus-main')!
  const resident = world.residents.get('resident-main')!
  resident.state = ResidentState.WaitingBus
  resident.position = { ...world.stops.get('stop-house')!.waitingPosition }
  resident.path = []
  resident.pathIndex = 0
  return { world, bus, resident }
}

describe('TransportSystem', () => {
  it('uses the time remaining after departure', () => {
    const { world, bus, resident } = createTransportWorld()
    bus.waitingSecondsRemaining = 0.1
    new TransportSystem().update(world, 1)
    expect(bus.position.x).toBeCloseTo(212)
    expect(bus.state).toBe(BusState.Moving)
    expect(resident.state).toBe(ResidentState.InsideBus)
  })

  it.each([0, 1])('boards and alights at intermediate stops with %s seconds dwell', (dwell) => {
    const { world, bus: original, resident } = createTransportWorld()
    const bus = { ...original, stopWaitSeconds: dwell, waitingSecondsRemaining: dwell }
    world.buses.set(bus.id, bus)
    resident.journey = {
      originBuildingId: 'building-office',
      destinationBuildingId: 'building-house',
      transit: {
        routeId: bus.routeId,
        boardingStopId: 'stop-office',
        destinationStopId: 'stop-house',
      },
    }
    resident.position = { ...world.stops.get('stop-office')!.waitingPosition }
    new TransportSystem().update(world, 14 + 2 * dwell)
    expect(resident.state).toBe(ResidentState.WalkingFromStop)
    expect(bus.passengerIds).toEqual([])
    expect(resident.position).toEqual(world.stops.get('stop-house')!.waitingPosition)
  })

  it.each([0.05, 0.1, 0.2])('respects a passenger arrival at %s seconds', (arrival) => {
    const { world, bus, resident } = createTransportWorld()
    bus.waitingSecondsRemaining = 0.1
    const stop = world.stops.get('stop-house')!
    resident.state = ResidentState.WalkingToStop
    resident.position = {
      x: stop.waitingPosition.x - resident.walkingSpeed * arrival,
      y: stop.waitingPosition.y,
    }
    resident.path = [stop.waitingPosition]
    resident.pathIndex = 0
    new TransportSystem().update(world, 1)
    expect(resident.state).toBe(arrival <= 0.1 ? ResidentState.InsideBus : ResidentState.WaitingBus)
  })

  it('produces the same transport state with one large step and many small steps', () => {
    const large = createTransportWorld()
    const small = createTransportWorld()
    new TransportSystem().update(large.world, 20)
    const system = new TransportSystem()
    for (let index = 0; index < 200; index++) system.update(small.world, 0.1)
    expect(large.bus.legIndex).toBe(small.bus.legIndex)
    expect(large.bus.state).toBe(small.bus.state)
    expect(large.bus.position.x).toBeCloseTo(small.bus.position.x)
    expect(large.bus.position.y).toBeCloseTo(small.bus.position.y)
    expect(large.bus.waitingSecondsRemaining).toBeCloseTo(small.bus.waitingSecondsRemaining)
    expect(large.resident.state).toBe(small.resident.state)
    expect(large.resident.position.x).toBeCloseTo(small.resident.position.x)
    expect(large.resident.position.y).toBeCloseTo(small.resident.position.y)
  })
})
