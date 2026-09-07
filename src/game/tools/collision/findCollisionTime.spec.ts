import { describe, expect, it } from 'vitest'
import { CollisionShape, type CollisionBody } from './CollisionBody'
import { findCollisionTime } from './findCollisionTime'

const box: CollisionBody = {
  shape: CollisionShape.Rectangle,
  position: { x: 0, y: 0 },
  velocity: { x: 10, y: 0 },
  halfSize: { x: 2, y: 1 },
}
const circle: CollisionBody = {
  shape: CollisionShape.Circle,
  position: { x: 8, y: 0 },
  velocity: { x: 0, y: 0 },
  radius: 1,
}

describe('findCollisionTime', () => {
  it('detects a contact between endpoints of a large step', () => {
    expect(findCollisionTime(box, circle, 2)).toBeCloseTo(0.5)
    expect(findCollisionTime(box, circle, 0.4)).toBeNull()
    expect(findCollisionTime(circle, box, 2)).toBeCloseTo(0.5)
  })

  it('does not replace a circle with a square at rectangle corners', () => {
    const stationary = { ...box, velocity: { x: 0, y: 0 } }
    expect(findCollisionTime(stationary, { ...circle, position: { x: 2.8, y: 1.8 } }, 1)).toBeNull()
    expect(findCollisionTime(stationary, { ...circle, position: { x: 3, y: 1 } }, 1)).toBe(0)
  })

  it('accounts for both bodies moving across one another', () => {
    const first = { ...box, halfSize: { x: 1, y: 1 }, position: { x: -10, y: 0 } }
    const second = { ...circle, position: { x: 0, y: -10 }, velocity: { x: 0, y: 10 } }
    expect(findCollisionTime(first, second, 2)).toBeCloseTo((9 - Math.SQRT1_2) / 10)
    expect(findCollisionTime(first, { ...second, position: { x: 0, y: -30 } }, 3)).toBeNull()
  })

  it('detects catching up and opposing rectangles for future vehicle interactions', () => {
    const slower = { ...box, position: { x: 10, y: 0 }, velocity: { x: 5, y: 0 } }
    expect(findCollisionTime(box, slower, 2)).toBeCloseTo(1.2)
    expect(findCollisionTime(box, { ...slower, velocity: { x: -10, y: 0 } }, 1)).toBeCloseTo(0.3)
    expect(findCollisionTime(box, { ...slower, velocity: box.velocity }, 10)).toBeNull()
    expect(findCollisionTime(box, { ...slower, position: { x: 10, y: 3 } }, 10)).toBeNull()
  })

  it('supports contacts between circles', () => {
    const approaching = { ...circle, position: { x: 0, y: 0 }, velocity: { x: 2, y: 0 } }
    expect(findCollisionTime(approaching, circle, 4)).toBeCloseTo(3)
    expect(findCollisionTime(circle, circle, 0)).toBe(0)
  })

  it('detects perpendicular vehicle motion only when the intersection is occupied at the same time', () => {
    const horizontal = { ...box, position: { x: -10, y: 0 } }
    const vertical = {
      ...box,
      position: { x: 0, y: -10 },
      velocity: { x: 0, y: 10 },
      halfSize: { x: 1, y: 2 },
    }
    expect(findCollisionTime(horizontal, vertical, 2)).toBeCloseTo(0.7)
    expect(findCollisionTime(horizontal, { ...vertical, position: { x: 0, y: -30 } }, 3)).toBeNull()
  })
})
