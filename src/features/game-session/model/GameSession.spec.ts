import { afterEach, describe, expect, it, vi } from 'vitest'

import { createWorldWithResident } from '@/game/testing/createWorldWithResident'

import { GameEngine } from '@/game/core/GameEngine'
import { GameWorld } from '@/game/core/GameWorld'

import { GameSession } from './GameSession'
import type { GameRenderer } from '@/game/rendering/GameRenderer.ts'

describe('GameSession', () => {
  afterEach(() => vi.restoreAllMocks())

  it('counts the whole population separately from residents inside buildings', () => {
    const world = createWorldWithResident()
    const first = world.residents.get('resident-main')!
    world.residents.set('idle', {
      ...first,
      id: 'idle',
      state: 'idleInBuilding',
      currentBuildingId: 'building-house',
      journey: null,
    })
    world.residents.set('passenger', { ...first, id: 'passenger', state: 'insideBus' })
    const session = new GameSession(new GameEngine(world))
    expect(session.getSnapshot()).toMatchObject({ totalResidents: 3, idleResidents: 1 })
  })
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
    previousWorld.residents.clear()

    session.restart()

    expect(session.engine.isRunning).toBe(true)
    expect(session.engine.clock.elapsedTime).toBe(0)

    expect(session.engine.world).not.toBe(previousWorld)
    expect(session.engine.world.accidents).toBe(0)
    expect(session.engine.world.buses.size).toBe(2)
    expect(session.engine.world.residents.size).toBe(0)
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
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const session = new GameSession()
    const initialResident = createWorldWithResident().residents.get('resident-main')
    const approachingBus = session.engine.world.buses.get('bus-main')

    if (!initialResident || !approachingBus) {
      throw new Error('Initial entities are missing')
    }

    const resident = {
      ...initialResident,
      walkingSpeed: 40,
      busTimeAdvantageFactor: 0.9,
    }

    session.engine.world.residents.set(resident.id, resident)

    session.engine.world.buses.delete('bus-main1')

    session.engine.world.buses.set(approachingBus.id, {
      ...approachingBus,
      speed: 80,
      stopWaitSeconds: 4,
      waitingSecondsRemaining: 4,
    })

    const destination = session.engine.world.buildings.get(resident.journey!.destinationBuildingId)

    if (!destination) {
      throw new Error('Destination building is missing')
    }

    const visitedStates = new Set([resident.state])

    session.start()

    for (let step = 0; step < 600 && resident.state !== 'idleInBuilding'; step += 1) {
      session.update(0.1)
      visitedStates.add(resident.state)
    }

    expect(visitedStates.has('insideBus')).toBe(true)
    expect(visitedStates.has('walkingFromStop')).toBe(true)
    expect(visitedStates.has('choosingTransport')).toBe(true)
    expect(visitedStates.has('walkingToStop')).toBe(true)

    expect(resident.state).toBe('idleInBuilding')
    expect(resident.position).toEqual(destination.entrance)
    expect(session.engine.world.residents.has(resident.id)).toBe(true)

    for (const bus of session.engine.world.buses.values()) {
      expect(bus.passengerIds).not.toContain(resident.id)
    }
  })
})
