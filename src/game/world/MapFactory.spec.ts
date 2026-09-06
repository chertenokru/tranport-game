import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from './MapFactory'

describe('createVerticalSliceWorld', () => {
  it('creates the initial buildings', () => {
    const world = createVerticalSliceWorld()

    expect(world.buildings).toHaveLength(2)

    expect(world.buildings.get('building-house')).toMatchObject({
      name: 'Жилой дом',
      type: 'residential',
    })

    expect(world.buildings.get('building-office')).toMatchObject({
      name: 'Офис',
      type: 'office',
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

    expect(world.roads.size).toBe(1)
    expect(world.roads.get('road-main')).toMatchObject({
      width: 64,
      start: {
        x: 200,
        y: 340,
      },
      end: {
        x: 760,
        y: 340,
      },
    })
  })
  it('creates a bidirectional road graph', () => {
    const world = createVerticalSliceWorld()

    expect(world.roadNodes.size).toBe(2)
    expect(world.roadEdges.size).toBe(2)

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

    expect(world.routes.size).toBe(1)

    expect(world.routes.get('route-main')).toEqual({
      id: 'route-main',
      name: 'Маршрут 1',
      stopIds: ['stop-house', 'stop-office'],
    })
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
      state: 'waitingAtStop',
      currentStopIndex: 0,
      direction: 1,
      path: [],
      pathIndex: 0,
      waitingSecondsRemaining: 1,
    })
  })

  it('creates the initial pedestrian at the house', () => {
    const world = createVerticalSliceWorld()
    const pedestrian = world.pedestrians.get('pedestrian-main')

    expect(world.pedestrians.size).toBe(1)

    expect(pedestrian).toMatchObject({
      originBuildingId: 'building-house',
      destinationBuildingId: 'building-office',
      position: {
        x: 140,
        y: 280,
      },
      state: 'choosingTransport',
      pathIndex: 0,
    })
  })
})
