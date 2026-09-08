import type { GameWorld } from '@/game/core/GameWorld'
import { ResidentState } from '@/game/domain/Resident'
import type { CanvasFrame } from '../CanvasLayer'
import type { IsometricView } from '../isometric/IsometricCamera'
import { IsometricCamera } from '../isometric/IsometricCamera'
import { DecisionIndicators } from '../tools/DecisionIndicators'
import { groupVisibleResidents } from '../tools/groupVisibleResidents'
import { localToWorld } from '@/game/tools/geometry'
import type { Renderable } from './shared3D'
import { drawBackdrop } from './drawBackdrop'
import { drawGround } from './drawGround'
import { drawDistrictPads } from './drawDistrictPads'
import { drawDistrictTree } from './drawDistrictTree'
import { drawRoad } from './drawRoad'
import { drawIntersection } from './drawIntersection'
import { drawCrossing } from './drawCrossing'
import { drawBuilding } from './drawBuilding'
import { drawStop } from './drawStop'
import { drawBus } from './drawBus'
import { drawResident } from './drawResident'
import { drawDeadResident } from './drawDeadResident'
import { drawDecisionIndicator } from './drawDecisionIndicator'
import { drawMapPlate } from './drawMapPlate'
import { drawVignette } from './drawVignette'

export function drawScene3D(
  frame: CanvasFrame,
  world: GameWorld,
  indicators: DecisionIndicators,
  view: IsometricView,
): void {
  const { context, width, height, timeMs } = frame
  const camera = new IsometricCamera(width, height, view)
  context.clearRect(0, 0, width, height)
  drawBackdrop(context, width, height)
  drawGround(context, camera)
  drawDistrictPads(context, camera)

  for (const road of world.roads.values()) drawRoad(context, camera, road)
  for (const intersection of world.intersections.values()) {
    drawIntersection(context, camera, intersection)
  }
  for (const crossing of world.crossings.values()) {
    drawCrossing(context, camera, crossing, timeMs / 1_000)
  }

  const residents = [...world.residents.values()]
  const visibleGroups = groupVisibleResidents(residents)
  const renderables: Renderable[] = []

  for (const building of world.buildings.values()) {
    const count = residents.filter(
      (resident) =>
        resident.currentBuildingId === building.id &&
        resident.state === ResidentState.IdleInBuilding,
    ).length
    renderables.push({
      depth: camera.depth(building.position),
      draw: () => drawBuilding(context, camera, building, count),
    })
    for (const side of [-1, 1]) {
      const tree = localToWorld(
        { x: side * (building.size.x / 2 + 12), y: -building.size.y / 2 + 9 },
        building.position,
        building.direction,
      )
      renderables.push({
        depth: camera.depth(tree),
        draw: () => drawDistrictTree(context, camera, tree),
      })
    }
  }

  for (const stop of world.stops.values()) {
    renderables.push({
      depth: camera.depth(stop.waitingPosition) + 12,
      draw: () => drawStop(context, camera, stop),
    })
  }

  for (const bus of world.buses.values()) {
    renderables.push({
      depth: camera.depth(bus.position) + 20,
      draw: () => drawBus(context, camera, bus),
    })
  }

  for (const group of visibleGroups) {
    const resident = group[0]!
    renderables.push({
      depth: camera.depth(resident.position) + 20,
      draw: () => drawResident(context, camera, resident, group.length),
    })
  }

  for (const resident of residents) {
    if (resident.state !== ResidentState.Dead) continue
    renderables.push({
      depth: camera.depth(resident.position),
      draw: () => drawDeadResident(context, camera, resident),
    })
  }

  renderables.sort((first, second) => first.depth - second.depth)
  for (const renderable of renderables) renderable.draw()

  indicators.update(residents, timeMs)
  for (const group of visibleGroups) {
    const resident = group[0]!
    const indicator = indicators.get(resident)
    if (indicator) {
      drawDecisionIndicator(
        context,
        camera,
        resident,
        indicator.decision,
        indicator.expiresAt - timeMs,
        width,
      )
    }
  }

  drawMapPlate(context, world.money)
  drawVignette(context, width, height)
}
