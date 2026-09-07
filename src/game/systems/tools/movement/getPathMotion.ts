import type { Vector2 } from '@/game/domain/geometry'

interface PathMotionInput {
  readonly position: Vector2
  readonly path: readonly Vector2[]
  readonly pathIndex: number
}

// Motion is linear until the next distinct waypoint; zero-length segments are skipped.
export function getPathMotion(input: PathMotionInput, speed: number) {
  for (let index = input.pathIndex; index < input.path.length; index++) {
    const target = input.path[index]!
    const x = target.x - input.position.x
    const y = target.y - input.position.y
    const distance = Math.hypot(x, y)
    if (distance === 0) continue
    return {
      velocity: { x: (x / distance) * speed, y: (y / distance) * speed },
      duration: distance / speed,
    }
  }
  return { velocity: { x: 0, y: 0 }, duration: Infinity }
}
