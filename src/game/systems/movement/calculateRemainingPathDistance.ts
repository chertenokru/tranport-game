import type { Vector2 } from '@/game/domain/geometry'

export interface RemainingPathDistanceInput {
  readonly position: Vector2
  readonly path: readonly Vector2[]
  readonly pathIndex: number
}

export function calculateRemainingPathDistance({
  position,
  path,
  pathIndex,
}: RemainingPathDistanceInput): number {
  if (!Number.isInteger(pathIndex) || pathIndex < 0) {
    throw new RangeError('Path index must be a non-negative integer')
  }

  let distance = 0
  let previousPosition = position

  for (let index = pathIndex; index < path.length; index += 1) {
    const target = path[index]

    if (!target) {
      continue
    }

    distance += Math.hypot(target.x - previousPosition.x, target.y - previousPosition.y)

    previousPosition = target
  }

  return distance
}
