import type { GameWorld } from '@/game/core/GameWorld.ts'
import type { BusRoute } from '@/game/domain/BusRoute.ts'
import type { BusStopId } from '@/game/domain/ids.ts'
import type { MapNode } from '@/game/world/MapNode.ts'

import { findShortestRoadPath } from '../../tools/findShortestRoadPath.ts'

export function getRouteLegDistances(world: GameWorld, route: BusRoute): readonly number[] | null {
  const distances: number[] = []

  for (let stopIndex = 0; stopIndex < route.stopIds.length - 1; stopIndex += 1) {
    const currentStopId = route.stopIds[stopIndex]
    const nextStopId = route.stopIds[stopIndex + 1]

    if (!currentStopId || !nextStopId) {
      return null
    }

    const currentNode = findStopNode(world, currentStopId)
    const nextNode = findStopNode(world, nextStopId)

    if (!currentNode || !nextNode) {
      return null
    }

    const nodePath = findShortestRoadPath(world, currentNode.id, nextNode.id)

    if (!nodePath) {
      return null
    }

    let legDistance = 0

    for (let nodeIndex = 0; nodeIndex < nodePath.length - 1; nodeIndex += 1) {
      const fromNodeId = nodePath[nodeIndex]
      const toNodeId = nodePath[nodeIndex + 1]

      if (!fromNodeId || !toNodeId) {
        return null
      }

      const fromNode = world.roadNodes.get(fromNodeId)
      const toNode = world.roadNodes.get(toNodeId)

      if (!fromNode || !toNode) {
        return null
      }

      legDistance += Math.hypot(
        toNode.position.x - fromNode.position.x,
        toNode.position.y - fromNode.position.y,
      )
    }

    distances.push(legDistance)
  }

  return distances
}

function findStopNode(world: GameWorld, stopId: BusStopId): MapNode | undefined {
  for (const node of world.roadNodes.values()) {
    if (node.stopId === stopId) {
      return node
    }
  }

  return undefined
}
