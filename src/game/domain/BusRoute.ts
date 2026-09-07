import type { RouteId } from './ids'
import type { RouteLeg } from './RouteLeg'

export interface BusRoute {
  readonly id: RouteId
  readonly name: string
  readonly legs: readonly RouteLeg[]
}
