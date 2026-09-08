import { describe, expect, it } from 'vitest'

import { IsometricCamera } from './IsometricCamera'

describe('IsometricCamera', () => {
  it('projects an equally sized distant segment smaller than a near segment', () => {
    const camera = new IsometricCamera(1120, 720, { rotation: 0, zoom: 1 })
    const farStart = camera.project({ x: 80, y: 80 })
    const farEnd = camera.project({ x: 180, y: -20 })
    const nearStart = camera.project({ x: 700, y: 500 })
    const nearEnd = camera.project({ x: 800, y: 400 })
    const nearLength = Math.hypot(nearEnd.x - nearStart.x, nearEnd.y - nearStart.y)
    const farLength = Math.hypot(farEnd.x - farStart.x, farEnd.y - farStart.y)

    expect(farLength).toBeLessThan(nearLength)
  })

  it('makes parallel edges converge with camera-space depth', () => {
    const camera = new IsometricCamera(1120, 720, { rotation: 0.73, zoom: 1 })
    const firstStart = camera.project({ x: 100, y: 120 })
    const firstEnd = camera.project({ x: 260, y: 120 })
    const secondStart = camera.project({ x: 430, y: 510 })
    const secondEnd = camera.project({ x: 590, y: 510 })

    expect(firstEnd.x - firstStart.x).not.toBeCloseTo(secondEnd.x - secondStart.x)
  })

  it('keeps the world center fixed while rotating', () => {
    const center = { x: 480, y: 350 }
    const positions = [0, 0.4, 1.2, 2.7].map((rotation) =>
      new IsometricCamera(1120, 720, { rotation, zoom: 1 }).project(center),
    )

    expect(positions).toEqual(positions.map(() => positions[0]))
  })
})
