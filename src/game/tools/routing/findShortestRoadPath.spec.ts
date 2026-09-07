import { prepareRoadGraph } from '@/game/tools/routing/prepareRoadGraph'
import { findShortestRoadPath } from '@/game/tools/routing/findShortestRoadPath.ts'
import { GameWorld } from '@/game/core/GameWorld.ts'
import { describe, expect, it } from 'vitest'
import { createVerticalSliceWorld } from '@/game/world/MapFactory.ts'

describe('findShortestRoadPath', () => {
  it('finds the forward path', () => {
    const world = createVerticalSliceWorld()

    expect(
      findShortestRoadPath(prepareRoadGraph(world), 'node-stop-house', 'node-stop-office'),
    ).toEqual(['node-stop-house', 'node-stop-office'])
  })

  it('finds the reverse path', () => {
    const world = createVerticalSliceWorld()

    expect(
      findShortestRoadPath(prepareRoadGraph(world), 'node-stop-office', 'node-stop-house'),
    ).toEqual(['node-stop-office', 'node-stop-house'])
  })

  it('returns null for an unknown node', () => {
    const world = createVerticalSliceWorld()

    expect(
      findShortestRoadPath(prepareRoadGraph(world), 'unknown-node', 'node-stop-office'),
    ).toBeNull()
  })

  it('returns null when a destination is unreachable', () => {
    const world = createVerticalSliceWorld()

    world.roadNodes.set('isolated-node', {
      id: 'isolated-node',
      position: {
        x: 500,
        y: 100,
      },
    })

    expect(
      findShortestRoadPath(prepareRoadGraph(world), 'node-stop-house', 'isolated-node'),
    ).toBeNull()
  })
  it('replaces an earlier path with a cheaper alternative', () => {
    const world = new GameWorld()

    world.roadNodes.set('A', {
      id: 'A',
      position: { x: 0, y: 0 },
    })

    world.roadNodes.set('B', {
      id: 'B',
      position: { x: 10, y: 0 },
    })

    world.roadNodes.set('C', {
      id: 'C',
      position: { x: 0, y: 10 },
    })

    world.roadNodes.set('D', {
      id: 'D',
      position: { x: 10, y: 10 },
    })

    world.roadEdges.set('A-B', {
      id: 'A-B',
      from: 'A',
      to: 'B',
      roadId: 'test-road',
      traversalCost: 10,
    })

    world.roadEdges.set('A-C', {
      id: 'A-C',
      from: 'A',
      to: 'C',
      roadId: 'test-road',
      traversalCost: 12,
    })

    world.roadEdges.set('B-D', {
      id: 'B-D',
      from: 'B',
      to: 'D',
      roadId: 'test-road',
      traversalCost: 100,
    })

    world.roadEdges.set('C-D', {
      id: 'C-D',
      from: 'C',
      to: 'D',
      roadId: 'test-road',
      traversalCost: 1,
    })

    expect(findShortestRoadPath(prepareRoadGraph(world), 'A', 'D')).toEqual(['A', 'C', 'D'])
  })
})
