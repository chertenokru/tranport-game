import type { Vector2 } from '@/game/domain/geometry'
import { type CollisionBody, CollisionShape } from './CollisionBody'
import { getRayBoxInterval } from './getRayBoxInterval'

// Returns the first contact in [0, maximumTime]. Both bodies move linearly.
// The caller splits a path at waypoints, where velocity or orientation changes.
export function findCollisionTime(
  first: CollisionBody,
  second: CollisionBody,
  maximumTime: number,
): number | null {
  if (!Number.isFinite(maximumTime) || maximumTime < 0)
    throw new RangeError('Collision interval must be finite and non-negative')
  const position = {
    x: first.position.x - second.position.x,
    y: first.position.y - second.position.y,
  }
  const velocity = {
    x: first.velocity.x - second.velocity.x,
    y: first.velocity.y - second.velocity.y,
  }
  if (first.shape === CollisionShape.Circle && second.shape === CollisionShape.Circle) {
    return hitCircle(position, velocity, first.radius + second.radius, maximumTime)
  }
  if (first.shape === CollisionShape.Rectangle && second.shape === CollisionShape.Rectangle) {
    return hitBox(
      position,
      velocity,
      {
        x: first.halfSize.x + second.halfSize.x,
        y: first.halfSize.y + second.halfSize.y,
      },
      maximumTime,
    )
  }

  const circle = first.shape === CollisionShape.Circle ? first : second
  const box = first.shape === CollisionShape.Rectangle ? first : second
  if (circle.shape !== CollisionShape.Circle || box.shape !== CollisionShape.Rectangle) return null

  // A rectangle expanded by a circle has rounded corners. Using only its bounding
  // box would report collisions when a pedestrian actually clears a corner.
  const radius = circle.radius
  const half = box.halfSize
  const times = [
    hitBox(position, velocity, { x: half.x + radius, y: half.y }, maximumTime),
    hitBox(position, velocity, { x: half.x, y: half.y + radius }, maximumTime),
  ]
  for (const x of [-half.x, half.x]) {
    for (const y of [-half.y, half.y]) {
      times.push(hitCircle({ x: position.x - x, y: position.y - y }, velocity, radius, maximumTime))
    }
  }
  const contacts = times.filter((time): time is number => time !== null)
  return contacts.length ? Math.min(...contacts) : null
}

function hitBox(
  position: Vector2,
  velocity: Vector2,
  halfSize: Vector2,
  maximumTime: number,
): number | null {
  const interval = getRayBoxInterval(position, velocity, halfSize)
  if (!interval) return null
  const contact = Math.max(0, interval.enter)
  return contact <= Math.min(maximumTime, interval.exit) ? contact : null
}

function hitCircle(
  position: Vector2,
  velocity: Vector2,
  radius: number,
  maximumTime: number,
): number | null {
  const c = position.x ** 2 + position.y ** 2 - radius ** 2
  if (c <= 0) return 0
  const a = velocity.x ** 2 + velocity.y ** 2
  if (a === 0) return null
  const b = position.x * velocity.x + position.y * velocity.y
  const discriminant = b ** 2 - a * c
  if (discriminant < 0) return null
  const time = (-b - Math.sqrt(discriminant)) / a
  return time >= 0 && time <= maximumTime ? time : null
}
