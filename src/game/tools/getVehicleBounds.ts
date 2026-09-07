import type { Vector2 } from '@/game/domain/geometry'
import { Direction } from '@/game/domain/Direction'
import { localToWorld } from './geometry'

interface VehicleGeometry {
  readonly position: Vector2
  readonly size: Vector2
  readonly direction: Direction
}

// The current lane offset must be identical in rendering and collision detection.
const LANE_OFFSET = 16

export function getVehicleBounds(vehicle: VehicleGeometry) {
  const vertical = vehicle.direction === Direction.North || vehicle.direction === Direction.South
  return {
    position: localToWorld({ x: -LANE_OFFSET, y: 0 }, vehicle.position, vehicle.direction),
    halfSize: {
      x: (vertical ? vehicle.size.y : vehicle.size.x) / 2,
      y: (vertical ? vehicle.size.x : vehicle.size.y) / 2,
    },
  }
}
