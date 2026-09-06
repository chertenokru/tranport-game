import { describe, expect, it } from 'vitest'

import { createVerticalSliceWorld } from '@/game/world/MapFactory'

import { getRouteLegDistances } from './getRouteLegDistances'

describe('getRouteLegDistances', () => {
  it('calculates distances through the road graph', () => {
    const world = createVerticalSliceWorld()
    const route = world.routes.get('route-main')

    if (!route) {
      throw new Error('Main route is missing')
    }

    expect(getRouteLegDistances(world, route)).toEqual([440])
  })

  it('includes intermediate road nodes', () => {
    const world = createVerticalSliceWorld()
    const route = world.routes.get('route-main')

    if (!route) {
      throw new Error('Main route is missing')
    }

    world.roadEdges.delete('edge-house-office')

    world.roadNodes.set('node-detour', {
      id: 'node-detour',
      position: {
        x: 480,
        y: 440,
      },
    })

    world.roadEdges.set('edge-house-detour', {
      id: 'edge-house-detour',
      from: 'node-stop-house',
      to: 'node-detour',
      roadId: 'road-main',
      traversalCost: 242,
    })

    world.roadEdges.set('edge-detour-office', {
      id: 'edge-detour-office',
      from: 'node-detour',
      to: 'node-stop-office',
      roadId: 'road-main',
      traversalCost: 242,
    })

    const distances = getRouteLegDistances(world, route)

    expect(distances).not.toBeNull()
    expect(distances?.[0]).toBeCloseTo(Math.hypot(220, 100) * 2)
  })

  it('returns null when stops are disconnected', () => {
    const world = createVerticalSliceWorld()
    const route = world.routes.get('route-main')

    if (!route) {
      throw new Error('Main route is missing')
    }

    world.roadEdges.delete('edge-house-office')

    expect(getRouteLegDistances(world, route)).toBeNull()
  })
})
