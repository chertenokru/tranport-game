<script lang="ts" setup>
import { type GameStatus, useGameSessionStore } from '@/stores/gameSession.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import AppButton from '@/components/common/AppButton.vue'

const gameSessionStore = useGameSessionStore()
const { status, money, activeBuses, totalResidents, idleResidents, accidents, elapsedTimeSeconds } =
  storeToRefs(gameSessionStore)

const statusLabels: Record<GameStatus, string> = {
  idle: 'Не запущена',
  running: 'Игра идёт',
  paused: 'Пауза',
  finished: 'Игра закончена',
}
const statusLabel = computed(() => statusLabels[status.value])
const canTogglePause = computed(() => status.value === 'running' || status.value === 'paused')
const elapsedTimeLabel = computed(() => `${Math.floor(elapsedTimeSeconds.value)} с`)
const pauseButtonLabel = computed(() => (status.value === 'paused' ? 'Продолжить' : 'Пауза'))
</script>

<template>
  <header class="game-hud">
    <strong>Transport Manager</strong>

    <dl class="game-hud__stats">
      <div>
        <dt>Деньги</dt>
        <dd>💰 {{ money }}</dd>
      </div>

      <div>
        <dt>Автобусы</dt>
        <dd>🚌 {{ activeBuses }}</dd>
      </div>

      <div>
        <dt>Жители</dt>
        <dd
          :title="`Всего жителей: ${totalResidents}; в зданиях: ${idleResidents}; в пути: ${totalResidents - idleResidents}`"
        >
          👥 {{ totalResidents }} / 🏠 {{ idleResidents }}
        </dd>
      </div>

      <div>
        <dt>ДТП</dt>
        <dd>⚠️ {{ accidents }}</dd>
      </div>
    </dl>

    <span class="game-hud__time"> Время: {{ elapsedTimeLabel }} </span>
    <span class="game-hud__status">Статус: {{ statusLabel }}</span>
    <AppButton
      :disabled="!canTogglePause"
      class="game-hud__pause-button"
      @click="gameSessionStore.togglePause"
    >
      {{ pauseButtonLabel }}
    </AppButton>
  </header>
</template>

<style scoped>
.game-hud {
  display: grid;
  min-height: 3.5rem;
  grid-template-columns:
    max-content
    minmax(20rem, 1fr)
    6rem
    8.5rem
    8.5rem;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1rem;
  color: white;
  background: #172033;
}
.game-hud__stats {
  display: grid;
  width: 100%;
  max-width: 32rem;
  grid-template-columns: repeat(4, 1fr);
  justify-self: center;
  gap: 1rem;
  margin: 0;
}
.game-hud__time {
  inline-size: 6rem;
  white-space: nowrap;
}
.game-hud__stats div {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
}

.game-hud__stats dt {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.game-hud__stats dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.game-hud__pause-button,
.game-hud__status {
  inline-size: 8.5rem;
}
.game-hud__status {
  white-space: nowrap;
}
</style>
