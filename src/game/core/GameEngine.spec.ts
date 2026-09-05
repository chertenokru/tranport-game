import { describe, expect, it } from 'vitest'

import type { GameSystem } from './GameSystem'
import { GameEngine } from './GameEngine'
import { GameWorld } from './GameWorld'
import { GAME_CONFIG } from '@/game/config/game.config.ts'

describe('GameEngine', () => {
  it('does not update while stopped', () => {
    const deltas: number[] = []

    const system: GameSystem = {
      update(_world, deltaSeconds) {
        deltas.push(deltaSeconds)
      },
    }

    const engine = new GameEngine(new GameWorld(), [system])

    engine.update(0.5)

    expect(engine.clock.elapsedTime).toBe(0)
    expect(deltas).toEqual([])
  })

  it('advances time and updates systems while running', () => {
    const deltas: number[] = []

    const system: GameSystem = {
      update(_world, deltaSeconds) {
        deltas.push(deltaSeconds)
      },
    }

    const engine = new GameEngine(new GameWorld(), [system])

    engine.start()
    engine.update(0.25)
    engine.update(0.5)

    expect(engine.clock.elapsedTime).toBe(0.75)
    expect(deltas).toEqual([0.25, 0.5])
  })

  it('pauses and resets the simulation', () => {
    const world = new GameWorld()
    const engine = new GameEngine(world)

    engine.start()
    engine.update(2)
    world.money = 50
    world.accidents = 3

    engine.reset()

    expect(engine.isRunning).toBe(false)
    expect(engine.clock.elapsedTime).toBe(0)
    expect(world.money).toBe(GAME_CONFIG.economy.startingMoney)
    expect(world.accidents).toBe(0)
  })
})
