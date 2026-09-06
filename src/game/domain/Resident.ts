import type { Vector2 } from './geometry'
import type { BuildingId, BusStopId, ResidentId, RouteId } from './ids'
import type { TransportDecision } from './TransportDecision'

export type ResidentState =
  | 'idleInBuilding'
  | 'choosingTransport'
  | 'walking'
  | 'walkingToStop'
  | 'waitingBus'
  | 'insideBus'
  | 'walkingFromStop'
  | 'crossingRoad'
  | 'arrived'
  | 'dead'

export interface TransitJourney {
  readonly routeId: RouteId
  readonly boardingStopId: BusStopId
  readonly destinationStopId: BusStopId
}

export interface ResidentJourney {
  readonly originBuildingId: BuildingId
  readonly destinationBuildingId: BuildingId
  transit: TransitJourney | null
}

export interface Resident {
  readonly id: ResidentId
  readonly walkingSpeed: number
  readonly busTimeAdvantageFactor: number
  readonly radius: number

  currentBuildingId: BuildingId | null
  journey: ResidentJourney | null
  transportDecision: TransportDecision | null
  position: Vector2
  state: ResidentState
  path: readonly Vector2[]
  pathIndex: number
}
