import type { BusId } from './ids'

export type TransportMode = 'walking' | 'bus'

export type TransportDecisionReason =
  | 'busSelected'
  | 'busNotCompetitive'
  | 'noBusAvailable'
  | 'transitUnavailable'

export interface TransportDecision {
  readonly selectedMode: TransportMode
  readonly reason: TransportDecisionReason
  readonly walkingTime: number
  readonly busTime: number | null
  readonly evaluatedBusId: BusId | null
}
