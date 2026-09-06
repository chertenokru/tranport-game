import { describe, expect, it } from 'vitest'

import { GameEngine } from '@/game/core/GameEngine'
import { GameWorld } from '@/game/core/GameWorld'

import { GameSession } from './GameSession'
import type { GameRenderer } from '@/game/rendering/GameRenderer.ts'

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

  it('restarts with a fresh configured world', () => {
    const session = new GameSession()
    const previousWorld = session.engine.world

    session.start()
    session.update(2)

    previousWorld.accidents = 4
    previousWorld.buses.clear()
    previousWorld.pedestrians.clear()

    session.restart()

    expect(session.engine.isRunning).toBe(true)
    expect(session.engine.clock.elapsedTime).toBe(0)

    expect(session.engine.world).not.toBe(previousWorld)
    expect(session.engine.world.accidents).toBe(0)
    expect(session.engine.world.buses.size).toBe(2)
    expect(session.engine.world.pedestrians.size).toBe(1)
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

  it('attaches, updates and detaches a renderer', () => {
    const engine = new GameEngine()
    const session = new GameSession(engine)
    const renderedWorlds: GameWorld[] = []

    const renderer: GameRenderer = {
      render(world) {
        renderedWorlds.push(world)
      },
    }

    session.attachRenderer(renderer)

    expect(renderedWorlds).toEqual([engine.world])

    session.start()
    session.update(0.5)

    expect(renderedWorlds).toEqual([engine.world, engine.world])

    session.detachRenderer(renderer)
    session.update(0.5)

    expect(renderedWorlds).toHaveLength(2)
  })

  it('completes a passenger journey by bus when the service is attractive', () => {
    const session = new GameSession()
    const pedestrian = session.engine.world.pedestrians.get('pedestrian-main')
    const approachingBus = session.engine.world.buses.get('bus-main')

    if (!pedestrian || !approachingBus) {
      throw new Error('Initial entities are missing')
    }

    session.engine.world.buses.delete('bus-main1')

    session.engine.world.buses.set(approachingBus.id, {
      ...approachingBus,
      stopWaitSeconds: 4,
      waitingSecondsRemaining: 4,
    })

    const destination = session.engine.world.buildings.get(pedestrian.destinationBuildingId)

    if (!destination) {
      throw new Error('Destination building is missing')
    }

    const visitedStates = new Set([pedestrian.state])

    session.start()

    for (let step = 0; step < 600 && pedestrian.state !== 'idleInBuilding'; step += 1) {
      session.update(0.1)
      visitedStates.add(pedestrian.state)
    }

    expect(visitedStates.has('insideBus')).toBe(true)
    expect(visitedStates.has('walkingFromStop')).toBe(true)
    expect(visitedStates.has('choosingTransport')).toBe(true)
    expect(visitedStates.has('walkingToStop')).toBe(true)

    expect(pedestrian.state).toBe('idleInBuilding')
    expect(pedestrian.position).toEqual(destination.entrance)
    expect(session.engine.world.pedestrians.has(pedestrian.id)).toBe(true)

    for (const bus of session.engine.world.buses.values()) {
      expect(bus.passengerIds).not.toContain(pedestrian.id)
    }
  })
})
