<template>
  <n-button
    :type="type"
    :size="size"
    :round="round"
    :block="block"
    :loading="loading"
    :disabled="disabled || loading"
    @click="onClick"
  >
    <slot />
  </n-button>
</template>
<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  type?: 'default' | 'primary' | 'tertiary' | 'success' | 'warning' | 'error'
  size?: 'tiny' | 'small' | 'medium' | 'large'
  round?: boolean
  block?: boolean
  loading?: boolean
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'large',
  round: true,
  block: true,
  loading: false,
  disabled: false,
})

const emit = defineEmits<{ (e: 'click'): void }>()
const onClick = () => emit('click')
</script>
