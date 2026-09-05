<script lang="ts" setup>
import { storeToRefs } from 'pinia'

import AppButton from '@/components/common/AppButton.vue'
import { type BuildMode, useUiStore } from '@/stores/ui.store'

const uiStore = useUiStore()
const { activeBuildMode } = storeToRefs(uiStore)

function selectMode(mode: BuildMode) {
  uiStore.toggleBuildMode(mode)
}
</script>

<template>
  <footer class="build-toolbar">
    <AppButton :aria-pressed="activeBuildMode === 'bus'" @click="selectMode('bus')">
      Автобус
    </AppButton>

    <AppButton :aria-pressed="activeBuildMode === 'crosswalk'" @click="selectMode('crosswalk')">
      Переход
    </AppButton>

    <AppButton
      :aria-pressed="activeBuildMode === 'trafficLight'"
      @click="selectMode('trafficLight')"
    >
      Светофор
    </AppButton>
  </footer>
</template>

<style scoped>
.build-toolbar {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #172033;
}

[aria-pressed='true'] {
  outline: 3px solid #facc15;
  outline-offset: 2px;
}
</style>
