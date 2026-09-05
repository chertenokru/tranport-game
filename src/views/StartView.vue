<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import { useGameSessionStore } from '@/stores/gameSession.store.ts'

const router = useRouter()
const gameSessionStore = useGameSessionStore()

async function startGame() {
  gameSessionStore.start()
  await router.push({ name: 'game' })
}
</script>

<template>
  <main class="start-view">
    <h1>Transport Manager</h1>
    <p>Создай безопасную и эффективную транспортную систему.</p>

    <AppButton @click="startGame">Начать игру</AppButton>
  </main>
</template>

<style scoped>
.start-view {
  display: grid;
  min-height: 100vh;
  place-content: center;
  justify-items: center;
  padding: 2rem;
  text-align: center;
}
</style>
