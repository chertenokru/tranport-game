import { createVerticalSliceWorld } from '@/game/world/MapFactory'
import { createResident } from '@/game/world/createResident'
import { ResidentState } from '@/game/domain/Resident'

export function createWorldWithResident() {
  const world = createVerticalSliceWorld()
  const resident = createResident('resident-main', world.buildings.get('building-house')!)
  resident.currentBuildingId = null
  resident.journey = {
    originBuildingId: 'building-house',
    destinationBuildingId: 'building-office',
    transit: {
      routeId: 'route-main',
      boardingStopId: 'stop-house',
      destinationStopId: 'stop-office',
    },
  }
  resident.state = ResidentState.ChoosingTransport
  world.residents.set(resident.id, resident)
  return world
}
