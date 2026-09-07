import type { GameWorld } from '@/game/core/GameWorld'
import { getCrossingGeometry } from '@/game/tools/getCrossingGeometry'
import { getVehicleBounds } from '@/game/tools/getVehicleBounds'
import { getBusMotion } from '../tools/movement/getBusMotion'
import { isResidentWalking } from '../tools/movement/isResidentWalking'
import { getPedestrianSignal } from '@/game/tools/getPedestrianSignal'

export class PedestrianCrossingSystem {
  update(world: GameWorld, elapsedSeconds: number = world.transportTimeSeconds): void {
    for (const [id, occupants] of world.crossingOccupants) {
      for (const residentId of occupants) {
        const resident = world.residents.get(residentId)
        if (!world.crossings.has(id) || !resident || !isResidentWalking(resident.state) ||
          resident.path[resident.pathIndex]?.crossingId !== id) occupants.delete(residentId)
      }
      if (occupants.size === 0) world.crossingOccupants.delete(id)
    }
    for (const crossing of world.crossings.values()) {
      if (getPedestrianSignal(crossing, elapsedSeconds)?.pedestriansCanEnter === false) continue
      if (world.trafficZoneOwners.has(crossing.id)) continue
      const { halfSize } = getCrossingGeometry(crossing)
      const busInside = [...world.buses.values()].some((bus) => {
        const { direction } = getBusMotion(world, bus)
        const body = getVehicleBounds({ ...bus, direction })
        return Math.abs(body.position.x - crossing.position.x) < body.halfSize.x + halfSize.x - 1e-7 &&
          Math.abs(body.position.y - crossing.position.y) < body.halfSize.y + halfSize.y - 1e-7
      })
      if (busInside) continue
      for (const resident of world.residents.values()) {
        if (!isResidentWalking(resident.state) || resident.path[resident.pathIndex]?.crossingId !== crossing.id) continue
        const occupants = world.crossingOccupants.get(crossing.id) ?? new Set<string>()
        occupants.add(resident.id)
        world.crossingOccupants.set(crossing.id, occupants)
      }
    }
  }
}
