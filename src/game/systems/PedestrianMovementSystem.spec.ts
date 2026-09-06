import { describe, expect, it } from 'vitest'

import { createWorldWithResident } from '@/game/testing/createWorldWithResident'

import { PedestrianMovementSystem } from './PedestrianMovementSystem'

describe('PedestrianMovementSystem', () => {
  it('moves a resident toward the bus stop', () => {
    const world = createWorldWithResident()
    const system = new PedestrianMovementSystem()
    const resident = world.residents.get('resident-main')

    expect(resident).toBeDefined()

    if (!resident) {
      throw new Error('Initial resident is missing')
    }
    const busStop = world.stops.get(resident.journey!.transit!.boardingStopId)

    if (!busStop) {
      throw new Error('Boarding stop is missing')
    }
    resident.state = 'walkingToStop'
    resident.path = [resident.position, busStop.waitingPosition]
    resident.pathIndex = 1
    const startingPosition = {
      ...resident.position,
    }

    const initialDistanceToStop = Math.hypot(
      busStop.waitingPosition.x - startingPosition.x,
      busStop.waitingPosition.y - startingPosition.y,
    )

    system.update(world, 1)

    const travelledDistance = Math.hypot(
      resident.position.x - startingPosition.x,
      resident.position.y - startingPosition.y,
    )

    const remainingDistanceToStop = Math.hypot(
      busStop.waitingPosition.x - resident.position.x,
      busStop.waitingPosition.y - resident.position.y,
    )

    expect(travelledDistance).toBeCloseTo(resident.walkingSpeed, 5)
    expect(remainingDistanceToStop).toBeLessThan(initialDistanceToStop)
    expect(resident.state).toBe('walkingToStop')
  })

  it('starts waiting after reaching the stop', () => {
    const world = createWorldWithResident()
    const system = new PedestrianMovementSystem()
    const resident = world.residents.get('resident-main')

    if (!resident) {
      throw new Error('Initial resident is missing')
    }

    const busStop = world.stops.get(resident.journey!.transit!.boardingStopId)

    if (!busStop) {
      throw new Error('Boarding stop is missing')
    }
    resident.state = 'walkingToStop'
    resident.path = [resident.position, busStop.waitingPosition]
    resident.pathIndex = 1
    system.update(world, 10)

    expect(resident.position).toEqual(busStop.waitingPosition)
    expect(resident.state).toBe('waitingBus')
    expect(resident.path).toEqual([])
    expect(resident.pathIndex).toBe(0)
  })
})
