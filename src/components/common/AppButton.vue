<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    type: 'button',
    disabled: false,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button class="app-button" :type="type" :disabled="disabled" @click="emit('click', $event)">
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  padding: 0.75rem 1.25rem;
  color: white;
  font: inherit;
  font-weight: 600;
  background: #2563eb;
  border: 0;
  border-radius: 0.5rem;
  cursor: pointer;
}

.app-button:hover:not(:disabled) {
  background: #1d4ed8;
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
