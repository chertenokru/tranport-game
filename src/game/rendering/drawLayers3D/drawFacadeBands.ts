import type { Building } from '@/game/domain/Building'
import { BuildingType } from '@/game/domain/Building'
import { IsometricCamera } from '../isometric/IsometricCamera'
import { localToWorld } from '@/game/tools/geometry'
import type { Context, Palette } from './shared3D'
import { COLORS } from './shared3D'
import { wallPanel } from './wallPanel'
import { drawFlatRect } from './drawFlatRect'
import { rectCorners } from './rectCorners'
import { getVisibleEdges } from './getVisibleEdges'
import { drawWorldLine } from './drawWorldLine'
import { fillPolygon } from './fillPolygon'

export function drawFacadeBands(
  context: Context,
  camera: IsometricCamera,
  building: Readonly<Building>,
  height: number,
  palette: Palette,
): void {
  const office = building.type === BuildingType.Office
  const shop = building.type === BuildingType.Shop
  const floors = shop ? 1 : office ? 4 : 3
  const corners = rectCorners(building.position, building.size, building.direction)
  const visibleEdges = getVisibleEdges(camera, building.position, corners)
  for (const [start, end] of visibleEdges) {
    const bays = Math.max(
      2,
      Math.floor(Math.hypot(end.x - start.x, end.y - start.y) / (office ? 17 : 26)),
    )
    wallPanel(context, camera, start, end, 0, 1, 0, 4, '#727c78')
    for (let floor = 0; floor < floors; floor++) {
      const bottom = 7 + floor * ((height - 12) / floors)
      const top = bottom + (shop ? 24 : office ? 16 : 13)
      for (let bay = 0; bay < bays; bay++) {
        const left = (bay + 0.13) / bays
        const right = (bay + 0.87) / bays
        wallPanel(
          context,
          camera,
          start,
          end,
          left - 0.018,
          right + 0.018,
          bottom - 1.2,
          top + 1.2,
          office ? '#bcc8c6' : '#f2efe6',
        )
        wallPanel(context, camera, start, end, left, right, bottom, top, '#24444d')
        wallPanel(
          context,
          camera,
          start,
          end,
          left + 0.018,
          right - 0.018,
          bottom + 1,
          top - 1,
          (floor + bay) % 3 === 0 ? '#879f9c' : '#507984',
        )
        wallPanel(context, camera, start, end, left, right, top - 3, top - 1, '#a8c2c5')
        const middle = (left + right) / 2
        wallPanel(
          context,
          camera,
          start,
          end,
          middle - 0.008,
          middle + 0.008,
          bottom,
          top,
          '#b9c5c2',
        )
        if (!office) {
          wallPanel(
            context,
            camera,
            start,
            end,
            left - 0.025,
            right + 0.025,
            bottom - 2,
            bottom - 0.8,
            palette.accent,
          )
        }
      }
      wallPanel(
        context,
        camera,
        start,
        end,
        0,
        1,
        bottom - 4,
        bottom - 2.5,
        office ? '#d1d6cf' : '#dedbd0',
      )
    }
    wallPanel(context, camera, start, end, 0, 1, height - 4, height, '#eef0e8')
    if (!office && !shop) {
      // Timber corner screen and open balconies distinguish housing from offices.
      for (let slat = 0; slat < 6; slat++) {
        wallPanel(
          context,
          camera,
          start,
          end,
          0.02 + slat * 0.012,
          0.028 + slat * 0.012,
          4,
          height - 5,
          slat % 2 ? '#ad8a5f' : '#836544',
        )
      }
      const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
      const outward = { x: midpoint.x - building.position.x, y: midpoint.y - building.position.y }
      const length = Math.hypot(outward.x, outward.y)
      const offset = { x: (outward.x / length) * 7, y: (outward.y / length) * 7 }
      const innerA = {
        x: start.x + (end.x - start.x) * 0.22,
        y: start.y + (end.y - start.y) * 0.22,
      }
      const innerB = {
        x: start.x + (end.x - start.x) * 0.78,
        y: start.y + (end.y - start.y) * 0.78,
      }
      const outerA = { x: innerA.x + offset.x, y: innerA.y + offset.y }
      const outerB = { x: innerB.x + offset.x, y: innerB.y + offset.y }
      for (const z of [27, 49]) {
        fillPolygon(
          context,
          [innerA, innerB, outerB, outerA].map((p) => camera.project(p, z)),
          '#bcb9ac',
        )
        wallPanel(context, camera, outerA, outerB, 0, 1, z, z + 6, 'rgba(125,161,165,0.4)')
        drawWorldLine(context, camera, outerA, outerB, '#536764', 0.8, z + 6)
        for (const t of [0, 0.25, 0.5, 0.75, 1])
          wallPanel(context, camera, outerA, outerB, t - 0.006, t + 0.006, z, z + 6, '#697773')
      }
    }
  }

  const doorPosition = localToWorld(
    { x: 0, y: building.size.y / 2 + 0.6 },
    building.position,
    building.direction,
  )
  if (camera.depth(doorPosition) <= camera.depth(building.position) + 0.25) return
  const frontLeft = localToWorld(
    { x: -building.size.x / 2, y: building.size.y / 2 },
    building.position,
    building.direction,
  )
  const frontRight = localToWorld(
    { x: building.size.x / 2, y: building.size.y / 2 },
    building.position,
    building.direction,
  )
  wallPanel(context, camera, frontLeft, frontRight, 0.39, 0.61, 0, 23, palette.accent)
  wallPanel(context, camera, frontLeft, frontRight, 0.42, 0.58, 1, 21, '#23474c')
  wallPanel(context, camera, frontLeft, frontRight, 0.495, 0.505, 1, 21, '#c4cfc9')
  const canopy = localToWorld(
    { x: 0, y: building.size.y / 2 + 5 },
    building.position,
    building.direction,
  )
  drawFlatRect(
    context,
    camera,
    canopy,
    { x: shop ? building.size.x - 6 : 30, y: 12 },
    building.direction,
    '#d5ded7',
    24,
  )
  if (shop) {
    for (let x = -building.size.x / 2 + 5; x < building.size.x / 2 - 4; x += 8) {
      drawFlatRect(
        context,
        camera,
        localToWorld({ x, y: building.size.y / 2 + 5 }, building.position, building.direction),
        { x: 4, y: 12 },
        building.direction,
        COLORS.cyanDark,
        24.2,
      )
    }
  }
}
