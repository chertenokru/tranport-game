import type { Vector2 } from '@/game/domain/geometry.ts'

export interface VehicleTypeConfig {
  readonly id: string
  readonly name: string
  readonly cost: number
  readonly capacity: number
  readonly speed: number
  readonly size: Vector2
  readonly stopWaitSeconds: number
}

export const VEHICLES_CONFIG = {
  standardBus: {
    id: 'standard-bus',
    name: 'Стандартный автобус',
    cost: 100,
    capacity: 10,
    speed: 80,
    stopWaitSeconds: 1,
    size: {
      x: 44,
      y: 18,
    },
  },
} as const satisfies Record<string, VehicleTypeConfig>
