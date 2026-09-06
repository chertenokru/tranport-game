import type { GameWorld } from '@/game/core/GameWorld'
import { ResidentState } from '@/game/domain/Resident'

import type { GameRenderer } from './GameRenderer'
import type { CanvasLayer } from './CanvasLayer'
import { CanvasLayerRenderer } from './CanvasLayerRenderer'

import { drawBackground } from './DrawsLayers/drawBackground'
import { drawRoad } from './DrawsLayers/drawRoad'
import { drawBuilding } from './DrawsLayers/drawBuilding'
import { drawBusStop } from './DrawsLayers/drawBusStop'
import { drawBus } from './DrawsLayers/drawBus'
import { drawResidentGroup } from './DrawsLayers/drawResidentGroup'
import { drawDecisionIndicator } from './DrawsLayers/drawDecisionIndicator'
import { drawDebugInformation } from './DrawsLayers/drawDebugInformation'

import { DecisionIndicators } from './tools/DecisionIndicators'
import { groupVisibleResidents } from './tools/groupVisibleResidents'

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
