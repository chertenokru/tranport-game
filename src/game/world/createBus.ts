import type { VehicleTypeConfig } from '@/game/config/vehicles.config'
import { type Bus, BusState } from '@/game/domain/Bus'
import type { BusRoute } from '@/game/domain/BusRoute'
import type { BusId } from '@/game/domain/ids'
import { getDirection } from '@/game/tools/geometry'

export function createBus(
  route: BusRoute,
  id: BusId,
  vehicle: VehicleTypeConfig,
  legIndex = 0,
): Bus {
  if (
    !Number.isFinite(vehicle.speed) ||
    vehicle.speed <= 0 ||
    !Number.isFinite(vehicle.stopWaitSeconds) ||
    vehicle.stopWaitSeconds < 0
  ) {
    throw new RangeError('Bus speed must be positive and dwell time non-negative')
  }
  const leg = route.legs[legIndex]
  const previous = route.legs[(legIndex + route.legs.length - 1) % route.legs.length]
  const position = leg?.path[0]
  const approach = previous?.path
    .slice()
    .reverse()
    .find((point) => point.x !== position?.x || point.y !== position?.y)

  if (!position || !approach) {
    throw new Error(`Cannot place bus "${id}" on route "${route.id}"`)
  }

  const direction = getDirection({
    x: position.x - approach.x,
    y: position.y - approach.y,
  })!

  return {
    id,
    vehicleTypeId: vehicle.id,
    routeId: route.id,
    speed: vehicle.speed,
    capacity: vehicle.capacity,
    size: { ...vehicle.size },
    stopWaitSeconds: vehicle.stopWaitSeconds,
    passengerIds: [],
    position: { ...position },
    state: BusState.WaitingAtStop,
    legIndex,
    direction,
    pathIndex: 0,
    waitingSecondsRemaining: vehicle.stopWaitSeconds,
    collisionCount: 0,
  }
}
