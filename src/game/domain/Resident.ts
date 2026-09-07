import type { Vector2 } from './geometry'
import type { BuildingId, BusStopId, ResidentId, RouteId } from './ids'
import type { TransportDecision } from './TransportDecision'

export enum ResidentState {
  IdleInBuilding = 'idleInBuilding',
  ChoosingTransport = 'choosingTransport',
  Walking = 'walking',
  WalkingToStop = 'walkingToStop',
  WaitingBus = 'waitingBus',
  InsideBus = 'insideBus',
  WalkingFromStop = 'walkingFromStop',
  CrossingRoad = 'crossingRoad',
  Arrived = 'arrived',
  Dead = 'dead',
}

export interface TransitJourney {
  readonly routeId: RouteId
  readonly boardingStopId: BusStopId
  readonly destinationStopId: BusStopId
  readonly boardingLegIndex: number
  readonly destinationLegIndex: number
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
