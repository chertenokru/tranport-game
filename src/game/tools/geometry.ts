import { Direction } from '@/game/domain/Direction'
import type { Vector2 } from '@/game/domain/geometry'

// Исходная геометрия направлена вниз — South.
// Координата Y растёт вниз, как на canvas.
const DIRECTION_ANGLES: Record<Direction, number> = {
  [Direction.South]: 0,
  [Direction.West]: Math.PI / 2,
  [Direction.North]: Math.PI,
  [Direction.East]: -Math.PI / 2,
}

export function getDirectionAngle(direction: Direction): number {
  return DIRECTION_ANGLES[direction]
}

export function rotatePoint(point: Vector2, direction: Direction): Vector2 {
  switch (direction) {
    case Direction.South:
      return { x: point.x, y: point.y }

    case Direction.West:
      // noinspection JSSuspiciousNameCombination
      return { x: -point.y, y: point.x }

    case Direction.North:
      return { x: -point.x, y: -point.y }

    case Direction.East:
      // noinspection JSSuspiciousNameCombination
      return { x: point.y, y: -point.x }
  }
}

export function localToWorld(point: Vector2, origin: Vector2, direction: Direction): Vector2 {
  const rotated = rotatePoint(point, direction)

  return {
    x: origin.x + rotated.x,
    y: origin.y + rotated.y,
  }
}

export function getDirection(vector: Vector2): Direction | null {
  if (vector.x === 0 && vector.y === 0) {
    return null
  }

  if (Math.abs(vector.x) >= Math.abs(vector.y)) {
    return vector.x > 0 ? Direction.East : Direction.West
  }

  return vector.y > 0 ? Direction.South : Direction.North
}
