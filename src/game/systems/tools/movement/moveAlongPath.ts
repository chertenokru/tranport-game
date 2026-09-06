import type { Vector2 } from '@/game/domain/geometry.ts'

export interface MoveAlongPathInput {
  readonly position: Vector2
  readonly path: readonly Vector2[]
  readonly pathIndex: number
  readonly maxDistance: number
}

export interface MoveAlongPathResult {
  readonly position: Vector2
  readonly pathIndex: number
  readonly completed: boolean
  readonly remainingDistance: number
  readonly heading: Vector2 | null
}

export function moveAlongPath({
  position,
  path,
  pathIndex,
  maxDistance,
}: MoveAlongPathInput): MoveAlongPathResult {
  if (!Number.isFinite(maxDistance) || maxDistance < 0) {
    throw new RangeError('Maximum movement distance must be finite and non-negative')
  }

  if (!Number.isInteger(pathIndex) || pathIndex < 0) {
    throw new RangeError('Path index must be a non-negative integer')
  }

  let currentPosition = position
  let currentPathIndex = pathIndex
  let remainingDistance = maxDistance
  let heading: Vector2 | null = null
  while (currentPathIndex < path.length) {
    const target = path[currentPathIndex]

    if (!target) {
      break
    }

    const offsetX = target.x - currentPosition.x
    const offsetY = target.y - currentPosition.y
    const distance = Math.hypot(offsetX, offsetY)

    if (distance === 0) {
      currentPosition = target
      currentPathIndex++
      continue
    }
    if (remainingDistance > 0) {
      heading = {
        x: offsetX / distance,
        y: offsetY / distance,
      }
    }

    if (remainingDistance < distance) {
      const movementRatio = remainingDistance / distance

      currentPosition = {
        x: currentPosition.x + offsetX * movementRatio,
        y: currentPosition.y + offsetY * movementRatio,
      }

      remainingDistance = 0
      break
    }

    currentPosition = target
    currentPathIndex++
    remainingDistance -= distance
  }

  return {
    position: currentPosition,
    pathIndex: currentPathIndex,
    completed: currentPathIndex >= path.length,
    remainingDistance,
    heading,
  }
}
