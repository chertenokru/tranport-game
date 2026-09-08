<script lang="ts" setup>
import { GameStatus, useGameSessionStore } from '@/stores/gameSession.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import AppButton from '@/components/common/AppButton.vue'

const gameSessionStore = useGameSessionStore()
const { status, money, activeBuses, totalResidents, idleResidents, accidents, elapsedTimeSeconds } =
  storeToRefs(gameSessionStore)

const statusLabels: Record<GameStatus, string> = {
  [GameStatus.Idle]: 'Не запущена',
  [GameStatus.Running]: 'Игра идёт',
  [GameStatus.Paused]: 'Пауза',
  [GameStatus.Finished]: 'Игра закончена',
}
const statusLabel = computed(() => statusLabels[status.value])
const canTogglePause = computed(
  () => status.value === GameStatus.Running || status.value === GameStatus.Paused,
)
const elapsedTimeLabel = computed(() => `${Math.floor(elapsedTimeSeconds.value)} с`)
const pauseButtonLabel = computed(() =>
  status.value === GameStatus.Paused ? 'Продолжить' : 'Пауза',
)
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
  position: relative;
  z-index: 2;
  min-height: 4.2rem;
  grid-template-columns:
    max-content
    minmax(20rem, 1fr)
    6rem
    8.5rem
    8.5rem;
  align-items: center;
  gap: 1.2rem;
  padding: 0.55rem 1.1rem;
  color: #d8e6e4;
  background: linear-gradient(90deg, rgb(27 167 181 / 0.12), transparent 34%), #14272c;
  border-bottom: 1px solid rgb(80 175 179 / 0.28);
  box-shadow: 0 0.4rem 1.4rem rgb(10 31 34 / 0.2);
}

.game-hud > strong {
  color: #f7faf7;
  font-size: 0.92rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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
  padding: 0.42rem 0.55rem;
  background: rgb(255 255 255 / 0.055);
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 0.55rem;
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
  color: #f3f8f6;
  font-size: 0.84rem;
  font-variant-numeric: tabular-nums;
}
.game-hud__pause-button,
.game-hud__status {
  inline-size: 8.5rem;
}
.game-hud__status {
  white-space: nowrap;
}

.game-hud__time,
.game-hud__status {
  color: #bed0ce;
  font-size: 0.8rem;
}

@media (max-width: 1050px) {
  .game-hud {
    grid-template-columns: max-content 1fr max-content;
  }

  .game-hud__stats {
    max-width: none;
  }

  .game-hud__time,
  .game-hud__status {
    display: none;
  }
}
</style>
