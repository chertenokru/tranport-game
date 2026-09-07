import { type Bus, BusState } from '@/game/domain/Bus'
import type { BusRoute } from '@/game/domain/BusRoute'
import type { BusId } from '@/game/domain/ids'
import { estimateBusBoarding } from './estimateBusBoarding'

export interface BestBusOptionInput {
  readonly buses: readonly Bus[]
  readonly route: BusRoute
  readonly boardingStopIndex: number
  readonly alightingStopIndex: number
  readonly passengerArrivalTime: number
}

export interface BusTravelOption {
  readonly busId: BusId
  readonly waitingTime: number
  readonly boardingStopTime: number
  readonly movementTime: number
  readonly intermediateStopTime: number
  readonly busTravelTime: number
  readonly totalTimeAfterReachingStop: number
}

export function findBestBusOption(input: BestBusOptionInput): BusTravelOption | null {
  const { route, boardingStopIndex, alightingStopIndex } = input
  const count = route.legs.length
  if (
    count < 2 ||
    !Number.isInteger(boardingStopIndex) ||
    !route.legs[boardingStopIndex] ||
    !Number.isInteger(alightingStopIndex) ||
    !route.legs[alightingStopIndex] ||
    boardingStopIndex === alightingStopIndex
  ) {
    throw new RangeError('Invalid bus journey stop indexes')
  }

  const legCount = (alightingStopIndex - boardingStopIndex + count) % count
  let distance = 0
  for (let offset = 0; offset < legCount; offset += 1) {
    distance += route.legs[(boardingStopIndex + offset) % count]!.distance
  }

  let bestOption: BusTravelOption | null = null
  for (const bus of input.buses) {
    if (bus.routeId !== route.id) continue
    if (
      bus.legIndex === boardingStopIndex &&
      bus.state === BusState.WaitingAtStop &&
      bus.passengerIds.length >= bus.capacity
    )
      continue

    const estimate = estimateBusBoarding({
      bus,
      route,
      boardingStopIndex,
      passengerArrivalTime: input.passengerArrivalTime,
    })
    if (!estimate) continue

    const movementTime = distance / bus.speed
    const intermediateStopTime = (legCount - 1) * bus.stopWaitSeconds
    const busTravelTime = estimate.remainingStopTime + movementTime + intermediateStopTime
    const totalTimeAfterReachingStop = estimate.waitingTime + busTravelTime

    if (!bestOption || totalTimeAfterReachingStop < bestOption.totalTimeAfterReachingStop) {
      bestOption = {
        busId: bus.id,
        waitingTime: estimate.waitingTime,
        boardingStopTime: estimate.remainingStopTime,
        movementTime,
        intermediateStopTime,
        busTravelTime,
        totalTimeAfterReachingStop,
      }
    }
  }

  return bestOption
}
