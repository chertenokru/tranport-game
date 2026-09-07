import type { Direction } from './Direction'
import type { Vector2 } from './geometry'
import type { RoadId } from './ids'

export interface PedestrianCrossing {
  readonly id: string
  readonly roadId: RoadId
  readonly position: Vector2
  /** Road direction; pedestrians cross perpendicular to it. */
  readonly direction: Direction
  readonly roadWidth: number
  readonly width: number
  readonly signalTiming?: PedestrianSignalTiming
}

export interface PedestrianSignalTiming {
  readonly pedestrianGreenSeconds: number
  readonly pedestrianRedSeconds: number
  /** Time from simulation zero to the start of this signal's pedestrian green phase. */
  readonly phaseOffsetSeconds: number
}

export enum PedestrianSignalColor {
  Green = 'green',
  Yellow = 'yellow',
  Red = 'red',
}

export interface PedestrianWaypoint extends Vector2 {
  /** The segment ending at this point traverses this crossing. */
  readonly crossingId?: string
}
