<template>
  <n-empty
    v-if="loading && files.length === 0"
    :description="t('filesTable.emptyLoading')"
  />
  <n-empty
    v-else-if="!loading && files.length === 0"
    :description="t('filesTable.empty')"
  />

  <n-data-table
    v-else
    :data="files"
    :columns="columns"
    :loading="loading"
    :row-key="rowKey"
    :single-line="false"
    class="file-table"
    @update:checked-row-keys="onCheckedKeys"
  />
</template>

<script lang="ts" setup>
import { h, ref, computed } from 'vue'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import { NButton } from 'naive-ui'
import { useI18n } from '@/composables/locale'
import type { FileRecord } from '@/api/files/type'

const props = defineProps<{
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

const { t } = useI18n()

const columns = computed<DataTableColumns<FileRecord>>(() => [
  { type: 'selection', multiple: true, width: 48 },
  {
    title: t('filesTable.columns.name'),
    key: 'name',
    minWidth: 280,
    render: (row) =>
      h(
        NButton,
        {
          text: true,
          type: 'default',
          quaternary: true,
          onClick: () => emit('open', row),
        },
        { default: () => row.name }
      ),
  },
  { title: t('filesTable.columns.contentType'), key: 'content_type', width: 200 },
  {
    title: t('filesTable.columns.size'),
    key: 'size',
    width: 140,
    render: (row) => formatSize(row.size as any),
  },
  { title: t('filesTable.columns.created'), key: 'created_at', width: 220 },
  {
    title: t('filesTable.columns.actions'),
    key: 'actions',
    minWidth: 200,
    render: (row) => [
      h(
        NButton,
        {
          text: true,
          type: 'default',
          onClick: () => emit('download', row),
          style: { marginRight: '8px' },
        },
        { default: () => t('common.actions.download') }
      ),
      h(
        NButton,
        { text: true, type: 'error', onClick: () => emit('delete', row) },
        { default: () => t('common.actions.delete') }
      ),
    ],
  },
])

const onCheckedKeys = (keys: Array<DataTableRowKey>) => {
  const map = new Map(
    props.files.map((r) => [r.id as any as DataTableRowKey, r])
  )
  const rows: FileRecord[] = []
  keys.forEach((k) => {
    const r = map.get(k)
    if (r) rows.push(r)
  })
  emit('selection-change', rows)
}
</script>

<style scoped>
.file-table :deep(.n-data-table-td) {
  white-space: nowrap;
}
</style>
