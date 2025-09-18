<template>
  <el-breadcrumb separator="/" class="path">
    <el-breadcrumb-item>
      <a @click.prevent="onRootClick" href="#">/</a>
    </el-breadcrumb-item>
    <el-breadcrumb-item v-for="(seg, idx) in segments" :key="idx">
      <a @click.prevent="onSegClick(idx)" href="#">{{ seg || '(empty)' }}</a>
    </el-breadcrumb-item>
  </el-breadcrumb>
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
a {
  color: var(--el-color-primary);
}
a:hover {
  text-decoration: underline;
}
</style>

