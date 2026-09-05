import type { BusStopId } from '@/game/domain/ids'
import type { Vector2 } from '@/game/domain/geometry'

export type MapNodeId = string

export interface MapNode {
  readonly id: MapNodeId
  readonly position: Vector2
  readonly stopId?: BusStopId
}
