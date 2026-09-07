import { describe, expect, it } from 'vitest'
import { BusState } from '@/game/domain/Bus'
import { Direction } from '@/game/domain/Direction'
import { ResidentState } from '@/game/domain/Resident'
import { createWorldWithResident } from '@/game/testing/createWorldWithResident'
import { TransportSystem } from '../TransportSystem'
import { EconomySystem } from '../EconomySystem'
import { GameEngine } from '@/game/core/GameEngine'

function createScene() {
  const world = createWorldWithResident()
  world.buses.delete('bus-main1')
  const bus = world.buses.get('bus-main')!
  bus.position = { x: 300, y: 340 }
  bus.state = BusState.Moving
  bus.direction = Direction.East
  bus.pathIndex = 3
  const resident = world.residents.get('resident-main')!
  resident.state = ResidentState.WaitingBus
  resident.position = { x: 400, y: 356 }
  return { world, bus, resident }
}

describe('pedestrian collisions during transport', () => {
  it('respects pause and starts counting contacts only when simulation resumes', () => {
    const { world, resident } = createScene()
    const engine = new GameEngine(world, [new TransportSystem()])
    engine.update(3)
    expect(world.accidents).toBe(0)
    expect(resident.state).toBe(ResidentState.WaitingBus)
    engine.start()
    engine.update(3)
    expect(world.accidents).toBe(1)
  })

  it('detects a pedestrian walking into a stationary bus after alighting', () => {
    const { world, bus, resident } = createScene()
    bus.position = { x: 700, y: 340 }
    bus.legIndex = 1
    bus.state = BusState.WaitingAtStop
    bus.waitingSecondsRemaining = 2
    resident.state = ResidentState.WalkingFromStop
    resident.position = { x: 700, y: 384 }
    resident.path = [{ x: 700, y: 280 }]
    resident.pathIndex = 0
    new TransportSystem().update(world, 1)
    expect(resident.state).toBe(ResidentState.Dead)
    expect(resident.position.y).toBeCloseTo(374)
    expect(bus.position).toEqual({ x: 700, y: 340 })
    expect(bus.waitingSecondsRemaining).toBe(1)
  })

  it('kills a pedestrian crossed between frames and lets the bus continue', () => {
    const { world, bus, resident } = createScene()
    new TransportSystem().update(world, 3)
    expect(resident.state).toBe(ResidentState.Dead)
    expect(resident.position).toEqual({ x: 400, y: 356 })
    expect(resident.path).toEqual([])
    expect(resident.journey).toBeNull()
    expect(bus.position).toEqual({ x: 540, y: 340 })
    expect(bus.state).toBe(BusState.Moving)
    expect(bus.collisionCount).toBe(1)
    expect(world.accidents).toBe(1)
    new TransportSystem().update(world, 20)
    new EconomySystem().update(world, 0)
    expect(world.accidents).toBe(1)
    expect(world.deliveredPassengers).toBe(0)
  })

  it('uses the visible bus body, including its current offset from the road axis', () => {
    const { world, resident } = createScene()
    resident.position = { x: 400, y: 324 }
    new TransportSystem().update(world, 3)
    expect(resident.state).toBe(ResidentState.WaitingBus)
    expect(world.accidents).toBe(0)
  })

  it.each([
    ResidentState.Dead,
    ResidentState.InsideBus,
    ResidentState.IdleInBuilding,
    ResidentState.Arrived,
  ])('excludes a resident in state %s', (state) => {
    const { world, resident } = createScene()
    resident.state = state
    new TransportSystem().update(world, 3)
    expect(world.accidents).toBe(0)
    expect(resident.state).toBe(state)
  })

  it('records the first contact once when two buses reach the same pedestrian', () => {
    const { world, bus } = createScene()
    const second = { ...bus, id: 'bus-second', position: { x: 280, y: 340 }, passengerIds: [] }
    world.buses.set(second.id, second)
    new TransportSystem().update(world, 3)
    expect(world.accidents).toBe(1)
    expect(bus.collisionCount).toBe(1)
    expect(second.collisionCount).toBe(0)
  })

  it('counts each pedestrian in a group', () => {
    const { world, bus, resident } = createScene()
    world.residents.set('second', { ...resident, id: 'second' })
    new TransportSystem().update(world, 3)
    expect(world.accidents).toBe(2)
    expect(bus.collisionCount).toBe(2)
  })

  it('keeps a moving victim at the contact position regardless of frame size', () => {
    const large = createScene()
    const small = createScene()
    for (const { resident } of [large, small]) {
      resident.state = ResidentState.CrossingRoad
      resident.position = { x: 400, y: 330 }
      resident.path = [{ x: 400, y: 400 }]
      resident.pathIndex = 0
    }
    new TransportSystem().update(large.world, 3)
    const system = new TransportSystem()
    for (let index = 0; index < 30; index++) system.update(small.world, 0.1)
    expect(large.resident.state).toBe(ResidentState.Dead)
    expect(small.resident.state).toBe(ResidentState.Dead)
    expect(large.resident.position.y).toBeCloseTo(small.resident.position.y)
    expect(large.resident.position.y).toBeGreaterThan(330)
    expect(large.resident.position.y).toBeLessThan(356)
    expect(large.bus.position.x).toBeCloseTo(small.bus.position.x)
  })

  it('does not sweep a chord across a turn in the route', () => {
    const { world, bus, resident } = createScene()
    const route = world.routes.get(bus.routeId)!
    world.routes.set(route.id, {
      ...route,
      legs: [
        {
          ...route.legs[0]!,
          path: [
            { x: 300, y: 340 },
            { x: 400, y: 340 },
            { x: 400, y: 440 },
          ],
          distance: 200,
        },
        route.legs[1]!,
      ],
    })
    bus.pathIndex = 1
    resident.position = { x: 350, y: 390 }
    new TransportSystem().update(world, 2.5)
    expect(world.accidents).toBe(0)
    expect(bus.position).toEqual({ x: 400, y: 440 })
  })

  it('splits pedestrian paths at bends instead of treating the whole step as a straight line', () => {
    const { world, bus, resident: original } = createScene()
    bus.state = BusState.WaitingAtStop
    bus.waitingSecondsRemaining = 10
    const resident = { ...original, walkingSpeed: 100 }
    world.residents.set(resident.id, resident)
    resident.state = ResidentState.Walking
    resident.position = { x: 250, y: 300 }
    resident.path = [
      { x: 350, y: 300 },
      { x: 350, y: 412 },
    ]
    resident.pathIndex = 0
    new TransportSystem().update(world, 2.12)
    expect(world.accidents).toBe(0)
    expect(resident.state).toBe(ResidentState.Arrived)
  })
})
