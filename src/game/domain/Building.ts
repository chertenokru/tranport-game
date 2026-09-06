import type { Direction } from './Direction'
import type { Vector2 } from './geometry'
import type { BuildingId } from './ids'

export enum BuildingType {
  Residential = 'residential',
  Office = 'office',
  Shop = 'shop',
}

export interface Building {
  readonly id: BuildingId
  readonly name: string
  readonly type: BuildingType

  // Центр здания в мировых координатах.
  readonly position: Vector2

  // Размеры исходного рисунка, направленного на юг.
  readonly size: Vector2
  readonly direction: Direction
}
