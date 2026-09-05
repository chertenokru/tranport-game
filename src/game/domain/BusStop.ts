import type { Vector2 } from './geometry'
import type { BusStopId } from './ids'

export interface BusStop {
  readonly id: BusStopId
  readonly name: string
  readonly vehiclePosition: Vector2
  readonly waitingPosition: Vector2
}
