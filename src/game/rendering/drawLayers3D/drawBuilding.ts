import type { Building } from '@/game/domain/Building'
import { BuildingType } from '@/game/domain/Building'
import { IsometricCamera } from '../isometric/IsometricCamera'
import type { Context } from './shared3D'
import { BUILDING_PALETTES } from './shared3D'
import { drawFacadeBands } from './drawFacadeBands'
import { drawRoofDetails } from './drawRoofDetails'
import { drawBox } from './drawBox'
import { drawSoftShadow } from './drawSoftShadow'
import { drawLabel } from './drawLabel'

export function drawBuilding(
  context: Context,
  camera: IsometricCamera,
  building: Readonly<Building>,
  residentsCount: number,
): void {
  const palette = BUILDING_PALETTES[building.type]
  const height = {
    [BuildingType.Residential]: 70,
    [BuildingType.Office]: 94,
    [BuildingType.Shop]: 47,
  }[building.type]

  drawSoftShadow(context, camera, building.position, building.size, building.direction, height)
  drawBox(context, camera, building.position, building.size, building.direction, height, palette)
  drawFacadeBands(context, camera, building, height, palette)
  drawRoofDetails(context, camera, building, height, palette)

  const labelPosition = camera.project(building.position, height + 28)
  drawLabel(context, labelPosition, building.name, `ЖИТЕЛИ  ${residentsCount}`, palette.accent)
}
