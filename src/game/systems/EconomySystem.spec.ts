import { describe, expect, it } from 'vitest'
import { EconomySystem } from '@/game/systems/EconomySystem.ts'
import { createWorldWithResident } from '@/game/testing/createWorldWithResident'
import { GAME_CONFIG } from '@/game/config/game.config.ts'
import { ResidentState } from '@/game/domain/Resident'

describe('createWorldWithResident', () => {
  it('rewards a completed journey exactly once', () => {
    const world = createWorldWithResident()
    const system = new EconomySystem()
    const resident = world.residents.get('resident-main')
    const initialMoney = world.money

    if (!resident) {
      throw new Error('Initial resident is missing')
    }

    resident.state = ResidentState.Arrived

    system.update(world, 0)

    expect(world.money).toBe(initialMoney + GAME_CONFIG.economy.passengerDeliveredReward)
    expect(world.deliveredPassengers).toBe(1)
    expect(world.residents.has(resident.id)).toBe(true)
    expect(resident.state).toBe(ResidentState.IdleInBuilding)

    system.update(world, 0)

    expect(world.money).toBe(initialMoney + GAME_CONFIG.economy.passengerDeliveredReward)
    expect(world.deliveredPassengers).toBe(1)
  })
})
