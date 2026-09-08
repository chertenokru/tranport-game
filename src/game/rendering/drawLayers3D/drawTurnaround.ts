// noinspection JSSuspiciousNameCombination

import type { Intersection } from '@/game/domain/Intersection'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { turnaroundShape } from './turnaroundShape'
import { fillPolygon } from './fillPolygon'
import { localToWorld } from '@/game/tools/geometry.ts'
import { drawFlatRect } from '@/game/rendering/drawLayers3D/drawFlatRect.ts'

export function drawTurnaround(
  context: Context,
  camera: IsometricCamera,
  intersection: Readonly<Intersection>,
): void {
  const outer = turnaroundShape(
    intersection.position,
    intersection.direction,
    intersection.size / 2 + 5,
  )
  const inner = turnaroundShape(
    intersection.position,
    intersection.direction,
    intersection.size / 2,
  )
  fillPolygon(
    context,
    outer.map((point) => camera.project(point, 1)),
    COLORS.pavementEdge,
  )
  fillPolygon(
    context,
    inner.map((point) => camera.project(point, 2)),
    COLORS.asphalt,
  )
  const edgeWidth = 5

  const roadConnectionCenter = localToWorld(
    {
      x: 0,
      y: intersection.size / 2 + edgeWidth / 2,
    },
    intersection.position,
    intersection.direction,
  )

  drawFlatRect(
    context,
    camera,
    roadConnectionCenter,
    {
      x: intersection.size,
      y: edgeWidth,
    },
    intersection.direction,
    COLORS.asphalt,
    2,
  )
}
