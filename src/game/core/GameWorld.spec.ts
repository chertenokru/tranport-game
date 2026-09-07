import { describe, expect, it } from 'vitest'

import { GAME_CONFIG } from '@/game/config/game.config'

import { GameWorld } from './GameWorld'

describe('GameWorld', () => {
  it('starts with configured economy values', () => {
    const world = new GameWorld()

    expect(world.money).toBe(GAME_CONFIG.economy.startingMoney)
    expect(world.deliveredPassengers).toBe(0)
    expect(world.accidents).toBe(0)
    expect(world.buildings.size).toBe(0)
    expect(world.stops.size).toBe(0)
    expect(world.routes.size).toBe(0)
    expect(world.crossings.size).toBe(0)
  })

  it('resets runtime state', () => {
    const world = new GameWorld()

    world.money = 50
    world.deliveredPassengers = 12
    world.accidents = 3
    world.crossingOccupants.set('crossing', new Set(['resident']))
    world.trafficZoneOwners.set('crossing', 'bus')

    world.reset()

    expect(world.money).toBe(GAME_CONFIG.economy.startingMoney)
    expect(world.deliveredPassengers).toBe(0)
    expect(world.accidents).toBe(0)
    expect(world.buses.size).toBe(0)
    expect(world.crossingOccupants.size).toBe(0)
    expect(world.trafficZoneOwners.size).toBe(0)
  })
})
