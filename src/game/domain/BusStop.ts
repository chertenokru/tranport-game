import type { Vector2 } from './geometry'
import type { BusStopId } from './ids'
import type { Direction } from '@/game/domain/Direction.ts'

export interface BusStop {
  readonly id: BusStopId
  readonly name: string
  readonly vehiclePosition: Vector2
  readonly waitingPosition: Vector2
  readonly direction: Direction
}
