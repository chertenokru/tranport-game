import { describe, expect, it } from 'vitest'

import { GameEngine } from '@/game/core/GameEngine'
import { createResident } from '@/game/world/createResident'
import { createVerticalSliceWorld } from '@/game/world/MapFactory'

import { BusMovementSystem } from './BusMovementSystem'
import { PassengerSystem } from './PassengerSystem'
import { TransportSystem } from './TransportSystem'
import { RoutePlanningSystem } from './routePlanning/RoutePlanningSystem.ts'
import { BusState } from '@/game/domain/Bus'
import { ResidentState } from '@/game/domain/Resident'
import { TransportDecisionReason, TransportMode } from '@/game/domain/TransportDecision'

function createWaitingGroup() {
  const world = createVerticalSliceWorld()
  world.buses.delete('bus-main1')

  const initialBus = world.buses.get('bus-main')!
  const bus = {
    ...initialBus,
    capacity: 10,
    speed: 80,
    stopWaitSeconds: 1,
    waitingSecondsRemaining: 1,
  }
  world.buses.set(bus.id, bus)

  const origin = world.buildings.get('building-house')!
  const stop = world.stops.get('stop-house')!
  const residents = Array.from({ length: 15 }, (_, index) => {
    const resident = {
      ...createResident(`overflow-${index + 1}`, origin),
      walkingSpeed: 40,
      busTimeAdvantageFactor: 1,
    }
    resident.position = { ...stop.waitingPosition }
    resident.currentBuildingId = null
    resident.state = ResidentState.WaitingBus
    resident.journey = {
      originBuildingId: origin.id,
      destinationBuildingId: 'building-office',
      transit: {
        routeId: 'route-main',
        boardingStopId: stop.id,
        destinationStopId: 'stop-office',
      },
    }
    world.residents.set(resident.id, resident)
    return resident
  })

  return { world, bus, residents, overflow: residents.slice(bus.capacity) }
}

describe('Replanning after a full bus', () => {
  it('requests a new decision for every resident who could not board', () => {
    const { world, bus, residents, overflow } = createWaitingGroup()

    new PassengerSystem().update(world, 0)

    expect(bus.passengerIds).toEqual(residents.slice(0, bus.capacity).map(({ id }) => id))
    expect(overflow.map(({ state }) => state)).toEqual(
      Array.from({ length: 5 }, () => ResidentState.ChoosingTransport),
    )
  })

  it('chooses walking instead of repeatedly selecting the full bus during its current stop', () => {
    const { world, bus, overflow } = createWaitingGroup()
    // Keep the same system order as GameSession. Population generation and arrival
    // cleanup are irrelevant to this two-second boarding scenario.
    const engine = new GameEngine(world, [new RoutePlanningSystem(), new TransportSystem()])
    engine.start()
    engine.update(0)

    expect(bus.passengerIds).toHaveLength(bus.capacity)
    const resident = overflow[0]!
    const initialPosition = { ...resident.position }

    for (let frame = 0; frame < 120; frame++) {
      engine.update(1 / 60)
    }

    // Walking from this stop takes about 14 seconds. The only bus must finish
    // its round trip before boarding again, making that journey slower.
    expect(bus.state).toBe(BusState.Moving)
    expect(resident.transportDecision?.selectedMode).toBe(TransportMode.Walking)
    expect(resident.state).toBe(ResidentState.Walking)
    expect(resident.position.x).toBeGreaterThan(initialPosition.x)
    expect(bus.passengerIds).not.toContain(resident.id)
  })

  it('can choose walking if the new decision happens after the full bus departs', () => {
    const { world, bus, overflow } = createWaitingGroup()
    new PassengerSystem().update(world, 0)
    const resident = overflow[0]!
    expect(resident.state).toBe(ResidentState.ChoosingTransport)

    // Control case: deliberately replan after departure, unlike the normal
    // GameSession order, where planning precedes BusMovementSystem.
    new BusMovementSystem().update(world, bus.waitingSecondsRemaining)
    expect(bus.state).toBe(BusState.Moving)
    new RoutePlanningSystem().update(world, 0)

    expect(resident.state).toBe(ResidentState.Walking)
    expect(resident.transportDecision).toMatchObject({
      selectedMode: TransportMode.Walking,
      reason: TransportDecisionReason.BusNotCompetitive,
    })
    expect(resident.transportDecision!.busTime!).toBeGreaterThan(
      resident.transportDecision!.walkingTime,
    )
    expect(resident.journey?.transit).toBeNull()
  })
})
