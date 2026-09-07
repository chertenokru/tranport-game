import { CROSSINGS_CONFIG } from '@/game/config/crossings.config'
import {
  type PedestrianCrossing,
  PedestrianSignalColor,
} from '@/game/domain/PedestrianCrossing'

export interface PedestrianSignalState {
  readonly color: PedestrianSignalColor
  readonly pedestriansCanEnter: boolean
  readonly vehiclesCanEnter: boolean
  readonly secondsUntilChange: number
}

export function getPedestrianSignal(
  crossing: PedestrianCrossing,
  elapsedSeconds: number,
): PedestrianSignalState | null {
  const timing = crossing.signalTiming
  if (!timing) return null

  const cycle = timing.pedestrianGreenSeconds + timing.pedestrianRedSeconds
  const phase = modulo(elapsedSeconds - timing.phaseOffsetSeconds, cycle)
  const pedestrianGreen = phase < timing.pedestrianGreenSeconds
  const secondsUntilPhaseEnd = pedestrianGreen
    ? timing.pedestrianGreenSeconds - phase
    : cycle - phase
  const yellow = secondsUntilPhaseEnd <= CROSSINGS_CONFIG.signal.yellowSeconds
  const secondsUntilChange = yellow
    ? secondsUntilPhaseEnd
    : secondsUntilPhaseEnd - CROSSINGS_CONFIG.signal.yellowSeconds

  return {
    color: yellow
      ? PedestrianSignalColor.Yellow
      : pedestrianGreen
        ? PedestrianSignalColor.Green
        : PedestrianSignalColor.Red,
    pedestriansCanEnter: pedestrianGreen && !yellow,
    vehiclesCanEnter: !pedestrianGreen && !yellow,
    secondsUntilChange,
  }
}

export function secondsUntilNextPedestrianSignalChange(
  crossing: PedestrianCrossing,
  elapsedSeconds: number,
): number {
  return getPedestrianSignal(crossing, elapsedSeconds)?.secondsUntilChange ?? Infinity
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}
