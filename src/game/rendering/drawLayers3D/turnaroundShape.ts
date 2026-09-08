import { Direction } from '@/game/domain/Direction'
import type { Vector2 } from '@/game/domain/geometry'
import { localToWorld } from '@/game/tools/geometry'

export function turnaroundShape(center: Vector2, direction: Direction, radius: number): Vector2[] {
  const localPoints: Vector2[] = [
    { x: -radius, y: radius },
    { x: radius, y: radius },
  ]
  const segments = 14
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI
    localPoints.push({
      x: Math.cos(angle) * radius,
      y: -Math.sin(angle) * radius,
    })
  }
  return localPoints.map((point) => localToWorld(point, center, direction))
}
