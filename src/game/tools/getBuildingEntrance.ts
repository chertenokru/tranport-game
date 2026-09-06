import type { Building } from '@/game/domain/Building'
import type { Vector2 } from '@/game/domain/geometry'
import { localToWorld } from './geometry'

export function getBuildingEntrance(building: Building): Vector2 {
  return localToWorld({ x: 0, y: building.size.y / 2 }, building.position, building.direction)
}
