import type { GameWorld } from '@/game/core/GameWorld'
import type { Resident } from '@/game/domain/Resident'
import { getPathMotion } from './getPathMotion'

export function getResidentMotion(world: GameWorld, resident: Resident) {
  const crossingId = resident.path[resident.pathIndex]?.crossingId
  if (crossingId && !world.crossingOccupants.get(crossingId)?.has(resident.id)) {
    return { velocity: { x: 0, y: 0 }, duration: Infinity }
  }
  return getPathMotion(resident, resident.walkingSpeed)
}
