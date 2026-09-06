import { PEDESTRIANS_CONFIG } from '@/game/config/pedestrians.config'
import type { Building } from '@/game/domain/Building'
import type { ResidentId } from '@/game/domain/ids'
import { type Resident, ResidentState } from '@/game/domain/Resident'
import { getBuildingEntrance } from '@/game/tools/getBuildingEntrance.ts'

export function createResident(id: ResidentId, building: Building): Resident {
  return {
    id,
    ...PEDESTRIANS_CONFIG.default,
    currentBuildingId: building.id,
    journey: null,
    transportDecision: null,
    position: getBuildingEntrance(building),
    state: ResidentState.IdleInBuilding,
    path: [],
    pathIndex: 0,
  }
}
