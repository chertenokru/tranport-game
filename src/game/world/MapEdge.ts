import type { RoadId } from '@/game/domain/ids'

import type { MapNodeId } from './MapNode'

export type MapEdgeId = string

export interface MapEdge {
  readonly id: MapEdgeId
  readonly from: MapNodeId
  readonly to: MapNodeId
  readonly roadId: RoadId
  readonly traversalCost: number
}
