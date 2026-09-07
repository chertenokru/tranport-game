import { ResidentState } from '@/game/domain/Resident'

const WALKING_STATES: ReadonlySet<ResidentState> = new Set([
  ResidentState.Walking,
  ResidentState.WalkingToStop,
  ResidentState.WalkingFromStop,
  ResidentState.CrossingRoad,
])

export function isResidentWalking(state: ResidentState): boolean {
  return WALKING_STATES.has(state)
}
