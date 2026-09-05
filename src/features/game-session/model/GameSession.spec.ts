import { describe, expect, it } from 'vitest'

import { GameEngine } from '@/game/core/GameEngine'
import { GameWorld } from '@/game/core/GameWorld'

import { GameSession } from './GameSession'

describe('GameSession', () => {
  it('controls the engine lifecycle', () => {
    const engine = new GameEngine()
    const session = new GameSession(engine)

    session.start()
    expect(engine.isRunning).toBe(true)

    session.pause()
    expect(engine.isRunning).toBe(false)

    session.resume()
    expect(engine.isRunning).toBe(true)
  })

  it('restarts with a clean running simulation', () => {
    const world = new GameWorld()
    const engine = new GameEngine(world)
    const session = new GameSession(engine)

    session.start()
    session.update(2)
    world.accidents = 4

    session.restart()

    expect(engine.isRunning).toBe(true)
    expect(engine.clock.elapsedTime).toBe(0)
    expect(world.accidents).toBe(0)
  })

  it('disposes and resets the simulation', () => {
    const engine = new GameEngine()
    const session = new GameSession(engine)

    session.start()
    session.update(1)
    session.dispose()

    expect(engine.isRunning).toBe(false)
    expect(engine.clock.elapsedTime).toBe(0)
  })
})
