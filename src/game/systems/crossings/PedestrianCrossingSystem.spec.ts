import { describe, expect, it } from 'vitest'
import { BusState } from '@/game/domain/Bus'
import { Direction } from '@/game/domain/Direction'
import { ResidentState } from '@/game/domain/Resident'
import type { Resident } from '@/game/domain/Resident'
import { createWorldWithResident } from '@/game/testing/createWorldWithResident'
import { TransportSystem } from '../TransportSystem'

function createScene() {
  const world = createWorldWithResident()
  world.buses.delete('bus-main1')
  world.crossings.set('crossing', {
    id: 'crossing',
    roadId: 'road-main',
    position: { x: 400, y: 340 },
    direction: Direction.East,
    roadWidth: 64,
    width: 24,
  })

  const bus = world.buses.get('bus-main')!
  bus.position = { x: 300, y: 340 }
  bus.state = BusState.Moving
  bus.direction = Direction.East
  bus.pathIndex = 3
  bus.waitingSecondsRemaining = 0

  const resident = world.residents.get('resident-main')!
  resident.currentBuildingId = null
  resident.state = ResidentState.Walking
  resident.position = { x: 400, y: 296 }
  resident.path = [resident.position, { x: 400, y: 384, crossingId: 'crossing' }]
  resident.pathIndex = 1

  return { world, bus, resident }
}

describe('PedestrianCrossingSystem', () => {
  it('holds a pedestrian on red and admits them when green starts', () => {
    const { world, bus, resident } = createScene()
    world.buses.delete(bus.id)
    world.crossings.set('crossing', {
      ...world.crossings.get('crossing')!,
      signalTiming: {
        pedestrianGreenSeconds: 8,
        pedestrianRedSeconds: 12,
        phaseOffsetSeconds: 10,
      },
    })
    const system = new TransportSystem()

    system.update(world, 9)
    expect(resident.position).toEqual({ x: 400, y: 296 })
    expect(world.crossingOccupants.has('crossing')).toBe(false)

    system.update(world, 1.5)
    expect(resident.position.y).toBeCloseTo(306)
    expect(world.crossingOccupants.get('crossing')).toEqual(new Set([resident.id]))
  })

  it('holds a bus until vehicle green and the crossing is empty', () => {
    const { world, bus, resident } = createScene()
    world.crossings.set('crossing', {
      ...world.crossings.get('crossing')!,
      signalTiming: {
        pedestrianGreenSeconds: 8,
        pedestrianRedSeconds: 12,
        phaseOffsetSeconds: 0,
      },
    })
    const system = new TransportSystem()

    system.update(world, 6)
    expect(resident.position).toEqual({ x: 400, y: 384 })
    expect(bus.position.x).toBeCloseTo(361)

    system.update(world, 2.5)
    expect(bus.position.x).toBeCloseTo(401)
    expect(world.trafficZoneOwners.get('crossing')).toBe(bus.id)
  })

  it('lets pedestrians enter first and holds a bus before the occupied crossing', () => {
    const { world, bus, resident } = createScene()
    const system = new TransportSystem()

    system.update(world, 1)
    expect(bus.position.x).toBeCloseTo(361)
    expect(resident.position.y).toBeCloseTo(316)
    expect(world.crossingOccupants.get('crossing')).toEqual(new Set([resident.id]))
    expect(world.accidents).toBe(0)

    system.update(world, 3.4)
    expect(resident.position).toEqual({ x: 400, y: 384 })
    expect(world.crossingOccupants.has('crossing')).toBe(false)
    expect(bus.position.x).toBeCloseTo(361)

    system.update(world, 0.5)
    expect(bus.position.x).toBeCloseTo(401)
    expect(world.trafficZoneOwners.get('crossing')).toBe(bus.id)
    expect(world.accidents).toBe(0)
  })

  it('makes a pedestrian wait for a bus that has already entered', () => {
    const { world, bus, resident } = createScene()
    bus.position = { x: 370, y: 340 }
    const system = new TransportSystem()

    system.update(world, 0.5)
    expect(bus.position.x).toBeCloseTo(410)
    expect(resident.position).toEqual({ x: 400, y: 296 })
    expect(world.trafficZoneOwners.get('crossing')).toBe(bus.id)

    system.update(world, 0.5)
    expect(bus.position.x).toBeCloseTo(450)
    expect(resident.position.y).toBeCloseTo(300)
    expect(world.crossingOccupants.get('crossing')).toEqual(new Set([resident.id]))
  })

  it('admits a waiting group together and keeps the crossing blocked until the last one exits', () => {
    const { world, bus, resident } = createScene()
    const slower: Resident = {
      ...resident,
      id: 'slower',
      walkingSpeed: 10,
      position: { ...resident.position },
      path: [...resident.path],
    }
    world.residents.set(slower.id, slower)
    const system = new TransportSystem()

    system.update(world, 4.4)
    expect(resident.position.y).toBe(384)
    expect(slower.position.y).toBeCloseTo(340)
    expect(bus.position.x).toBeCloseTo(361)
    expect(world.crossingOccupants.get('crossing')).toEqual(new Set([slower.id]))

    system.update(world, 4.4)
    expect(slower.position.y).toBe(384)
    expect(world.crossingOccupants.has('crossing')).toBe(false)
    expect(bus.position.x).toBeCloseTo(361)

    system.update(world, 0.5)
    expect(bus.position.x).toBeCloseTo(401)
  })

  it('produces the same state with one large step and many small steps', () => {
    const large = createScene()
    const small = createScene()
    new TransportSystem().update(large.world, 6)
    const system = new TransportSystem()
    for (let index = 0; index < 60; index++) system.update(small.world, 0.1)

    expect(large.bus.position.x).toBeCloseTo(small.bus.position.x)
    expect(large.resident.position.y).toBeCloseTo(small.resident.position.y)
    expect(large.resident.state).toBe(small.resident.state)
    expect(large.world.accidents).toBe(0)
    expect(small.world.accidents).toBe(0)
  })
})
