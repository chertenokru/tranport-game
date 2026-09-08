import type { BusStop } from '@/game/domain/BusStop'
import { IsometricCamera } from '../isometric/IsometricCamera'
import { localToWorld } from '@/game/tools/geometry'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { wallPanel } from './wallPanel'
import { drawBox } from './drawBox'
import { drawFlatRect } from './drawFlatRect'
import { rectCorners } from './rectCorners'
import { strokePolygon } from './strokePolygon'
import { drawSmallTag } from './drawSmallTag'

export function drawStop(context: Context, camera: IsometricCamera, stop: Readonly<BusStop>): void {
  const base = stop.waitingPosition
  const shelterCenter = localToWorld({ x: 0, y: -7 }, base, stop.direction)
  drawFlatRect(context, camera, shelterCenter, { x: 34, y: 16 }, stop.direction, '#b9c5c3', 2)
  const backLeft = localToWorld({ x: -16, y: -14 }, base, stop.direction)
  const backRight = localToWorld({ x: 16, y: -14 }, base, stop.direction)
  wallPanel(context, camera, backLeft, backRight, 0, 1, 3, 23, 'rgba(91,155,165,0.38)')
  for (const t of [0, 0.5, 1])
    wallPanel(context, camera, backLeft, backRight, t - 0.018, t + 0.018, 2, 24, '#527378')
  drawBox(
    context,
    camera,
    localToWorld({ x: 0, y: -10 }, base, stop.direction),
    { x: 25, y: 5 },
    stop.direction,
    2,
    { roof: '#b68a52', left: '#886741', right: '#715237', accent: '', glass: '' },
    7,
  )

  for (const x of [-14, 14]) {
    const post = localToWorld({ x, y: -6 }, base, stop.direction)
    const bottom = camera.project(post, 2)
    const top = camera.project(post, 24)
    context.strokeStyle = '#547176'
    context.lineWidth = 2 * camera.scale
    context.beginPath()
    context.moveTo(bottom.x, bottom.y)
    context.lineTo(top.x, top.y)
    context.stroke()
  }

  drawFlatRect(context, camera, shelterCenter, { x: 39, y: 20 }, stop.direction, '#bde2e4', 25)
  const roof = rectCorners(shelterCenter, { x: 39, y: 20 }, stop.direction).map((point) =>
    camera.project(point, 25),
  )
  strokePolygon(context, roof, COLORS.cyanDark, 1.4)

  const label = camera.project(shelterCenter, 39)
  drawSmallTag(context, label, stop.name)
}
