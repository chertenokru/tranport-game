import { Direction } from '@/game/domain/Direction'
import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context, Palette } from './shared3D'
import { rectCorners } from './rectCorners'
import { fillPolygon } from './fillPolygon'
import { strokePolygon } from './strokePolygon'

export function drawBox(
  context: Context,
  camera: IsometricCamera,
  center: Vector2,
  size: Vector2,
  direction: Direction,
  height: number,
  palette: Palette,
  baseElevation = 0,
): void {
  const footprint = rectCorners(center, size, direction)
  const bottom = footprint.map((point) => camera.project(point, baseElevation))
  const top = footprint.map((point) => camera.project(point, baseElevation + height))
  const faces = footprint
    .map((_, index) => {
      const next = (index + 1) % footprint.length
      return {
        depth: (camera.depth(footprint[index]!) + camera.depth(footprint[next]!)) / 2,
        points: [bottom[index]!, bottom[next]!, top[next]!, top[index]!],
        color: index % 2 === 0 ? palette.left : palette.right,
      }
    })
    .filter((face) => face.depth > camera.depth(center) + 0.25)
  faces.sort((first, second) => first.depth - second.depth)
  for (const face of faces) fillPolygon(context, face.points, face.color)
  fillPolygon(context, top, palette.roof)
  strokePolygon(context, top, 'rgb(25 48 52 / 0.32)', Math.max(0.8, camera.scale))
}
