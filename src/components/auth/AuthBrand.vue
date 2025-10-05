<template>
  <div class="auth-brand" :aria-label="ariaLabel">
    <slot>
      <div class="logo-circle" aria-hidden="true"></div>
      <div class="brand-text">
        <span class="brand-name">{{ appName }}</span>
      </div>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  appName?: string
  ariaLabel?: string
}

const props = defineProps<Props>()

const appName = computed(() => props.appName ?? 'Cloud')
const ariaLabel = computed(() => props.ariaLabel ?? 'Application brand')
</script>

<style scoped>
.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.logo-circle {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: rgb(var(--auth-accent, var(--color-brand-600)));
  box-shadow: 0 0 0 4px rgb(var(--auth-accent-weak, var(--color-brand-400)) / 0.25);
}
.brand-name {
  font-weight: 700;
  letter-spacing: 0.2px;
}
</style>
