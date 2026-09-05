import { onMounted, onUnmounted } from 'vue'

import { GAME_CONFIG } from '@/game/config/game.config'

export function useGameLoop(update: (deltaSeconds: number) => void) {
  let animationFrameId: number | null = null
  let previousTimestamp: number | null = null

  function frame(timestamp: number): void {
    if (previousTimestamp !== null) {
      const deltaSeconds = Math.min(
        (timestamp - previousTimestamp) / 1000,
        GAME_CONFIG.simulation.maxDeltaSeconds,
      )

      update(deltaSeconds)
    }

    previousTimestamp = timestamp
    animationFrameId = requestAnimationFrame(frame)
  }

  function start(): void {
    if (animationFrameId !== null) {
      return
    }

    previousTimestamp = null
    animationFrameId = requestAnimationFrame(frame)
  }

  function stop(): void {
    if (animationFrameId === null) {
      return
    }

    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    previousTimestamp = null
  }

  onMounted(start)
  onUnmounted(stop)

  return {
    start,
    stop,
  }
}
