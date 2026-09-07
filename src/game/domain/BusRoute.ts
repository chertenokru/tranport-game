import type { RouteId } from './ids'
import type { RouteLeg } from './RouteLeg'

export interface BusRoute {
  readonly id: RouteId
  readonly name: string
  /** A complete cycle; every fromStopId occurs exactly once. */
  readonly legs: readonly RouteLeg[]
}
