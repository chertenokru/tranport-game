import { Direction } from '@/game/domain/Direction'
import type { Intersection } from '@/game/domain/Intersection'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { drawTurnaround } from './drawTurnaround'
import { drawFlatRect } from './drawFlatRect'
import { localToWorld } from '@/game/tools/geometry.ts'

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

  // drawFlatRect(
  //   context,
  //   camera,
  //   intersection.position,
  //   { x: intersection.size + 10, y: intersection.size + 10 },
  //   Direction.South,
  //   COLORS.pavementEdge,
  //   1,
  // )
  // drawFlatRect(
  //   context,
  //   camera,
  //   intersection.position,
  //   { x: intersection.size, y: intersection.size },
  //   Direction.South,
  //   COLORS.asphalt,
  //   2,
  // )
  drawFlatRect(
    context,
    camera,
    intersection.position,
    { x: intersection.size, y: intersection.size },
    Direction.South,
    COLORS.asphalt,
    2,
  )

  const edgeWidth = 5
  const edgeOffset = intersection.size / 2 + edgeWidth / 2
  const edgeLength = intersection.size + edgeWidth * 2

  for (const side of Object.values(Direction)) {
    if (intersection.connections.has(side)) continue

    switch (side) {
      case Direction.North:
        drawFlatRect(
          context,
          camera,
          localToWorld({ x: 0, y: -edgeOffset }, intersection.position, Direction.South),
          { x: edgeLength, y: edgeWidth },
          Direction.South,
          COLORS.pavementEdge,
          1,
        )
        break

      case Direction.South:
        drawFlatRect(
          context,
          camera,
          localToWorld({ x: 0, y: edgeOffset }, intersection.position, Direction.South),
          { x: edgeLength, y: edgeWidth },
          Direction.South,
          COLORS.pavementEdge,
          1,
        )
        break

      case Direction.West:
        drawFlatRect(
          context,
          camera,
          localToWorld({ x: -edgeOffset, y: 0 }, intersection.position, Direction.South),
          { x: edgeWidth, y: edgeLength },
          Direction.South,
          COLORS.pavementEdge,
          1,
        )
        break

      case Direction.East:
        drawFlatRect(
          context,
          camera,
          localToWorld({ x: edgeOffset, y: 0 }, intersection.position, Direction.South),
          { x: edgeWidth, y: edgeLength },
          Direction.South,
          COLORS.pavementEdge,
          1,
        )
        break
    }
  }
}
