import type { Vector2 } from '@/game/domain/geometry'

/** Entry and exit along a ray through a box centered at the origin. */
export function getRayBoxInterval(position: Vector2, velocity: Vector2, halfSize: Vector2) {
  let enter = -Infinity
  let exit = Infinity
  for (const axis of ['x', 'y'] as const) {
    if (velocity[axis] === 0) {
      if (Math.abs(position[axis]) > halfSize[axis]) return null
      continue
    }
    const first = (-halfSize[axis] - position[axis]) / velocity[axis]
    const second = (halfSize[axis] - position[axis]) / velocity[axis]
    enter = Math.max(enter, Math.min(first, second))
    exit = Math.min(exit, Math.max(first, second))
    if (enter > exit) return null
  }
  return { enter, exit }
}
