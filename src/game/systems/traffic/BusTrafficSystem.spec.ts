import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/game/core/GameWorld'
import { BusState } from '@/game/domain/Bus'
import { Direction } from '@/game/domain/Direction'
import { ResidentState } from '@/game/domain/Resident'
import type { Vector2 } from '@/game/domain/geometry'
import { VEHICLES_CONFIG } from '@/game/config/vehicles.config'
import { createBus } from '@/game/world/createBus'
import { createWorldWithResident } from '@/game/testing/createWorldWithResident'
import { createIShapedWorld } from '@/game/world/createIShapedWorld'
import { getDirection } from '@/game/tools/geometry'
import { getVehicleBounds } from '@/game/tools/getVehicleBounds'
import { BusMovementSystem } from '../BusMovementSystem'
import { TransportSystem } from '../TransportSystem'
import { BusTrafficSystem } from './BusTrafficSystem'
import type { TrafficZone } from './TrafficZone'

function addBus(world: GameWorld, id: string, path: Vector2[], speed = 80) {
  const distance = path
    .slice(1)
    .reduce(
      (sum, point, index) => sum + Math.hypot(point.x - path[index]!.x, point.y - path[index]!.y),
      0,
    )
  const leg = { fromStopId: `${id}-start`, toStopId: `${id}-end`, nodeIds: [], path, distance }
  const route = {
    id,
    name: id,
    legs: [
      leg,
      { ...leg, fromStopId: leg.toStopId, toStopId: leg.fromStopId, path: [...path].reverse() },
    ],
  }
  world.routes.set(id, route)
  const bus = createBus(route, id, { ...VEHICLES_CONFIG.standardBus, speed })
  bus.state = BusState.Moving
  bus.direction = getDirection({ x: path[1]!.x - path[0]!.x, y: path[1]!.y - path[0]!.y })!
  bus.pathIndex = 1
  bus.waitingSecondsRemaining = 0
  world.buses.set(id, bus)
  return bus
}

function laneScene(leaderSpeed = 80) {
  const world = new GameWorld()
  const follower = addBus(world, 'follower', [
    { x: 300, y: 0 },
    { x: 2000, y: 0 },
  ])
  const leader = addBus(
    world,
    'leader',
    [
      { x: 400, y: 0 },
      { x: 2000, y: 0 },
    ],
    leaderSpeed,
  )
  return { world, leader, follower }
}

function intersectionScene(reverseInsertion = false) {
  const world = new GameWorld()
  world.intersections.set('junction', {
    id: 'junction',
    position: { x: 0, y: 0 },
    size: 64,
    direction: Direction.South,
    connections: new Map(),
    movements: new Map(),
  })
  const east = addBus(world, 'a-east', [
    { x: -120, y: 0 },
    { x: 0, y: 0 },
    { x: 600, y: 0 },
  ])
  const north = addBus(world, 'b-north', [
    { x: 0, y: 120 },
    { x: 0, y: 0 },
    { x: 0, y: -600 },
  ])
  if (reverseInsertion) {
    world.buses.delete(east.id)
    world.buses.set(east.id, east)
  }
  return { world, east, north }
}

describe('bus following', () => {
  it.each([5, 12])('stops with a configured %s pixel body clearance', (minimumGap) => {
    const { world, leader, follower } = laneScene()
    leader.state = BusState.WaitingAtStop
    leader.waitingSecondsRemaining = 10
    new TransportSystem({ minimumGap }).update(world, 3)
    expect(follower.position.x).toBeCloseTo(400 - 44 - minimumGap)
    expect(leader.position.x).toBe(400)
    expect(follower.state).toBe(BusState.Moving)
    expect(follower.waitingSecondsRemaining).toBe(0)
  })

  it('follows a slower vehicle without passing through it', () => {
    const { world, leader, follower } = laneScene(20)
    new TransportSystem().update(world, 2)
    expect(leader.position.x).toBeCloseTo(440)
    expect(follower.position.x).toBeCloseTo(391)
  })

  it('propagates a stopped queue and resumes when the leader leaves', () => {
    const { world, leader, follower } = laneScene()
    const last = addBus(world, 'last', [
      { x: 200, y: 0 },
      { x: 2000, y: 0 },
    ])
    leader.state = BusState.WaitingAtStop
    leader.waitingSecondsRemaining = 3
    const system = new TransportSystem()
    system.update(world, 2)
    expect(follower.position.x).toBeCloseTo(351)
    expect(last.position.x).toBeCloseTo(302)
    system.update(world, 2)
    expect(leader.position.x).toBeCloseTo(480)
    expect(follower.position.x).toBeCloseTo(431)
    expect(last.position.x).toBeCloseTo(382)
  })

  it('does not block opposite traffic or a separate parallel lane', () => {
    const { world, leader, follower } = laneScene()
    world.buses.delete(leader.id)
    addBus(world, 'opposite', [
      { x: 500, y: 0 },
      { x: 0, y: 0 },
    ])
    const parallel = addBus(world, 'parallel', [
      { x: 400, y: 100 },
      { x: 2000, y: 100 },
    ])
    parallel.state = BusState.WaitingAtStop
    parallel.waitingSecondsRemaining = 10
    new TransportSystem().update(world, 2)
    expect(follower.position.x).toBeCloseTo(460)
  })

  it('does not predict a pedestrian hit using the speed of a blocked bus', () => {
    const { world, leader } = laneScene()
    leader.state = BusState.WaitingAtStop
    leader.waitingSecondsRemaining = 10
    const resident = createWorldWithResident().residents.get('resident-main')!
    resident.state = ResidentState.WaitingBus
    resident.position = { x: 500, y: 16 }
    world.residents.set(resident.id, resident)
    new TransportSystem().update(world, 3)
    expect(world.accidents).toBe(0)
    expect(resident.state).toBe(ResidentState.WaitingBus)
  })
})

describe('exclusive traffic zones', () => {
  it.each([false, true])(
    'chooses one simultaneous arrival independently of insertion order (%s)',
    (reverse) => {
      const { world, east, north } = intersectionScene(reverse)
      new TransportSystem().update(world, 1)
      expect(world.trafficZoneOwners.get('junction')).toBe(east.id)
      expect(east.position.x).toBeCloseTo(-40)
      expect(north.position.y).toBeCloseTo(59)
    },
  )

  it('keeps the zone until the rear clears it, then admits the waiting vehicle', () => {
    const { world, east, north } = intersectionScene()
    const system = new TransportSystem()
    system.update(world, 2.1)
    expect(world.trafficZoneOwners.get('junction')).toBe(east.id)
    expect(north.position.y).toBeCloseTo(59)
    system.update(world, 0.2)
    expect(world.trafficZoneOwners.get('junction')).toBe(north.id)
    expect(north.position.y).toBeCloseTo(49)
  })

  it('does not depend on the frame duration', () => {
    const large = intersectionScene()
    const small = intersectionScene()
    new TransportSystem().update(large.world, 3)
    const system = new TransportSystem()
    for (let index = 0; index < 300; index++) system.update(small.world, 0.01)
    expect(large.east.position.x).toBeCloseTo(small.east.position.x)
    expect(large.north.position.y).toBeCloseTo(small.north.position.y)
    expect(large.north.position.y).toBeCloseTo(-7)
  })

  it('releases a reservation if its owner is removed, and clears reservations on reset', () => {
    const { world, east, north } = intersectionScene()
    new TransportSystem().update(world, 1)
    world.buses.delete(east.id)
    new BusTrafficSystem().plan(world, 0)
    expect(world.trafficZoneOwners.get('junction')).toBe(north.id)
    world.reset()
    expect(world.trafficZoneOwners.size).toBe(0)
  })

  it('supports external occupancy for future pedestrian crossings', () => {
    const { world, east } = intersectionScene()
    world.buses.delete('b-north')
    const zone: TrafficZone = {
      id: 'crossing',
      position: { x: 0, y: 0 },
      halfSize: { x: 32, y: 32 },
      blocked: true,
    }
    const traffic = new BusTrafficSystem()
    const movement = new BusMovementSystem()
    let remaining = 2
    while (remaining > 0) {
      const step = traffic.plan(world, remaining, [zone])
      movement.update(world, step.duration, step.motions)
      remaining -= step.duration
    }
    expect(east.position.x).toBeCloseTo(-59)
    expect(world.trafficZoneOwners.has(zone.id)).toBe(false)
    const step = traffic.plan(world, 0.5, [{ ...zone, blocked: false }])
    movement.update(world, step.duration, step.motions)
    expect(east.position.x).toBeCloseTo(-19)
  })

  it('keeps intersections exclusive through real map turns and turnarounds', () => {
    const world = createIShapedWorld()
    const system = new TransportSystem()
    const visited = new Map([...world.buses.keys()].map((id) => [id, new Set<number>()]))
    for (let index = 0; index < 600; index++) {
      system.update(world, 0.1)
      for (const bus of world.buses.values()) visited.get(bus.id)!.add(bus.legIndex)
      for (const zone of world.intersections.values()) {
        const occupants = [...world.buses.values()].filter((bus) => {
          const body = getVehicleBounds(bus)
          return (
            Math.abs(body.position.x - zone.position.x) < body.halfSize.x + zone.size / 2 - 1e-6 &&
            Math.abs(body.position.y - zone.position.y) < body.halfSize.y + zone.size / 2 - 1e-6
          )
        })
        expect(occupants.length).toBeLessThanOrEqual(1)
      }
    }
    for (const stops of visited.values()) expect(stops.size).toBe(4)
  })
})
