import type { Direction } from '@/game/domain/Direction'
import type { Intersection } from '@/game/domain/Intersection'
import type { MapNodeId } from '@/game/world/MapNode'

export interface IntersectionExit {
  readonly direction: Direction
  readonly nextNodeId: MapNodeId
}

export function getIntersectionExits(
  intersection: Intersection,
  entrySide: Direction,
): IntersectionExit[] {
  if (!intersection.connections.has(entrySide)) {
    return []
  }

  const allowedDirections = intersection.movements.get(entrySide)

  if (!allowedDirections) {
    return []
  }

  const exits: IntersectionExit[] = []

  for (const direction of allowedDirections) {
    const nextNodeId = intersection.connections.get(direction)

    if (nextNodeId === undefined) {
      throw new Error(
        `Intersection "${intersection.id}" allows an exit through disconnected side "${direction}"`,
      )
    }

    exits.push({ direction, nextNodeId })
  }

  return exits
}
