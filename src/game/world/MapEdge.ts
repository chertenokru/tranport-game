import type { IntersectionId, RoadId } from '@/game/domain/ids'
import type { MapNodeId } from './MapNode'

export type MapEdgeId = string

export type MapEdgeOwner =
  | {
      readonly roadId: RoadId
      readonly intersectionId?: never
    }
  | {
      readonly intersectionId: IntersectionId
      readonly roadId?: never
    }

export type MapEdge = MapEdgeOwner & {
  readonly id: MapEdgeId
  readonly from: MapNodeId
  readonly to: MapNodeId
  readonly traversalCost: number
}
