<script setup lang="ts"></script>

<template>
  <div class="game-canvas-container">
    <canvas class="game-canvas" width="960" height="540" aria-label="Карта города" />
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
  aspect-ratio: 16 / 9;
  background: #dbeafe;
  border: 1px solid #94a3b8;
  border-radius: 0.5rem;
}
</style>
