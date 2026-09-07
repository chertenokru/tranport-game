import { describe, expect, it } from 'vitest'
import { Direction } from '@/game/domain/Direction'
import { PedestrianSignalColor, type PedestrianCrossing } from '@/game/domain/PedestrianCrossing'
import { getPedestrianSignal, secondsUntilNextPedestrianSignalChange } from './getPedestrianSignal'

function crossing(phaseOffsetSeconds = 0): PedestrianCrossing {
  return {
    id: 'signal',
    roadId: 'road',
    position: { x: 0, y: 0 },
    direction: Direction.East,
    roadWidth: 64,
    width: 24,
    signalTiming: {
      pedestrianGreenSeconds: 8,
      pedestrianRedSeconds: 12,
      phaseOffsetSeconds,
    },
  }
}

describe('pedestrian traffic signal', () => {
  it.each([
    [0, PedestrianSignalColor.Green, true, false],
    [5.9, PedestrianSignalColor.Green, true, false],
    [6, PedestrianSignalColor.Yellow, false, false],
    [8, PedestrianSignalColor.Red, false, true],
    [17.9, PedestrianSignalColor.Red, false, true],
    [18, PedestrianSignalColor.Yellow, false, false],
    [20, PedestrianSignalColor.Green, true, false],
  ])('returns the state at %s seconds', (time, color, pedestriansCanEnter, vehiclesCanEnter) => {
    expect(getPedestrianSignal(crossing(), time)).toMatchObject({
      color,
      pedestriansCanEnter,
      vehiclesCanEnter,
    })
  })

  it('applies an offset relative to simulation zero', () => {
    expect(getPedestrianSignal(crossing(10), 0)).toMatchObject({
      color: PedestrianSignalColor.Red,
      vehiclesCanEnter: true,
    })
    expect(getPedestrianSignal(crossing(10), 10)).toMatchObject({
      color: PedestrianSignalColor.Green,
      pedestriansCanEnter: true,
    })
  })

  it('reports the next green-yellow or yellow-next-phase boundary', () => {
    expect(secondsUntilNextPedestrianSignalChange(crossing(), 0)).toBe(6)
    expect(secondsUntilNextPedestrianSignalChange(crossing(), 7)).toBe(1)
    expect(secondsUntilNextPedestrianSignalChange(crossing(), 8)).toBe(10)
    expect(secondsUntilNextPedestrianSignalChange(crossing(), 19)).toBe(1)
  })

  it('leaves an ordinary crossing uncontrolled', () => {
    const ordinary = { ...crossing(), signalTiming: undefined }
    expect(getPedestrianSignal(ordinary, 0)).toBeNull()
    expect(secondsUntilNextPedestrianSignalChange(ordinary, 0)).toBe(Infinity)
  })
})
