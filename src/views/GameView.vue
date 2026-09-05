<script lang="ts" setup>
import GameHud from '@/features/game-session/components/GameHud.vue'
import GameCanvas from '@/features/game-session/components/GameCanvas.vue'
import BuildToolbar from '@/features/infrastructure-building/components/BuildToolbar.vue'
import { markRaw, onUnmounted, watch } from 'vue'
import { GameSession } from '@/features/game-session/model/GameSession.ts'
import { provideGameSession } from '@/features/game-session/composables/useGameSessionContext.ts'
import { useGameSessionStore } from '@/stores/gameSession.store.ts'
import { useGameLoop } from '@/features/game-session/composables/useGameLoop.ts'
import { GAME_CONFIG } from '@/game/config/game.config.ts'

const gameSession = markRaw(new GameSession())
provideGameSession(gameSession)
const gameSessionStore = useGameSessionStore()

let snapshotElapsedSeconds = 0

useGameLoop((deltaSeconds) => {
  gameSession.update(deltaSeconds)
  snapshotElapsedSeconds += deltaSeconds
  if (snapshotElapsedSeconds < GAME_CONFIG.ui.snapshotIntervalSeconds) {
    return
  }

  gameSessionStore.applySnapshot(gameSession.getSnapshot())
  snapshotElapsedSeconds = 0
})

watch(
  () => gameSessionStore.status,
  (status) => {
    if (status === 'running') {
      gameSession.resume()
      return
    }
    gameSession.pause()
  },
  { immediate: true },
)

onUnmounted(() => {
  gameSession.dispose()
})
</script>

<template>
  <main class="game-view">
    <GameHud />
    <GameCanvas />
    <BuildToolbar />
  </main>
</template>

<style scoped>
.game-view {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto minmax(0, 1fr) auto;
  background: #eef2f7;
}
</style>
