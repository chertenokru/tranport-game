import type { GameWorld } from '@/game/core/GameWorld'
import type { BusStop } from '@/game/domain/BusStop'
import type { BusStopId } from '@/game/domain/ids'
import type { RouteLeg } from '@/game/domain/RouteLeg'
import type { MapNodeId } from '@/game/world/MapNode'
import { getDirection } from '@/game/tools/geometry'
import { findShortestRoadPath } from './findShortestRoadPath'
import { prepareRoadGraph, type RoadGraph } from './prepareRoadGraph'

interface Candidate {
  readonly legs: readonly RouteLeg[]
  readonly cost: number
}

function getArrivals(graph: RoadGraph, stop: BusStop): MapNodeId[] {
  const node = graph.roadNodes.get(stop.roadNodeId)
  if (
    !node ||
    node.position.x !== stop.vehiclePosition.x ||
    node.position.y !== stop.vehiclePosition.y
  )
    return []
  return [...(graph.incoming.get(node.id) ?? [])].filter((id) => {
    const previous = graph.roadNodes.get(id)!
    return (
      getDirection({
        x: node.position.x - previous.position.x,
        y: node.position.y - previous.position.y,
      }) === stop.travelDirection
    )
  })
}

function createLeg(
  graph: RoadGraph,
  from: BusStop,
  to: BusStop,
  nodeIds: readonly MapNodeId[],
): RouteLeg | null {
  const path = nodeIds.map((id) => ({ ...graph.roadNodes.get(id)!.position }))
  let distance = 0
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1]!
    const current = path[index]!
    distance += Math.hypot(current.x - previous.x, current.y - previous.y)
  }
  if (!Number.isFinite(distance) || distance <= 0) return null
  return { fromStopId: from.id, toStopId: to.id, nodeIds, path, distance }
}

function extendCandidates(
  graph: RoadGraph,
  from: BusStop,
  to: BusStop,
  candidates: ReadonlyMap<MapNodeId, Candidate>,
  arrivals: readonly MapNodeId[],
): Map<MapNodeId, Candidate> {
  const next = new Map<MapNodeId, Candidate>()
  for (const [fromNodeId, candidate] of candidates) {
    for (const destinationFromNodeId of arrivals) {
      const nodeIds = findShortestRoadPath(graph, from.roadNodeId, to.roadNodeId, {
        fromNodeId,
        destinationFromNodeId,
        startDirection: from.travelDirection,
      })
      if (!nodeIds || nodeIds.length < 2) continue
      const cost =
        candidate.cost +
        nodeIds
          .slice(1)
          .reduce((sum, id, index) => sum + graph.costs.get(nodeIds[index]!)!.get(id)!, 0)
      if ((next.get(destinationFromNodeId)?.cost ?? Infinity) <= cost) continue
      const leg = createLeg(graph, from, to, nodeIds)
      if (leg) next.set(destinationFromNodeId, { cost, legs: [...candidate.legs, leg] })
    }
  }
  return next
}

// Список задаёт полный круг без повторения однонаправленных остановок.
export function buildRouteLegs(
  world: GameWorld,
  stopIds: readonly BusStopId[],
): readonly RouteLeg[] | null {
  if (stopIds.length < 2 || new Set(stopIds).size !== stopIds.length) return null
  const stops: BusStop[] = []
  for (const id of stopIds) {
    const stop = world.stops.get(id)
    if (!stop) return null
    stops.push(stop)
  }
  const graph = prepareRoadGraph(world)
  const arrivals = stops.map((stop) => getArrivals(graph, stop))
  if (arrivals.some((entries) => entries.length === 0)) return null

  let best: Candidate | null = null
  for (const initialFrom of arrivals[0]!) {
    let candidates = new Map<MapNodeId, Candidate>([[initialFrom, { legs: [], cost: 0 }]])
    for (let index = 0; index < stops.length && candidates.size > 0; index += 1) {
      const nextIndex = (index + 1) % stops.length
      candidates = extendCandidates(
        graph,
        stops[index]!,
        stops[nextIndex]!,
        candidates,
        nextIndex === 0 ? [initialFrom] : arrivals[nextIndex]!,
      )
    }
    const cycle = candidates.get(initialFrom)
    if (cycle && (!best || cycle.cost < best.cost)) best = cycle
  }
  return best?.legs ?? null
}
