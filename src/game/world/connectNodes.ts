import type { GameWorld } from '@/game/core/GameWorld'
import type { MapEdgeOwner } from './MapEdge'
import type { MapNodeId } from './MapNode'

export function connectNodes(
  world: GameWorld,
  fromId: MapNodeId,
  toId: MapNodeId,
  owner: MapEdgeOwner,
): void {
  const from = world.roadNodes.get(fromId)
  const to = world.roadNodes.get(toId)

  if (!from || !to) {
    throw new Error(`Cannot connect missing road nodes: "${fromId}" → "${toId}"`)
  }

  const traversalCost = Math.hypot(to.position.x - from.position.x, to.position.y - from.position.y)

  if (!Number.isFinite(traversalCost)) {
    throw new Error('Road node coordinates must be finite')
  }

  // В текущем графе между двумя узлами храним одно ребро
  // для каждого направления.
  const id = JSON.stringify([fromId, toId])

  world.roadEdges.set(id, {
    ...owner,
    id,
    from: fromId,
    to: toId,
    traversalCost,
  })
}
