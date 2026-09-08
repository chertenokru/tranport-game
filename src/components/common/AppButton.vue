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
  min-height: 2.65rem;
  padding: 0.68rem 1.2rem;
  color: #f7faf7;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 750;
  letter-spacing: 0.045em;
  background: linear-gradient(145deg, #1ca8b5, #08727d);
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 0.65rem;
  box-shadow: 0 0.4rem 1.1rem rgb(8 114 125 / 0.18);
  cursor: pointer;
  transition:
    translate 140ms ease,
    box-shadow 140ms ease,
    filter 140ms ease;
}

.app-button:hover:not(:disabled) {
  translate: 0 -1px;
  filter: brightness(1.06);
  box-shadow: 0 0.55rem 1.35rem rgb(8 114 125 / 0.26);
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}
</style>
