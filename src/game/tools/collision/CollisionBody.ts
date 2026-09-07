import type { Vector2 } from '@/game/domain/geometry'

export enum CollisionShape {
  Circle = 'circle',
  Rectangle = 'rectangle',
}

interface BodyMotion {
  readonly position: Vector2
  readonly velocity: Vector2
}

export type CollisionBody = BodyMotion &
  (
    | { readonly shape: CollisionShape.Circle; readonly radius: number }
    | { readonly shape: CollisionShape.Rectangle; readonly halfSize: Vector2 }
  )
