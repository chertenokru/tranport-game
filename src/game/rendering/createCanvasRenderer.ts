import type { GameWorld } from '@/game/core/GameWorld'
import { ResidentState } from '@/game/domain/Resident'

import type { GameRenderer } from './GameRenderer'
import type { CanvasLayer } from './CanvasLayer'
import { CanvasLayerRenderer } from './CanvasLayerRenderer'

import { drawBackground } from '@/game/rendering/drawsLayers/drawBackground'
import { drawRoad } from '@/game/rendering/drawsLayers/drawRoad'
import { drawBuilding } from '@/game/rendering/drawsLayers/drawBuilding'
import { drawBusStop } from '@/game/rendering/drawsLayers/drawBusStop'
import { drawBus } from '@/game/rendering/drawsLayers/drawBus'
import { drawResidentGroup } from '@/game/rendering/drawsLayers/drawResidentGroup'
import { drawDeadResident } from '@/game/rendering/drawsLayers/drawDeadResident'
import { drawDecisionIndicator } from '@/game/rendering/drawsLayers/drawDecisionIndicator'
import { drawDebugInformation } from '@/game/rendering/drawsLayers/drawDebugInformation'

import { DecisionIndicators } from './tools/DecisionIndicators'
import { groupVisibleResidents } from './tools/groupVisibleResidents'
import { drawIntersection } from '@/game/rendering/drawsLayers/drawIntersection.ts'
import { drawPedestrianCrossing } from '@/game/rendering/drawsLayers/drawPedestrianCrossing'

export interface CanvasGameRenderer extends GameRenderer {
  addLayer(layer: CanvasLayer): () => void
  dispose(): void
}

export function createCanvasRenderer(canvas: HTMLCanvasElement): CanvasGameRenderer {
  const renderer = new CanvasLayerRenderer(canvas)
  const indicators = new DecisionIndicators()

  let currentWorld: GameWorld | null = null

  function getWorld(): GameWorld {
    if (!currentWorld) {
      throw new Error('Cannot access the world outside rendering')
    }

    return currentWorld
  }

  renderer.addLayer(drawBackground)

  renderer.addLayer(({ context }) => {
    for (const road of getWorld().roads.values()) {
      drawRoad(context, road)
    }
  })

  renderer.addLayer(({ context }) => {
    for (const intersection of getWorld().intersections.values()) {
      drawIntersection(context, intersection)
    }
  })

  renderer.addLayer(({ context, timeMs }) => {
    for (const crossing of getWorld().crossings.values()) {
      drawPedestrianCrossing(context, crossing, timeMs / 1_000)
    }
  })

  renderer.addLayer(({ context }) => {
    const world = getWorld()
    const residents = [...world.residents.values()]

    for (const building of world.buildings.values()) {
      const count = residents.filter(
        (resident) =>
          resident.currentBuildingId === building.id &&
          resident.state === ResidentState.IdleInBuilding,
      ).length

      drawBuilding(context, building, count)
    }
  })

  renderer.addLayer(({ context }) => {
    for (const stop of getWorld().stops.values()) {
      drawBusStop(context, stop)
    }
  })

  renderer.addLayer(({ context }) => {
    for (const bus of getWorld().buses.values()) {
      drawBus(context, bus)
    }
  })

  renderer.addLayer((frame) => {
    const world = getWorld()

    indicators.update(world.residents.values(), frame.timeMs)

    const groups = groupVisibleResidents(world.residents.values())

    for (const resident of world.residents.values()) {
      if (resident.state === ResidentState.Dead) drawDeadResident(frame.context, resident)
    }

    for (const group of groups) {
      drawResidentGroup(frame.context, group[0]!, group.length)
    }

    for (const group of groups) {
      const resident = group[0]!
      const indicator = indicators.get(resident)

      if (!indicator) {
        continue
      }

      drawDecisionIndicator(frame, resident, indicator.decision, indicator.expiresAt - frame.timeMs)
    }
  })

  renderer.addLayer(({ context }) => {
    drawDebugInformation(context, getWorld().money)
  })

  return {
    render(world, timeMs) {
      currentWorld = world

      try {
        renderer.render(timeMs)
      } finally {
        currentWorld = null
      }
    },

    addLayer(layer) {
      return renderer.addLayer(layer)
    },

    dispose() {
      renderer.dispose()
    },
  }
}
