import type { GameWorld } from '@/game/core/GameWorld.ts'
import type { BusStopId } from '@/game/domain/ids.ts'
import type { RouteLeg } from '@/game/domain/RouteLeg.ts'
import { findShortestRoadPath } from '@/game/tools/routing/findShortestRoadPath.ts'
import type { MapNode, MapNodeId } from '../../world/MapNode.ts'

interface Candidate {
  readonly legs: readonly RouteLeg[]
  readonly cost: number
}

function edgeKey(from: MapNodeId, to: MapNodeId): string {
  return JSON.stringify([from, to])
}

// Остановки одного полного круга.
// Первую остановку в конце списка повторять не нужно.
export function buildRouteLegs(
  world: GameWorld,
  stopIds: readonly BusStopId[],
): readonly RouteLeg[] | null {
  if (stopIds.length < 2) return null

  const stops: MapNode[] = []

  for (const stopId of stopIds) {
    if (!world.stops.has(stopId)) return null

    const nodes = [...world.roadNodes.values()].filter((node) => node.stopId === stopId)

    if (nodes.length !== 1) return null

    stops.push(nodes[0]!)
  }

  // Соседние посещения должны относиться к разным остановкам.
  // Проверяем также стык конца и начала круга.
  if (stops.some((stop, index) => stop.id === stops[(index + 1) % stops.length]!.id)) {
    return null
  }

  const incoming = new Map<MapNodeId, Set<MapNodeId>>()
  const edgeCosts = new Map<string, number>()

  for (const edge of world.roadEdges.values()) {
    if (!world.roadNodes.has(edge.from) || !world.roadNodes.has(edge.to)) {
      continue
    }

    const entries = incoming.get(edge.to) ?? new Set<MapNodeId>()
    entries.add(edge.from)
    incoming.set(edge.to, entries)

    const key = edgeKey(edge.from, edge.to)

    edgeCosts.set(key, Math.min(edgeCosts.get(key) ?? Infinity, edge.traversalCost))
  }

  let best: Candidate | null = null

  for (const initialFrom of incoming.get(stops[0]!.id) ?? []) {
    let candidates = new Map<MapNodeId, Candidate>([[initialFrom, { legs: [], cost: 0 }]])

    for (let index = 0; index < stops.length; index += 1) {
      const from = stops[index]!
      const to = stops[(index + 1) % stops.length]!

      // В конце круга возвращаемся в исходное состояние въезда.
      const arrivals = index === stops.length - 1 ? [initialFrom] : [...(incoming.get(to.id) ?? [])]

      const nextCandidates = new Map<MapNodeId, Candidate>()

      for (const [fromNodeId, candidate] of candidates) {
        for (const destinationFromNodeId of arrivals) {
          const nodeIds = findShortestRoadPath(world, from.id, to.id, {
            fromNodeId,
            destinationFromNodeId,
          })

          if (!nodeIds || nodeIds.length < 2) continue

          let distance = 0
          let cost = candidate.cost

          for (let nodeIndex = 1; nodeIndex < nodeIds.length; nodeIndex += 1) {
            const previousId = nodeIds[nodeIndex - 1]!
            const currentId = nodeIds[nodeIndex]!

            const previous = world.roadNodes.get(previousId)!
            const current = world.roadNodes.get(currentId)!

            distance += Math.hypot(
              current.position.x - previous.position.x,
              current.position.y - previous.position.y,
            )

            cost += edgeCosts.get(edgeKey(previousId, currentId))!
          }

          const existing = nextCandidates.get(destinationFromNodeId)

          if (existing && existing.cost <= cost) continue

          nextCandidates.set(destinationFromNodeId, {
            cost,
            legs: [
              ...candidate.legs,
              {
                fromStopId: stopIds[index]!,
                toStopId: stopIds[(index + 1) % stopIds.length]!,
                nodeIds,
                path: nodeIds.map((id) => ({ ...world.roadNodes.get(id)!.position })),
                distance,
              },
            ],
          })
        }
      }

      candidates = nextCandidates

      if (candidates.size === 0) break
    }

    const cycle = candidates.get(initialFrom)

    if (cycle && (!best || cycle.cost < best.cost)) {
      best = cycle
    }
  }

  return best?.legs ?? null
}
