import type { GameWorld } from '@/game/core/GameWorld'
import type { BusRoute } from '@/game/domain/BusRoute'
import type { BusStopId, RouteId } from '@/game/domain/ids'
import { buildRouteLegs } from './buildRouteLegs'

export interface BusRouteDefinition {
  readonly id: RouteId
  readonly name: string
  readonly stopIds: readonly BusStopId[]
}

export function createBusRoute(world: GameWorld, definition: BusRouteDefinition): BusRoute {
  const legs = buildRouteLegs(world, definition.stopIds)

  if (!legs) {
    throw new Error(`Cannot build a complete cycle for route "${definition.id}"`)
  }

  return {
    id: definition.id,
    name: definition.name,
    legs,
  }
}
