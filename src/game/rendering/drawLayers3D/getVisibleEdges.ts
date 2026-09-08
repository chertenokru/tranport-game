import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'

export function getVisibleEdges(
  camera: IsometricCamera,
  center: Vector2,
  corners: readonly Vector2[],
): ReadonlyArray<readonly [Vector2, Vector2]> {
  const centerDepth = camera.depth(center)
  const edges: Array<readonly [Vector2, Vector2]> = []
  for (let index = 0; index < corners.length; index += 1) {
    const start = corners[index]!
    const end = corners[(index + 1) % corners.length]!
    if ((camera.depth(start) + camera.depth(end)) / 2 > centerDepth + 0.25) {
      edges.push([start, end])
    }
  }
  return edges
}
