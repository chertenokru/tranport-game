import { PEDESTRIANS_CONFIG } from '@/game/config/pedestrians.config'
import type { Building } from '@/game/domain/Building'
import type { ResidentId } from '@/game/domain/ids'
import { ResidentState, type Resident } from '@/game/domain/Resident'

export function createResident(id: ResidentId, building: Building): Resident {
  return {
    id,
    ...PEDESTRIANS_CONFIG.default,
    currentBuildingId: building.id,
    journey: null,
    transportDecision: null,
    position: { ...building.entrance },
    state: ResidentState.IdleInBuilding,
    path: [],
    pathIndex: 0,
  }
}
