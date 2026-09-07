import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from './MapFactory'
import { BuildingType } from '@/game/domain/Building'
import { BusState } from '@/game/domain/Bus'
import { getRoadEndpoints } from '@/game/tools/getRoadEndpoints.ts'
import { Direction } from '@/game/domain/Direction.ts'

describe('createVerticalSliceWorld', () => {
  it('creates the initial buildings', () => {
    const world = createVerticalSliceWorld()

    expect(world.buildings).toHaveLength(2)

    expect(world.buildings.get('building-house')).toMatchObject({
      name: 'Жилой дом',
      type: BuildingType.Residential,
    })

    expect(world.buildings.get('building-office')).toMatchObject({
      name: 'Офис',
      type: BuildingType.Office,
    })
  })

  it('creates two bus stops', () => {
    const world = createVerticalSliceWorld()

    expect(world.stops).toHaveLength(2)
    expect(world.stops.has('stop-house')).toBe(true)
    expect(world.stops.has('stop-office')).toBe(true)
  })

  it('creates the main road', () => {
    const world = createVerticalSliceWorld()
    const road = world.roads.get('road-main')!

    expect(world.roads.size).toBe(1)

    expect(road).toMatchObject({
      position: { x: 480, y: 340 },
      length: 560,
      width: 64,
      direction: Direction.East,
    })

    expect(getRoadEndpoints(road)).toEqual({
      start: { x: 200, y: 340 },
      end: { x: 760, y: 340 },
    })
  })

  it('creates a bidirectional road graph', () => {
    const world = createVerticalSliceWorld()

    expect(world.roadNodes.size).toBe(4)
    expect(world.roadEdges.size).toBe(6)

    expect(world.roadEdges.get('edge-house-office')).toMatchObject({
      from: 'node-stop-house',
      to: 'node-stop-office',
      roadId: 'road-main',
      traversalCost: 440,
    })

    expect(world.roadEdges.get('edge-office-house')).toMatchObject({
      from: 'node-stop-office',
      to: 'node-stop-house',
    })
  })
  it('creates the initial bus route', () => {
    const world = createVerticalSliceWorld()
    const route = world.routes.get('route-main')!

    expect(world.routes.size).toBe(1)

    expect(route).toMatchObject({
      id: 'route-main',
      name: 'Маршрут 1',
    })

    expect(route.legs.map((leg) => [leg.fromStopId, leg.toStopId])).toEqual([
      ['stop-house', 'stop-office'],
      ['stop-office', 'stop-house'],
    ])
    expect(route.legs.reduce((sum, leg) => sum + leg.distance, 0)).toBe(1120)
  })

  it('creates the initial bus at the house stop', () => {
    const world = createVerticalSliceWorld()

    expect(world.buses.size).toBe(2)

    expect(world.buses.get('bus-main')).toMatchObject({
      routeId: 'route-main',
      vehicleTypeId: 'standard-bus',
      position: {
        x: 260,
        y: 340,
      },
      state: BusState.WaitingAtStop,
      legIndex: 0,
      pathIndex: 0,
      waitingSecondsRemaining: 1,
    })
  })

  it('leaves population creation to the simulation', () => {
    const world = createVerticalSliceWorld()
    expect(world.residents.size).toBe(0)
    expect(world.population.secondsUntilNextCycle).toBe(0)
  })
})
