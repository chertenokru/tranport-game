import type { Vector2 } from '@/game/domain/geometry'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { fillPolygon } from './fillPolygon'

// Facade details are actual vertical quadrilaterals, including their height;
// they share the camera projection with the wall rather than screen-space strokes.
export function wallPanel(
  context: Context,
  camera: IsometricCamera,
  start: Vector2,
  end: Vector2,
  left: number,
  right: number,
  bottom: number,
  top: number,
  color: string,
): void {
  const at = (t: number) => ({
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  })
  fillPolygon(
    context,
    [
      camera.project(at(left), bottom),
      camera.project(at(right), bottom),
      camera.project(at(right), top),
      camera.project(at(left), top),
    ],
    color,
  )
}
