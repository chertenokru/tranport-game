import type { BusId } from './ids'

export enum TransportMode {
  Walking = 'walking',
  Bus = 'bus',
}

export enum TransportDecisionReason {
  BusSelected = 'busSelected',
  BusNotCompetitive = 'busNotCompetitive',
  NoBusAvailable = 'noBusAvailable',
  TransitUnavailable = 'transitUnavailable',
}

export interface TransportDecision {
  readonly selectedMode: TransportMode
  readonly reason: TransportDecisionReason
  readonly walkingTime: number
  readonly busTime: number | null
  readonly evaluatedBusId: BusId | null
}
