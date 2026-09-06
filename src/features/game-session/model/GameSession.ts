import { GameEngine } from '@/game/core/GameEngine'
import type { GameRenderer } from '@/game/rendering/GameRenderer'
import { createVerticalSliceWorld } from '@/game/world/MapFactory'
import { BusMovementSystem } from '@/game/systems/BusMovementSystem.ts'
import { PedestrianMovementSystem } from '@/game/systems/PedestrianMovementSystem.ts'
import { PassengerSystem } from '@/game/systems/PassengerSystem.ts'
import { EconomySystem } from '@/game/systems/EconomySystem.ts'
import { RoutePlanningSystem } from '@/game/systems/routePlanning/RoutePlanningSystem.ts'
import { PopulationSystem } from '@/game/systems/PopulationSystem'
import { ResidentArrivalSystem } from '@/game/systems/ResidentArrivalSystem'
import { ResidentState } from '@/game/domain/Resident'

export interface GameSessionSnapshot {
  elapsedTimeSeconds: number
  money: number
  deliveredPassengers: number
  accidents: number
  activeBuses: number
  totalResidents: number
  idleResidents: number
}

export class GameSession {
  readonly engine: GameEngine
  private renderer: GameRenderer | null = null

  constructor(
    engine: GameEngine = new GameEngine(createVerticalSliceWorld(), [
      new PopulationSystem(),
      new RoutePlanningSystem(),
      new PedestrianMovementSystem(),
      new BusMovementSystem(),
      new PassengerSystem(),
      new EconomySystem(),
      new ResidentArrivalSystem(),
    ]),
  ) {
    this.engine = engine
  }

  start(): void {
    this.engine.start()
  }

  pause(): void {
    this.engine.pause()
  }

  resume(): void {
    this.engine.start()
  }

  restart(): void {
    this.engine.replaceWorld(createVerticalSliceWorld())
    this.engine.start()
    this.render()
  }

  update(deltaSeconds: number): void {
    this.engine.update(deltaSeconds)
    this.render()
  }

  attachRenderer(renderer: GameRenderer): void {
    this.renderer = renderer
    this.render()
  }

  detachRenderer(renderer: GameRenderer): void {
    if (this.renderer === renderer) {
      this.renderer = null
    }
  }

  getSnapshot(): Readonly<GameSessionSnapshot> {
    const { clock, world } = this.engine
    return {
      elapsedTimeSeconds: clock.elapsedTime,
      money: world.money,
      deliveredPassengers: world.deliveredPassengers,
      accidents: world.accidents,
      activeBuses: world.buses.size,
      totalResidents: world.residents.size,
      idleResidents: [...world.residents.values()].filter(
        (resident) => resident.state === ResidentState.IdleInBuilding,
      ).length,
    }
  }

  dispose(): void {
    this.renderer = null
    this.engine.reset()
  }

  private render(): void {
    this.renderer?.render(this.engine.world, this.engine.clock.elapsedTime * 1_000)
  }
}
