<script lang="ts" setup>
import { storeToRefs } from 'pinia'

import AppButton from '@/components/common/AppButton.vue'
import { BuildMode, useUiStore } from '@/stores/ui.store'

const uiStore = useUiStore()
const { activeBuildMode } = storeToRefs(uiStore)

function selectMode(mode: BuildMode) {
  uiStore.toggleBuildMode(mode)
}
</script>

<template>
  <footer class="build-toolbar">
    <AppButton :aria-pressed="activeBuildMode === BuildMode.Bus" @click="selectMode(BuildMode.Bus)">
      Автобус
    </AppButton>

    <AppButton
      :aria-pressed="activeBuildMode === BuildMode.Crosswalk"
      @click="selectMode(BuildMode.Crosswalk)"
    >
      Переход
    </AppButton>

    <AppButton
      :aria-pressed="activeBuildMode === BuildMode.TrafficLight"
      @click="selectMode(BuildMode.TrafficLight)"
    >
      Светофор
    </AppButton>
  </footer>
</template>

<style scoped>
.build-toolbar {
  display: flex;
  min-height: 4.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(90deg, transparent, rgb(27 167 181 / 0.09), transparent), #14272c;
  border-top: 1px solid rgb(80 175 179 / 0.28);
}

[aria-pressed='true'] {
  color: #14272c;
  background: #d9f2ef;
  outline: 2px solid #41c7ce;
  outline-offset: 2px;
  box-shadow: 0 0 1.4rem rgb(65 199 206 / 0.38);
}
</style>
