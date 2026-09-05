import { describe, expect, it } from 'vitest'
import { EconomySystem } from '@/game/systems/EconomySystem.ts'
import { createVerticalSliceWorld } from '@/game/world/MapFactory.ts'
import { GAME_CONFIG } from '@/game/config/game.config.ts'

describe('createVerticalSliceWorld', () => {
  it('rewards a completed journey exactly once', () => {
    const world = createVerticalSliceWorld()
    const system = new EconomySystem()
    const pedestrian = world.pedestrians.get('pedestrian-main')
    const initialMoney = world.money

    if (!pedestrian) {
      throw new Error('Initial pedestrian is missing')
    }

    pedestrian.state = 'arrived'

    system.update(world, 0)

    expect(world.money).toBe(initialMoney + GAME_CONFIG.economy.passengerDeliveredReward)
    expect(world.deliveredPassengers).toBe(1)
    expect(world.pedestrians.has(pedestrian.id)).toBe(true)
    expect(pedestrian.state).toBe('idleInBuilding')

    system.update(world, 0)

    expect(world.money).toBe(initialMoney + GAME_CONFIG.economy.passengerDeliveredReward)
    expect(world.deliveredPassengers).toBe(1)
  })
})
