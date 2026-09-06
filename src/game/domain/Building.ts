import type { Vector2 } from './geometry'
import type { BuildingId } from './ids'

export enum BuildingType {
  Residential = 'residential',
  Office = 'office',
}

export interface Building {
  readonly id: BuildingId
  readonly name: string
  readonly type: BuildingType
  readonly position: Vector2
  readonly size: Vector2
  readonly entrance: Vector2
}
