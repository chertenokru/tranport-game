import type { GameWorld } from '@/game/core/GameWorld'
import type { PedestrianCrossing } from '@/game/domain/PedestrianCrossing'
import type { Vector2 } from '@/game/domain/geometry'
import { CROSSINGS_CONFIG } from '@/game/config/crossings.config'
import { localToWorld } from '@/game/tools/geometry'

export function addPedestrianCrossing(world: GameWorld, id: string, roadId: string, distanceFromStart: number): PedestrianCrossing {
  const road = world.roads.get(roadId)
  const width = CROSSINGS_CONFIG.width
  if (!road || world.crossings.has(id) || !Number.isFinite(distanceFromStart) ||
    distanceFromStart <= width / 2 || distanceFromStart >= road.length - width / 2) {
    throw new Error(`Invalid crossing placement: "${id}"`)
  }
  const crossing: PedestrianCrossing = {
    id, roadId, width, roadWidth: road.width, direction: road.direction,
    position: localToWorld({ x: 0, y: distanceFromStart - road.length / 2 }, road.position, road.direction),
  }
  // The road graph is split at both boundaries. These are ordinary nodes, so
  // the existing routing rules do not permit turning around on a crossing.
  for (const [suffix, offset] of [['start', -width / 2], ['end', width / 2]] as const) {
    const position = localToWorld({ x: 0, y: offset }, crossing.position, crossing.direction)
    splitRoadEdges(world, roadId, `node-${id}-${suffix}`, position)
  }
  world.crossings.set(id, crossing)
  return crossing
}

function splitRoadEdges(world: GameWorld, roadId: string, nodeId: string, position: Vector2): void {
  const existing = [...world.roadNodes.values()].find((node) => node.position.x === position.x && node.position.y === position.y)
  if (existing) return
  const splits = [...world.roadEdges.values()].flatMap((edge) => {
    if (edge.roadId !== roadId) return []
    const from = world.roadNodes.get(edge.from)!.position
    const to = world.roadNodes.get(edge.to)!.position
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    const before = Math.hypot(position.x - from.x, position.y - from.y)
    const after = Math.hypot(to.x - position.x, to.y - position.y)
    return length > 0 && Math.abs(before + after - length) < 1e-7 ? [{ edge, ratio: before / length }] : []
  })
  if (!splits.length) throw new Error(`No road edge at crossing node "${nodeId}"`)
  world.roadNodes.set(nodeId, { id: nodeId, position })
  for (const { edge, ratio } of splits) {
    world.roadEdges.delete(edge.id)
    const first = { ...edge, id: `${edge.id}:${nodeId}:before`, to: nodeId, traversalCost: edge.traversalCost * ratio }
    const second = { ...edge, id: `${edge.id}:${nodeId}:after`, from: nodeId, traversalCost: edge.traversalCost * (1 - ratio) }
    world.roadEdges.set(first.id, first)
    world.roadEdges.set(second.id, second)
  }
}
