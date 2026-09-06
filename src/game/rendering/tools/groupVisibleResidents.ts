import { type Resident, ResidentState } from '@/game/domain/Resident.ts'

export function groupVisibleResidents(residents: Iterable<Resident>): Resident[][] {
  const groups: Resident[][] = []

  for (const resident of residents) {
    if (
      resident.state === ResidentState.InsideBus ||
      resident.state === ResidentState.IdleInBuilding ||
      resident.state === ResidentState.Dead
    ) {
      continue
    }

    const mergedGroup: Resident[] = []

    for (let index = groups.length - 1; index >= 0; index--) {
      const group = groups[index]!

      if (group.some((member) => overlaps(member, resident))) {
        mergedGroup.unshift(...group)
        groups.splice(index, 1)
      }
    }

    mergedGroup.push(resident)
    groups.push(mergedGroup)
  }

  return groups
}

function overlaps(first: Resident, second: Resident): boolean {
  const dx = first.position.x - second.position.x
  const dy = first.position.y - second.position.y
  const combinedRadius = first.radius + second.radius

  return dx * dx + dy * dy <= combinedRadius * combinedRadius
}
