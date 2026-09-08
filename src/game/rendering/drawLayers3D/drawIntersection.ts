import { Direction } from '@/game/domain/Direction'
import type { Intersection } from '@/game/domain/Intersection'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { drawTurnaround } from './drawTurnaround'
import { drawFlatRect } from './drawFlatRect'

export function drawIntersection(
  context: Context,
  camera: IsometricCamera,
  intersection: Readonly<Intersection>,
): void {
  const turnaround = intersection.connections.size === 1
  if (turnaround) {
    drawTurnaround(context, camera, intersection)
    return
  }

  drawFlatRect(
    context,
    camera,
    intersection.position,
    { x: intersection.size + 10, y: intersection.size + 10 },
    Direction.South,
    COLORS.pavementEdge,
    1,
  )
  drawFlatRect(
    context,
    camera,
    intersection.position,
    { x: intersection.size, y: intersection.size },
    Direction.South,
    COLORS.asphalt,
    2,
  )
}
