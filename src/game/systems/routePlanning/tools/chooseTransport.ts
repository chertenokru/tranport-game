import { TransportMode } from '@/game/domain/TransportDecision.ts'

export interface TransportChoiceInput {
  readonly walkingDistance: number
  readonly walkingSpeed: number
  readonly walkingToStopDistance: number
  readonly expectedWaitingTime: number
  readonly busTravelTime: number
  readonly walkingFromStopDistance: number
  readonly busTimeAdvantageFactor: number
}

export interface TransportChoiceResult {
  readonly mode: TransportMode
  readonly walkingTime: number
  readonly busTime: number
}

export function chooseTransport(input: TransportChoiceInput): TransportChoiceResult {
  if (input.walkingSpeed <= 0 || input.busTravelTime < 0) {
    throw new RangeError('Walking speed and bus travel time must be valid')
  }

  const walkingTime = input.walkingDistance / input.walkingSpeed

  const busTime =
    input.walkingToStopDistance / input.walkingSpeed +
    input.expectedWaitingTime +
    input.busTravelTime +
    input.walkingFromStopDistance / input.walkingSpeed

  const mode =
    busTime < walkingTime * input.busTimeAdvantageFactor ? TransportMode.Bus : TransportMode.Walking

  return {
    mode,
    walkingTime,
    busTime,
  }
}
