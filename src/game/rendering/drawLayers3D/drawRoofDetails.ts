import type { Building } from '@/game/domain/Building'
import { IsometricCamera } from '../isometric/IsometricCamera'
import { localToWorld } from '@/game/tools/geometry'
import type { Context, Palette } from './shared3D'
import { drawBox } from './drawBox'
import { drawFlatRect } from './drawFlatRect'
import { rectCorners } from './rectCorners'
import { fillPolygon } from './fillPolygon'
import { strokePolygon } from './strokePolygon'

export function drawRoofDetails(
  context: Context,
  camera: IsometricCamera,
  building: Readonly<Building>,
  height: number,
  palette: Palette,
): void {
  const roofCorners = rectCorners(
    building.position,
    { x: building.size.x - 7, y: building.size.y - 7 },
    building.direction,
  )
  strokePolygon(
    context,
    roofCorners.map((point) => camera.project(point, height + 1)),
    '#929c98',
    1.5,
  )
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = localToWorld(
        { x: -building.size.x * 0.32 + col * 9, y: -building.size.y * 0.33 + row * 9 },
        building.position,
        building.direction,
      )
      drawFlatRect(context, camera, cell, { x: 8, y: 8 }, building.direction, '#294753', height + 2)
      strokePolygon(
        context,
        rectCorners(cell, { x: 8, y: 8 }, building.direction).map((p) =>
          camera.project(p, height + 2),
        ),
        '#96aeb1',
        0.5,
      )
    }
  }
  const panelCenter = localToWorld({ x: -12, y: -3 }, building.position, building.direction)
  drawFlatRect(
    context,
    camera,
    panelCenter,
    { x: Math.min(36, building.size.x * 0.38), y: Math.min(24, building.size.y * 0.38) },
    building.direction,
    '#285967',
    height + 2,
  )
  const panel = rectCorners(
    panelCenter,
    { x: Math.min(36, building.size.x * 0.38), y: Math.min(24, building.size.y * 0.38) },
    building.direction,
  ).map((point) => camera.project(point, height + 3))
  strokePolygon(context, panel, '#74b9c1', 1)

  const utilityPosition = localToWorld({ x: 24, y: 2 }, building.position, building.direction)
  drawBox(
    context,
    camera,
    utilityPosition,
    { x: 18, y: 14 },
    building.direction,
    8,
    {
      roof: '#c6cdca',
      left: '#7e8c8c',
      right: '#667778',
      accent: palette.accent,
      glass: palette.glass,
    },
    height,
  )
  for (const offset of [-5, 5]) {
    const fan = localToWorld({ x: 24 + offset, y: 2 }, building.position, building.direction)
    const ring = Array.from({ length: 16 }, (_, i) => {
      const angle = (i * Math.PI) / 8
      return camera.project(
        { x: fan.x + Math.cos(angle) * 3.4, y: fan.y + Math.sin(angle) * 3.4 },
        height + 8.2,
      )
    })
    fillPolygon(context, ring, '#405253')
    strokePolygon(context, ring, '#d1d8d4', 0.7)
  }
}
