import type { BusStopId } from './ids'
import type { MapNodeId } from '@/game/world/MapNode'
import type { Vector2 } from './geometry'

export interface RouteLeg {
  readonly fromStopId: BusStopId
  readonly toStopId: BusStopId
  readonly nodeIds: readonly MapNodeId[]
  readonly path: readonly Vector2[]
  readonly distance: number
}
