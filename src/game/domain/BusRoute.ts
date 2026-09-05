import type { BusStopId, RouteId } from './ids'

export interface BusRoute {
  readonly id: RouteId
  readonly name: string
  readonly stopIds: readonly BusStopId[]
}
