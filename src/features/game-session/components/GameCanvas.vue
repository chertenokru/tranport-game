<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue'

import { type CanvasGameRenderer, createCanvasRenderer } from '@/game/rendering/createCanvasRenderer'
import { useGameSessionContext } from '@/features/game-session/composables/useGameSessionContext'

const gameSession = useGameSessionContext()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

let renderer: CanvasGameRenderer | null = null

onMounted(() => {
  if (!canvas.value) {
    throw new Error('Game canvas element is not mounted')
  }

  renderer = createCanvasRenderer(canvas.value)
  gameSession.attachRenderer(renderer)
})

onUnmounted(() => {
  if (!renderer) {
    return
  }

  gameSession.detachRenderer(renderer)
  renderer.dispose()
  renderer = null
})
</script>

<template>
  <div class="game-canvas-container">
    <canvas ref="canvas" aria-label="Карта города" class="game-canvas" height="720" width="960" />
  </div>
</template>

<style scoped>
.game-canvas-container {
  display: grid;
  min-height: 0;
  padding: 1rem;
  place-items: center;
  overflow: hidden;
  background: #cbd5e1;
}

.game-canvas {
  display: block;
  width: min(100%, 960px);
  height: auto;
  background: #dbeafe;
  border: 1px solid #94a3b8;
  border-radius: 0.5rem;
  aspect-ratio: 4 / 3;
}
</style>
