import type { GameWorld } from '@/game/core/GameWorld'
import type { MapNodeId } from '@/game/world/MapNode'

export function findShortestRoadPath(
  world: GameWorld,
  startId: MapNodeId,
  destinationId: MapNodeId,
): MapNodeId[] | null {
  if (!world.roadNodes.has(startId) || !world.roadNodes.has(destinationId)) {
    return null
  }

  const distances = new Map<MapNodeId, number>()
  const previousNodes = new Map<MapNodeId, MapNodeId>()
  const unvisitedNodes = new Set(world.roadNodes.keys())

  for (const nodeId of world.roadNodes.keys()) {
    distances.set(nodeId, Number.POSITIVE_INFINITY)
  }

  distances.set(startId, 0)

  while (unvisitedNodes.size > 0) {
    let currentId: MapNodeId | null = null
    let currentDistance = Number.POSITIVE_INFINITY

    for (const nodeId of unvisitedNodes) {
      const distance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY

      if (distance < currentDistance) {
        currentId = nodeId
        currentDistance = distance
      }
    }

    if (currentId === null) {
      break
    }

    if (currentId === destinationId) {
      return reconstructPath(previousNodes, startId, destinationId)
    }

    unvisitedNodes.delete(currentId)

    for (const edge of world.roadEdges.values()) {
      if (edge.from !== currentId || !unvisitedNodes.has(edge.to)) {
        continue
      }

      const candidateDistance = currentDistance + edge.traversalCost

      const knownDistance = distances.get(edge.to) ?? Number.POSITIVE_INFINITY

      if (candidateDistance < knownDistance) {
        distances.set(edge.to, candidateDistance)
        previousNodes.set(edge.to, currentId)
      }
    }
  }

  return null
}

function reconstructPath(
  previousNodes: ReadonlyMap<MapNodeId, MapNodeId>,
  startId: MapNodeId,
  destinationId: MapNodeId,
): MapNodeId[] | null {
  const path: MapNodeId[] = [destinationId]
  let currentId = destinationId

  while (currentId !== startId) {
    const previousId = previousNodes.get(currentId)

    if (!previousId) {
      return null
    }

    path.push(previousId)
    currentId = previousId
  }

  return path.reverse()
}
