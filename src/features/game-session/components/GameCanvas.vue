<script lang="ts" setup>
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

import { createIsometricRenderer, type IsometricGameRenderer } from '@/game/rendering/createIsometricRenderer'
import { type CanvasGameRenderer, createCanvasRenderer } from '@/game/rendering/createCanvasRenderer'
import { useGameSessionContext } from '@/features/game-session/composables/useGameSessionContext'

type RenderMode = 'canvas' | 'isometric'

const gameSession = useGameSessionContext()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

const renderMode = ref<RenderMode>('isometric')

let renderer: CanvasGameRenderer | IsometricGameRenderer | null = null

function getIsometricRenderer(): IsometricGameRenderer | null {
  return renderer && 'rotateBy' in renderer ? renderer : null
}

function rotate(direction: -1 | 1): void {
  getIsometricRenderer()?.rotateBy(direction * (Math.PI / 2))
}

function zoom(factor: number): void {
  getIsometricRenderer()?.zoomBy(factor)
}

function resetView(): void {
  getIsometricRenderer()?.resetView()
}

onMounted(() => {
  if (!canvas.value) {
    throw new Error('Game canvas element is not mounted')
  }

  renderer = createIsometricRenderer(canvas.value)
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

function switchRenderer(mode: RenderMode): void {
  if (!canvas.value || mode === renderMode.value) {
    return
  }

  if (renderer) {
    gameSession.detachRenderer(renderer)
    renderer.dispose()
  }

  renderer =
    mode === 'isometric'
      ? createIsometricRenderer(canvas.value)
      : createCanvasRenderer(canvas.value)

  renderMode.value = mode
  gameSession.attachRenderer(renderer)
}
</script>

<template>
  <div class="game-canvas-container">
    <canvas
      ref="canvas"
      aria-label="Изометрическая карта города"
      class="game-canvas"
      height="720"
      tabindex="0"
      width="1120"
    />
    <div aria-label="Режим отображения" class="renderer-switch">
      <button
        :aria-pressed="renderMode === 'canvas'"
        :class="{ active: renderMode === 'canvas' }"
        @click="switchRenderer('canvas')"
      >
        2D
      </button>

      <button
        :aria-pressed="renderMode === 'isometric'"
        :class="{ active: renderMode === 'isometric' }"
        @click="switchRenderer('isometric')"
      >
        3D
      </button>
    </div>

    <div v-if="renderMode === 'isometric'" aria-label="Управление камерой" class="camera-controls">
      <button aria-label="Повернуть влево" title="Повернуть влево" @click="rotate(-1)">↶</button>
      <button aria-label="Уменьшить масштаб" title="Уменьшить масштаб" @click="zoom(1 / 1.15)">
        −
      </button>
      <button aria-label="Сбросить камеру" title="Сбросить камеру" @click="resetView">⌂</button>
      <button aria-label="Увеличить масштаб" title="Увеличить масштаб" @click="zoom(1.15)">
        +
      </button>
      <button aria-label="Повернуть вправо" title="Повернуть вправо" @click="rotate(1)">↷</button>
    </div>

    <span v-if="renderMode === 'isometric'" class="camera-hint"
      >Перетащите для плавного поворота · Колесо для масштаба</span
    >
  </div>
</template>

<style scoped>
.game-canvas-container {
  display: grid;
  position: relative;
  min-height: 0;
  padding: clamp(0.5rem, 2vw, 1.25rem);
  place-items: center;
  overflow: hidden;
  background: radial-gradient(circle at 50% 10%, rgb(255 255 255 / 0.72), transparent 42%), #c8d2d0;
}

.game-canvas {
  display: block;
  width: min(100%, 1120px);
  height: auto;
  background: #e7ece9;
  border: 1px solid rgb(67 89 89 / 0.35);
  border-radius: 1rem;
  box-shadow: 0 1.5rem 4rem rgb(24 52 50 / 0.2);
  aspect-ratio: 14 / 9;
  cursor: grab;
  touch-action: none;
}

.game-canvas:focus-visible {
  outline: 3px solid #1ba7b5;
  outline-offset: 3px;
}

.camera-controls {
  display: flex;
  position: absolute;
  top: clamp(1rem, 3vw, 2.2rem);
  right: clamp(1rem, 3vw, 2.2rem);
  gap: 0.3rem;
  padding: 0.35rem;
  background: rgb(247 250 247 / 0.9);
  border: 1px solid rgb(67 89 89 / 0.22);
  border-radius: 0.75rem;
  box-shadow: 0 0.65rem 1.5rem rgb(24 52 50 / 0.16);
  backdrop-filter: blur(8px);
}

.camera-controls button {
  display: grid;
  width: 2.15rem;
  height: 2.15rem;
  padding: 0;
  place-items: center;
  color: #17353a;
  font-size: 1.15rem;
  font-weight: 700;
  background: transparent;
  border: 0;
  border-radius: 0.48rem;
  cursor: pointer;
}

.camera-controls button:hover {
  color: white;
  background: #1595a1;
}

.camera-controls button:focus-visible {
  outline: 2px solid #1595a1;
  outline-offset: 1px;
}

.camera-hint {
  position: absolute;
  right: clamp(1rem, 3vw, 2.2rem);
  bottom: clamp(1rem, 3vw, 2.2rem);
  padding: 0.42rem 0.65rem;
  color: #41585b;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  background: rgb(247 250 247 / 0.82);
  border-radius: 0.5rem;
  pointer-events: none;
  backdrop-filter: blur(6px);
}

@media (max-width: 650px) {
  .camera-hint {
    display: none;
  }

  .camera-controls {
    top: 0.75rem;
    right: 0.75rem;
    scale: 0.9;
    transform-origin: top right;
  }
}

.renderer-switch {
  display: flex;
  position: absolute;
  top: clamp(1rem, 3vw, 2.2rem);
  left: clamp(1rem, 3vw, 2.2rem);
  z-index: 2;
  gap: 0.25rem;
  padding: 0.35rem;
  background: rgb(247 250 247 / 0.9);
  border: 1px solid rgb(67 89 89 / 0.22);
  border-radius: 0.75rem;
  box-shadow: 0 0.65rem 1.5rem rgb(24 52 50 / 0.16);
  backdrop-filter: blur(8px);
}

.renderer-switch button {
  min-width: 2.8rem;
  height: 2.15rem;
  padding: 0 0.65rem;
  color: #17353a;
  font-weight: 700;
  background: transparent;
  border: 0;
  border-radius: 0.48rem;
  cursor: pointer;
}

.renderer-switch button:hover,
.renderer-switch button.active {
  color: white;
  background: #1595a1;
}
</style>
