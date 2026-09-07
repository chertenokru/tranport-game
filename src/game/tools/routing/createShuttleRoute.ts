import type { GameWorld } from '@/game/core/GameWorld'
import type { BusRoute } from '@/game/domain/BusRoute'
import type { BusStopId, RouteId } from '@/game/domain/ids'
import { buildRouteLegs } from './buildRouteLegs'

export interface ShuttleRouteDefinition {
  readonly id: RouteId
  readonly name: string
  readonly stopIds: readonly BusStopId[]
}

export function createShuttleRoute(world: GameWorld, definition: ShuttleRouteDefinition): BusRoute {
  const stopIds = [...definition.stopIds]
  const cycleStopIds = [...stopIds, ...stopIds.slice(1, -1).reverse()]
  const legs = buildRouteLegs(world, cycleStopIds)

  if (!legs) {
    throw new Error(`Cannot build a complete cycle for route "${definition.id}"`)
  }

  return {
    id: definition.id,
    name: definition.name,
    legs,
  }
}
