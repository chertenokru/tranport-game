import type { Vector2 } from './geometry'
import type { BusId, ResidentId, RouteId } from './ids'

export type BusState = 'moving' | 'waitingAtStop'

export interface Bus {
  readonly id: BusId
  readonly vehicleTypeId: string
  readonly routeId: RouteId
  readonly speed: number
  readonly capacity: number
  readonly size: Vector2
  readonly stopWaitSeconds: number
  readonly passengerIds: ResidentId[]

  position: Vector2
  state: BusState
  currentStopIndex: number
  direction: 1 | -1
  path: readonly Vector2[]
  pathIndex: number
  waitingSecondsRemaining: number
}
