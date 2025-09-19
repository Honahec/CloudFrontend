<template>
  <n-breadcrumb class="path">
    <n-breadcrumb-item>
      <a class="link" @click.prevent="onRootClick" href="#">/</a>
    </n-breadcrumb-item>
    <n-breadcrumb-item v-for="(seg, idx) in segments" :key="idx">
      <a class="link" @click.prevent="onSegClick(idx)" href="#">{{ seg || '(empty)' }}</a>
    </n-breadcrumb-item>
  </n-breadcrumb>
  
</template>

<script lang="ts" setup>
const props = defineProps<{
  segments: string[]
}>()

const emit = defineEmits<{
  (e: 'navigate-root'): void
  (e: 'navigate-to', index: number): void
}>()

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
  color: #18a058; /* Naive UI primary default */
}
.link:hover {
  text-decoration: underline;
}
</style>
