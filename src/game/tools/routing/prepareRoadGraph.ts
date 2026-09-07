import type { GameWorld } from '@/game/core/GameWorld'
import type { MapNodeId } from '@/game/world/MapNode'
import type { MapEdge } from '@/game/world/MapEdge'

export interface RoadGraph {
  readonly roadNodes: GameWorld['roadNodes']
  readonly intersections: GameWorld['intersections']
  readonly incoming: ReadonlyMap<MapNodeId, ReadonlySet<MapNodeId>>
  readonly outgoing: ReadonlyMap<MapNodeId, readonly MapEdge[]>
  readonly costs: ReadonlyMap<MapNodeId, ReadonlyMap<MapNodeId, number>>
}

// Prepared once for a route build; no cache survives changes to the map.
export function prepareRoadGraph(world: GameWorld): RoadGraph {
  const incoming = new Map<MapNodeId, Set<MapNodeId>>()
  const outgoing = new Map<MapNodeId, MapEdge[]>()
  const costs = new Map<MapNodeId, Map<MapNodeId, number>>()

  for (const edge of world.roadEdges.values()) {
    if (!Number.isFinite(edge.traversalCost) || edge.traversalCost < 0) {
      throw new RangeError('Road edge cost must be finite and non-negative')
    }
    if (!world.roadNodes.has(edge.from) || !world.roadNodes.has(edge.to)) continue

    const entries = incoming.get(edge.to) ?? new Set<MapNodeId>()
    entries.add(edge.from)
    incoming.set(edge.to, entries)

    const exits = outgoing.get(edge.from) ?? []
    exits.push(edge)
    outgoing.set(edge.from, exits)

    const weights = costs.get(edge.from) ?? new Map<MapNodeId, number>()
    weights.set(edge.to, Math.min(weights.get(edge.to) ?? Infinity, edge.traversalCost))
    costs.set(edge.from, weights)
  }

  return {
    roadNodes: world.roadNodes,
    intersections: world.intersections,
    incoming,
    outgoing,
    costs,
  }
}
