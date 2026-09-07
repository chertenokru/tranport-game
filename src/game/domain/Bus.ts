import type { Vector2 } from './geometry'
import type { BusId, ResidentId, RouteId } from './ids'
import type { Direction } from '@/game/domain/Direction.ts'

export enum BusState {
  Moving = 'moving',
  WaitingAtStop = 'waitingAtStop',
}

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
  // У остановившегося автобуса это следующий участок, у движущегося — текущий.
  legIndex: number
  direction: Direction
  pathIndex: number
  waitingSecondsRemaining: number
  collisionCount: number
}
