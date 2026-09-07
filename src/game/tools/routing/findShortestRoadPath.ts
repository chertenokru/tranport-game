import type { RoadGraph } from './prepareRoadGraph'
import type { Intersection } from '@/game/domain/Intersection.ts'
import type { MapNode, MapNodeId } from '@/game/world/MapNode.ts'
import { getIntersectionExits } from '@/game/tools/getIntersectionExits.ts'
import type { Direction } from '@/game/domain/Direction'
import { getDirection } from '@/game/tools/geometry'

export interface RoadPathOptions {
  readonly fromNodeId?: MapNodeId
  readonly destinationFromNodeId?: MapNodeId
  readonly startDirection?: Direction
}

interface SearchState {
  readonly nodeId: MapNodeId
  readonly fromNodeId: MapNodeId | null

  cost: number
  previous: SearchState | null
}

export function findShortestRoadPath(
  graph: RoadGraph,
  startId: MapNodeId,
  destinationId: MapNodeId,
  options: RoadPathOptions = {},
): MapNodeId[] | null {
  const { fromNodeId, destinationFromNodeId } = options

  const startNode = graph.roadNodes.get(startId)

  if (!startNode || !graph.roadNodes.has(destinationId)) {
    return null
  }

  const startIntersection = getIntersection(graph, startNode)
  const initialFromNodeId: MapNodeId | null = fromNodeId ?? null

  if (fromNodeId !== undefined) {
    const hasIncomingEdge = graph.incoming.get(startId)?.has(fromNodeId)

    if (!graph.roadNodes.has(fromNodeId) || !hasIncomingEdge) {
      return null
    }
  }

  if (startIntersection) {
    const hasConnectedEntry = [...startIntersection.connections.values()].some(
      (nodeId) => nodeId === initialFromNodeId,
    )

    if (initialFromNodeId === null || !hasConnectedEntry) {
      return null
    }
  }
  const states = new Map<string, SearchState>()
  const pending = new Set<SearchState>()

  function getState(nodeId: MapNodeId, fromNodeId: MapNodeId | null): SearchState {
    const key = JSON.stringify([nodeId, fromNodeId])
    let state = states.get(key)

    if (!state) {
      state = {
        nodeId,
        fromNodeId,
        cost: Number.POSITIVE_INFINITY,
        previous: null,
      }

      states.set(key, state)
    }

    return state
  }

  const initial = getState(startId, initialFromNodeId)
  initial.cost = 0
  pending.add(initial)

  while (pending.size > 0) {
    let current: SearchState | null = null

    for (const candidate of pending) {
      if (!current || candidate.cost < current.cost) {
        current = candidate
      }
    }

    if (!current) {
      break
    }

    pending.delete(current)

    const reachedDestination = current.nodeId === destinationId

    const reachedRequiredEntry =
      destinationFromNodeId === undefined || current.fromNodeId === destinationFromNodeId

    if (reachedDestination && reachedRequiredEntry) {
      return reconstructPath(current)
    }

    const node = graph.roadNodes.get(current.nodeId)!

    const intersection = getIntersection(graph, node)
    let allowedTargets: Set<MapNodeId> | null = null

    if (intersection) {
      const entry = [...intersection.connections].find(
        ([, neighborId]) => neighborId === current.fromNodeId,
      )

      if (!entry) {
        continue
      }

      const exits = getIntersectionExits(intersection, entry[0])
      allowedTargets = new Set(exits.map((exit) => exit.nextNodeId))
    }

    for (const edge of graph.outgoing.get(current.nodeId) ?? []) {
      if (!graph.roadNodes.has(edge.to)) {
        continue
      }
      if (current === initial && options.startDirection !== undefined) {
        const target = graph.roadNodes.get(edge.to)!
        const direction = getDirection({
          x: target.position.x - node.position.x,
          y: target.position.y - node.position.y,
        })
        if (direction !== options.startDirection) continue
      }
      if (allowedTargets !== null && !allowedTargets.has(edge.to)) {
        continue
      }

      // На обычной точке нельзя немедленно развернуться.
      // На перекрёстке это определяется таблицей movements.
      if (!intersection && edge.to === current.fromNodeId) {
        continue
      }

      const next = getState(edge.to, current.nodeId)
      const cost = current.cost + edge.traversalCost

      if (cost >= next.cost) {
        continue
      }

      next.cost = cost
      next.previous = current
      pending.add(next)
    }
  }

  return null
}

function getIntersection(graph: RoadGraph, node: MapNode): Intersection | null {
  if (node.intersectionId === undefined) {
    return null
  }

  const intersection = graph.intersections.get(node.intersectionId)

  if (!intersection) {
    throw new Error(`Node "${node.id}" references missing intersection "${node.intersectionId}"`)
  }

  return intersection
}

function reconstructPath(destination: SearchState): MapNodeId[] {
  const path: MapNodeId[] = []
  let current: SearchState | null = destination

  while (current) {
    path.push(current.nodeId)
    current = current.previous
  }

  return path.reverse()
}
