import type { Vector2 } from './geometry'
import type { BuildingId, BusStopId, PedestrianId, RouteId } from './ids'

export type PedestrianState =
  | 'choosingTransport'
  | 'walking'
  | 'walkingToStop'
  | 'waitingBus'
  | 'insideBus'
  | 'walkingFromStop'
  | 'crossingRoad'
  | 'arrived'
  | 'idleInBuilding'
  | 'dead'

export interface Pedestrian {
  readonly id: PedestrianId
  readonly originBuildingId: BuildingId
  readonly destinationBuildingId: BuildingId
  readonly walkingSpeed: number
  readonly radius: number
  readonly routeId: RouteId
  readonly boardingStopId: BusStopId
  readonly destinationStopId: BusStopId

  position: Vector2
  state: PedestrianState
  path: readonly Vector2[]
  pathIndex: number
}
