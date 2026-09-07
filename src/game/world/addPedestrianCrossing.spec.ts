import { describe, expect, it } from 'vitest'
import { createIShapedWorld } from './createIShapedWorld'
import { prepareRoadGraph } from '@/game/tools/routing/prepareRoadGraph'
import { findShortestRoadPath } from '@/game/tools/routing/findShortestRoadPath'

describe('pedestrian crossings in the road graph', () => {
  it('splits every crossing into entry and exit nodes without breaking routes', () => {
    const world = createIShapedWorld()

    expect(world.crossings.size).toBe(5)
    for (const crossing of world.crossings.values()) {
      const start = world.roadNodes.get(`node-${crossing.id}-start`)
      const end = world.roadNodes.get(`node-${crossing.id}-end`)
      expect(start).toBeDefined()
      expect(end).toBeDefined()
      expect(
        Math.hypot(end!.position.x - start!.position.x, end!.position.y - start!.position.y),
      ).toBe(crossing.width)
      expect(
        [...world.roadEdges.values()].some(
          (edge) => edge.from === start!.id && edge.to === end!.id,
        ),
      ).toBe(true)
      expect(
        [...world.roadEdges.values()].some(
          (edge) => edge.from === end!.id && edge.to === start!.id,
        ),
      ).toBe(true)
    }

    expect(
      findShortestRoadPath(
        prepareRoadGraph(world),
        'road-upper-left-start',
        'road-lower-right-end',
      ),
    ).not.toBeNull()
  })

  it('includes crossing boundary nodes in compiled bus geometry', () => {
    const world = createIShapedWorld()
    const nodes = [...world.routes.values()].flatMap((route) =>
      route.legs.flatMap((leg) => leg.nodeIds),
    )
    for (const crossing of world.crossings.values()) {
      expect(nodes).toContain(`node-${crossing.id}-start`)
      expect(nodes).toContain(`node-${crossing.id}-end`)
    }
  })
})
