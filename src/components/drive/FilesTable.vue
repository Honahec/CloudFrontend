<template>
  <el-empty v-if="loading && files.length === 0" description="Loading..." />
  <el-empty v-else-if="!loading && files.length === 0" description="No files" />

  <el-table
    v-else
    :data="files"
    border
    class="file-table"
    :row-key="rowKey"
    @selection-change="(rows:any) => emit('selection-change', rows as FileRecord[])"
  >
    <el-table-column type="selection" width="48" />
    <el-table-column prop="name" label="File Name" min-width="280">
      <template #default="{ row }">
        <a class="file-link" href="#" @click.prevent="emit('open', row as FileRecord)">
          {{ (row as FileRecord).name }}
        </a>
      </template>
    </el-table-column>
    <el-table-column prop="content_type" label="Content Type" width="200" />
    <el-table-column prop="size" label="Size" width="140">
      <template #default="{ row }">{{ formatSize((row as FileRecord).size) }}</template>
    </el-table-column>
    <el-table-column prop="created_at" label="Created" width="220" />
    <el-table-column label="Actions" min-width="200">
      <template #default="{ row }">
        <el-space size="small">
          <el-button link type="primary" @click="emit('download', row as FileRecord)">
            Download
          </el-button>
          <el-button link type="danger" @click="emit('delete', row as FileRecord)">
            Delete
          </el-button>
        </el-space>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import type { FileRecord } from '@/api/files/type'

defineProps<{
  files: FileRecord[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'open', row: FileRecord): void
  (e: 'download', row: FileRecord): void
  (e: 'delete', row: FileRecord): void
  (e: 'selection-change', rows: FileRecord[]): void
}>()

const rowKey = (row: FileRecord) => row.id

function formatSize(size: number) {
  if (!Number.isFinite(size)) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`
}
</script>

<style scoped>
.file-table :deep(.cell) {
  white-space: nowrap;
}
.file-link {
  color: var(--el-color-primary);
}
.file-link:hover {
  text-decoration: underline;
}
</style>

