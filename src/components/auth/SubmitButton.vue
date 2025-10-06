<template>
  <n-button
    :type="type"
    :size="size"
    :round="round"
    :block="block"
    :loading="loading"
    :disabled="disabled || loading"
    :attr-type="nativeType"
    @click="onClick"
  >
    <slot />
  </n-button>
</template>

<script lang="ts" setup>
interface Props {
  type?: 'default' | 'primary' | 'tertiary' | 'success' | 'warning' | 'error'
  size?: 'tiny' | 'small' | 'medium' | 'large'
  round?: boolean
  block?: boolean
  loading?: boolean
  disabled?: boolean
  nativeType?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'large',
  round: true,
  block: true,
  loading: false,
  disabled: false,
  nativeType: 'submit',
})

const emit = defineEmits<{ (e: 'click'): void }>()
const onClick = () => {
  if (props.loading || props.disabled) return
  emit('click')
}
</script>
