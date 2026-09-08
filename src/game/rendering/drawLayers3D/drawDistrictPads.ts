import { Direction } from '@/game/domain/Direction'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { drawPlanters } from './drawPlanters'
import { drawFlatRect } from './drawFlatRect'
import { drawWorldLine } from './drawWorldLine'

export function drawDistrictPads(context: Context, camera: IsometricCamera): void {
  const pads = [
    { center: { x: 180, y: 68 }, size: { x: 176, y: 132 } },
    { center: { x: 780, y: 68 }, size: { x: 176, y: 132 } },
    { center: { x: 180, y: 632 }, size: { x: 176, y: 132 } },
    { center: { x: 780, y: 632 }, size: { x: 176, y: 132 } },
    { center: { x: 558, y: 280 }, size: { x: 112, y: 108 } },
  ]

  for (const pad of pads) {
    drawFlatRect(context, camera, pad.center, pad.size, Direction.South, COLORS.pavementEdge, 0)
    drawFlatRect(
      context,
      camera,
      pad.center,
      { x: pad.size.x - 7, y: pad.size.y - 7 },
      Direction.South,
      COLORS.pavement,
      1,
    )
    for (let x = -pad.size.x / 2 + 12; x < pad.size.x / 2; x += 12) {
      drawWorldLine(
        context,
        camera,
        { x: pad.center.x + x, y: pad.center.y - pad.size.y / 2 + 4 },
        { x: pad.center.x + x, y: pad.center.y + pad.size.y / 2 - 4 },
        '#c1c5be',
        0.45,
        1.1,
      )
    }
    for (let y = -pad.size.y / 2 + 12; y < pad.size.y / 2; y += 12) {
      drawWorldLine(
        context,
        camera,
        { x: pad.center.x - pad.size.x / 2 + 4, y: pad.center.y + y },
        { x: pad.center.x + pad.size.x / 2 - 4, y: pad.center.y + y },
        '#c1c5be',
        0.45,
        1.1,
      )
    }
    drawPlanters(context, camera, pad.center, pad.size)
  }
}
