import { ref } from 'vue'
import { defineStore } from 'pinia'

export type BuildMode = 'bus' | 'crosswalk' | 'trafficLight'
export type ActiveBuildMode = BuildMode | null

export const useUiStore = defineStore('ui', () => {
  const activeBuildMode = ref<ActiveBuildMode>(null)

  function toggleBuildMode(mode: BuildMode) {
    activeBuildMode.value = activeBuildMode.value === mode ? null : mode
  }

  return {
    activeBuildMode,
    toggleBuildMode,
  }
})
