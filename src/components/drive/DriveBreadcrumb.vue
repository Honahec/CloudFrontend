<template>
  <n-breadcrumb class="path">
    <n-breadcrumb-item>
      <a class="link" href="#" @click.prevent="onRootClick">{{ rootLabel }}</a>
    </n-breadcrumb-item>
    <n-breadcrumb-item v-for="(seg, idx) in visibleSegments" :key="`${idx}-${seg}`">
      <a class="link" href="#" @click.prevent="onSegClick(idx)">
        {{ seg || '(unnamed)' }}
      </a>
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    segments: string[]
    rootLabel?: string
  }>(),
  {
    rootLabel: 'Drive',
  }
)

const emit = defineEmits<{
  (e: 'navigate-root'): void
  (e: 'navigate-to', index: number): void
}>()

const visibleSegments = computed(() => props.segments.filter((seg) => seg !== ''))
const rootLabel = computed(() => props.rootLabel || 'Drive')

function onRootClick() {
  emit('navigate-root')
}

function onSegClick(idx: number) {
  emit('navigate-to', idx)
}
</script>

<style scoped>
.path {
  padding: 8px 0;
}
.link {
  color: #18a058;
}
.link:hover {
  text-decoration: underline;
}
</style>
