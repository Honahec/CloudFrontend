<template>
  <n-breadcrumb class="path">
    <n-breadcrumb-item>
      <a class="link" href="#" @click.prevent="onRootClick">{{ rootLabel }}</a>
    </n-breadcrumb-item>
    <n-breadcrumb-item v-for="(seg, idx) in visibleSegments" :key="`${idx}-${seg}`">
      <a class="link" href="#" @click.prevent="onSegClick(idx)">
        {{ seg || unnamedLabel }}
      </a>
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from '@/composables/locale'

const props = defineProps<{
  segments: string[]
  rootLabel?: string
}>()

const emit = defineEmits<{
  (e: 'navigate-root'): void
  (e: 'navigate-to', index: number): void
}>()

const { t } = useI18n()

const visibleSegments = computed(() => props.segments.filter((seg) => seg !== ''))
const rootLabel = computed(() => props.rootLabel || t('drive.breadcrumb.root'))
const unnamedLabel = computed(() => t('drive.breadcrumb.unnamed'))

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
  color: var(--color-text);
  font-weight: 500;
}
.link:hover {
  text-decoration: underline;
}
</style>
