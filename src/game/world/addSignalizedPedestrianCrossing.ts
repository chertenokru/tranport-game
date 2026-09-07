import { CROSSINGS_CONFIG } from '@/game/config/crossings.config'
import type { GameWorld } from '@/game/core/GameWorld'
import type { PedestrianCrossing } from '@/game/domain/PedestrianCrossing'
import { addPedestrianCrossing } from './addPedestrianCrossing'

export function addSignalizedPedestrianCrossing(
  world: GameWorld,
  id: string,
  roadId: string,
  distanceFromStart: number,
  phaseOffsetSeconds: number = CROSSINGS_CONFIG.signal.phaseOffsetSeconds,
): PedestrianCrossing {
  if (!Number.isFinite(phaseOffsetSeconds)) {
    throw new RangeError('Signal phase offset must be finite')
  }
  return addPedestrianCrossing(world, id, roadId, distanceFromStart, {
    pedestrianGreenSeconds: CROSSINGS_CONFIG.signal.pedestrianGreenSeconds,
    pedestrianRedSeconds: CROSSINGS_CONFIG.signal.pedestrianRedSeconds,
    phaseOffsetSeconds,
  })
}
