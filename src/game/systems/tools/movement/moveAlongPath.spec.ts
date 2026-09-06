import { describe, expect, it } from 'vitest'

import { moveAlongPath } from './moveAlongPath.ts'

const path = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
] as const

describe('moveAlongPath', () => {
  it('moves partway toward the next waypoint', () => {
    const result = moveAlongPath({
      position: path[0],
      path,
      pathIndex: 1,
      maxDistance: 4,
    })

    expect(result).toEqual({
      position: {
        x: 4,
        y: 0,
      },
      pathIndex: 1,
      completed: false,
      remainingDistance: 0,
      // moves partway toward the next waypoint
      heading: { x: 1, y: 0 },
    })
  })

  it('continues through multiple waypoints', () => {
    const result = moveAlongPath({
      position: path[0],
      path,
      pathIndex: 1,
      maxDistance: 15,
    })

    expect(result).toEqual({
      position: {
        x: 10,
        y: 5,
      },
      pathIndex: 2,
      completed: false,
      remainingDistance: 0,
      // continues through multiple waypoints
      heading: { x: 0, y: 1 },
    })
  })

  it('returns unused distance after completing the path', () => {
    const result = moveAlongPath({
      position: path[0],
      path,
      pathIndex: 1,
      maxDistance: 25,
    })

    expect(result).toEqual({
      position: {
        x: 10,
        y: 10,
      },
      pathIndex: 3,
      completed: true,
      remainingDistance: 5,
      // returns unused distance after completing the path
      heading: { x: 0, y: 1 },
    })
  })

  it('rejects invalid movement values', () => {
    expect(() =>
      moveAlongPath({
        position: path[0],
        path,
        pathIndex: 1,
        maxDistance: -1,
      }),
    ).toThrow(RangeError)

    expect(() =>
      moveAlongPath({
        position: path[0],
        path,
        pathIndex: 1.5,
        maxDistance: 10,
      }),
    ).toThrow(RangeError)
  })

  it('returns no heading when no movement occurs', () => {
    const result = moveAlongPath({
      position: path[0],
      path,
      pathIndex: 1,
      maxDistance: 0,
    })

    expect(result.heading).toBeNull()
    expect(result.position).toEqual(path[0])
  })
})
