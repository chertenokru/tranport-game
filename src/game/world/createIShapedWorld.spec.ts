import { describe, expect, it } from 'vitest'

import { Direction } from '@/game/domain/Direction'
import { findShortestRoadPath } from '@/game/tools/routing/findShortestRoadPath.ts'
import { createIShapedWorld } from './createIShapedWorld'
import { BusState } from '@/game/domain/Bus.ts'
import { BusMovementSystem } from '@/game/systems/BusMovementSystem.ts'

const START = 'road-upper-left-start'
const DESTINATION = 'road-lower-right-end'

describe('createIShapedWorld', () => {
  it('connects opposite branches through both intersections', () => {
    const world = createIShapedWorld()
    const path = findShortestRoadPath(world, START, DESTINATION)

    expect(path?.[0]).toBe(START)
    expect(path?.at(-1)).toBe(DESTINATION)

    const intersectionNodes = path?.filter(
      (id) => world.roadNodes.get(id)?.intersectionId !== undefined,
    )

    expect(intersectionNodes).toEqual(['node-intersection-upper', 'node-intersection-lower'])
  })

  it('supports the reverse journey on the bidirectional map', () => {
    const world = createIShapedWorld()

    const forward = findShortestRoadPath(world, START, DESTINATION)
    const backward = findShortestRoadPath(world, DESTINATION, START)

    expect(forward).not.toBeNull()
    expect(backward).toEqual(forward?.slice().reverse())
  })

  it('uses a turnaround to bypass a forbidden turn', () => {
    const world = createIShapedWorld()
    const upper = world.intersections.get('intersection-upper')!

    const movements = new Map(upper.movements)
    movements.set(Direction.West, new Set([Direction.East]))

    world.intersections.set(upper.id, {
      ...upper,
      movements,
    })

    const path = findShortestRoadPath(world, START, DESTINATION)

    const intersectionIds = path?.flatMap((nodeId) => {
      const intersectionId = world.roadNodes.get(nodeId)?.intersectionId
      return intersectionId === undefined ? [] : [intersectionId]
    })

    expect(intersectionIds).toEqual([
      'intersection-upper',
      'intersection-upper-right-turnaround',
      'intersection-upper',
      'intersection-lower',
    ])
  })

  it('can make the middle road one-way', () => {
    const world = createIShapedWorld()

    for (const [id, edge] of world.roadEdges) {
      if (edge.roadId !== 'road-middle') {
        continue
      }

      const from = world.roadNodes.get(edge.from)!
      const to = world.roadNodes.get(edge.to)!

      if (to.position.y > from.position.y) {
        world.roadEdges.delete(id)
      }
    }

    expect(findShortestRoadPath(world, START, DESTINATION)).toBeNull()

    expect(findShortestRoadPath(world, DESTINATION, START)).not.toBeNull()
  })

  it('passes through stops along the connected roads', () => {
    const world = createIShapedWorld()
    const path = findShortestRoadPath(world, START, DESTINATION)

    const stopIds = path?.flatMap((nodeId) => {
      const stopId = world.roadNodes.get(nodeId)?.stopId
      return stopId === undefined ? [] : [stopId]
    })

    expect(stopIds).toEqual(['stop-upper-house', 'stop-shop', 'stop-lower-office'])
  })

  it('connects every stop in both directions', () => {
    const world = createIShapedWorld()

    expect(world.stops.size).toBe(5)

    for (const stop of world.stops.values()) {
      const nodes = [...world.roadNodes.values()].filter((node) => node.stopId === stop.id)

      expect(nodes).toHaveLength(1)

      const node = nodes[0]!

      expect(node.position).toEqual(stop.vehiclePosition)
      expect(findShortestRoadPath(world, START, node.id)).not.toBeNull()
      expect(findShortestRoadPath(world, node.id, START)).not.toBeNull()
    }
  })
  it.each(['route-upper-lower', 'route-lower-upper'])('completes a round trip on %s', (routeId) => {
    const world = createIShapedWorld()
    const system = new BusMovementSystem()

    const route = world.routes.get(routeId)!
    const bus = world.buses.get(`bus-${routeId}`)!

    expect(route).toBeDefined()
    expect(bus).toBeDefined()

    const visitedStopIndices = [bus.legIndex]
    const movementDirections = new Set<Direction>()

    // До 60 секунд игрового времени, с остановкой после полного рейса.
    for (let step = 0; step < 240 && visitedStopIndices.length < 5; step += 1) {
      system.update(world, 0.25)

      if (bus.state === BusState.Moving) {
        movementDirections.add(bus.direction)
        continue
      }

      if (bus.legIndex === visitedStopIndices.at(-1)) {
        continue
      }

      const stopId = route.legs[bus.legIndex]!.fromStopId
      const stop = world.stops.get(stopId)!

      expect(bus.position).toEqual(stop.vehiclePosition)

      visitedStopIndices.push(bus.legIndex)
    }

    expect(visitedStopIndices).toEqual([0, 1, 2, 3, 0])

    expect(movementDirections).toEqual(
      new Set([Direction.East, Direction.South, Direction.West, Direction.North]),
    )
  })
  it('continues past the terminal stop and reverses at the turnaround', () => {
    const world = createIShapedWorld()
    const system = new BusMovementSystem()
    const bus = world.buses.get('bus-route-upper-lower')!

    bus.position = {
      ...world.stops.get('stop-lower-office')!.vehiclePosition,
    }
    bus.legIndex = 2
    bus.direction = Direction.East
    bus.waitingSecondsRemaining = 0

    system.update(world, 0)

    expect(bus.state).toBe(BusState.Moving)
    expect(bus.legIndex).toBe(2)

    expect(world.routes.get(bus.routeId)!.legs[bus.legIndex]!.path.slice(0, 5)).toEqual([
      { x: 864, y: 550 },
      { x: 896, y: 550 },
      { x: 928, y: 550 },
      { x: 896, y: 550 },
      { x: 864, y: 550 },
    ])

    system.update(world, 0.5)

    expect(bus.position).toEqual({ x: 904, y: 550 })
    expect(bus.direction).toBe(Direction.East)

    system.update(world, 0.5)

    expect(bus.position).toEqual({ x: 912, y: 550 })
    expect(bus.direction).toBe(Direction.West)
  })

  it('executes the prepared cycle without reading the road graph', () => {
    const world = createIShapedWorld()
    const system = new BusMovementSystem()
    const bus = world.buses.get('bus-route-upper-lower')!
    const route = world.routes.get(bus.routeId)!

    // After compilation, execution only needs the route geometry.
    world.roadNodes.clear()
    world.roadEdges.clear()
    world.intersections.clear()

    system.update(world, bus.waitingSecondsRemaining)
    system.update(world, route.legs[0]!.distance / bus.speed)

    expect(bus.state).toBe(BusState.WaitingAtStop)
    expect(bus.legIndex).toBe(1)
    expect(bus.position).toEqual(route.legs[1]!.path[0])
  })
})
