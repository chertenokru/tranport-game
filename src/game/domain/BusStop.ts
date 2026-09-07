import type { Vector2 } from './geometry'
import type { BusStopId } from './ids'
import type { Direction } from '@/game/domain/Direction.ts'
import type { MapNodeId } from '@/game/world/MapNode'

export interface BusStop {
  readonly id: BusStopId
  readonly name: string
  readonly vehiclePosition: Vector2
  readonly waitingPosition: Vector2
  /** Orientation of the platform towards the road. */
  readonly direction: Direction
  /** The only bus heading served by this stop. */
  readonly travelDirection: Direction
  readonly roadNodeId: MapNodeId
}
