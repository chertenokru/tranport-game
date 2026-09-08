import type { Road } from '@/game/domain/Road'
import { IsometricCamera } from '../isometric/IsometricCamera'
import { localToWorld } from '@/game/tools/geometry'
import type { Context } from './shared3D'
import { COLORS } from './shared3D'
import { drawFlatRect } from './drawFlatRect'
import { drawWorldLine } from './drawWorldLine'

export function drawRoad(context: Context, camera: IsometricCamera, road: Readonly<Road>): void {
  drawFlatRect(
    context,
    camera,
    road.position,
    { x: road.width + 10, y: road.length + 10 },
    road.direction,
    COLORS.pavementEdge,
    1,
  )
  drawFlatRect(
    context,
    camera,
    road.position,
    { x: road.width, y: road.length },
    road.direction,
    COLORS.asphalt,
    2,
  )

  // Deterministic surface aggregate: stable while panning, never random per frame.
  for (let i = 0; i < Math.floor(road.length * 1.4); i++) {
    const x = ((i * 37.17) % (road.width - 4)) - road.width / 2 + 2
    const y = ((i * 19.73) % road.length) - road.length / 2
    drawFlatRect(
      context,
      camera,
      localToWorld({ x, y }, road.position, road.direction),
      { x: 0.65, y: 0.95 },
      road.direction,
      i % 2 ? '#455055' : '#303d42',
      2.05,
    )
  }
  // for (let offset = -road.length / 2 + 18; offset < road.length / 2 - 8; offset += 35) {
  //   const start = localToWorld({ x: 0, y: offset }, road.position, road.direction)
  //   const end = localToWorld(
  //     { x: 0, y: Math.min(offset + 17, road.length / 2) },
  //     road.position,
  //     road.direction,
  //   )
  //   drawWorldLine(context, camera, start, end, COLORS.lane, 1.7, 3)
  // }

  const laneStart = localToWorld({ x: 0, y: -road.length / 2 }, road.position, road.direction)

  const laneEnd = localToWorld({ x: 0, y: road.length / 2 }, road.position, road.direction)

  drawWorldLine(context, camera, laneStart, laneEnd, COLORS.lane, 1.7, 3)

  for (const side of [-1, 1]) {
    const start = localToWorld(
      { x: side * (road.width / 2 - 3), y: -road.length / 2 },
      road.position,
      road.direction,
    )
    const end = localToWorld(
      { x: side * (road.width / 2 - 3), y: road.length / 2 },
      road.position,
      road.direction,
    )
    drawWorldLine(context, camera, start, end, '#839094', 1, 3)
  }
}
