import type { GameWorld } from '@/game/core/GameWorld.ts'
import type { Intersection } from '@/game/domain/Intersection.ts'
import type { MapEdge } from '@/game/world/MapEdge.ts'
import type { MapNode, MapNodeId } from '@/game/world/MapNode.ts'
import { getIntersectionExits } from '@/game/tools/getIntersectionExits.ts'

export interface RoadPathOptions {
  readonly fromNodeId?: MapNodeId
  readonly destinationFromNodeId?: MapNodeId
}

interface SearchState {
  readonly nodeId: MapNodeId
  readonly fromNodeId: MapNodeId | null

  distance: number
  previous: SearchState | null
}

export function findShortestRoadPath(
  world: GameWorld,
  startId: MapNodeId,
  destinationId: MapNodeId,
  options: RoadPathOptions = {},
): MapNodeId[] | null {
  const { fromNodeId, destinationFromNodeId } = options

  const startNode = world.roadNodes.get(startId)

  if (!startNode || !world.roadNodes.has(destinationId)) {
    return null
  }

  const startIntersection = getIntersection(world, startNode)
  const initialFromNodeId: MapNodeId | null = fromNodeId ?? null

  if (fromNodeId !== undefined) {
    const hasIncomingEdge = [...world.roadEdges.values()].some(
      (edge) => edge.from === fromNodeId && edge.to === startId,
    )

    if (!world.roadNodes.has(fromNodeId) || !hasIncomingEdge) {
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
  const outgoingEdges = new Map<MapNodeId, MapEdge[]>()

  for (const edge of world.roadEdges.values()) {
    if (!Number.isFinite(edge.traversalCost) || edge.traversalCost < 0) {
      throw new RangeError('Road edge cost must be finite and non-negative')
    }

    const edges = outgoingEdges.get(edge.from) ?? []
    edges.push(edge)
    outgoingEdges.set(edge.from, edges)
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
        distance: Number.POSITIVE_INFINITY,
        previous: null,
      }

      states.set(key, state)
    }

    return state
  }

  const initial = getState(startId, initialFromNodeId)
  initial.distance = 0
  pending.add(initial)

  while (pending.size > 0) {
    let current: SearchState | null = null

    for (const candidate of pending) {
      if (!current || candidate.distance < current.distance) {
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

    const node = world.roadNodes.get(current.nodeId)!

    const intersection = getIntersection(world, node)
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

    for (const edge of outgoingEdges.get(current.nodeId) ?? []) {
      if (!world.roadNodes.has(edge.to)) {
        continue
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
      const distance = current.distance + edge.traversalCost

      if (distance >= next.distance) {
        continue
      }

      next.distance = distance
      next.previous = current
      pending.add(next)
    }
  }

  return null
}

function getIntersection(world: GameWorld, node: MapNode): Intersection | null {
  if (node.intersectionId === undefined) {
    return null
  }

  const intersection = world.intersections.get(node.intersectionId)

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
