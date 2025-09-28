<template>
  <div class="upload-progress-list" role="status">
    <div
      v-for="item in props.items"
      :key="item.id"
      class="upload-progress-item"
    >
      <div class="item-header">
        <span class="item-name" :title="item.name">{{ item.name }}</span>
        <span class="item-status" :class="item.status">
          {{ statusLabelMap[item.status] || statusLabelMap.uploading }}
        </span>
      </div>
      <div class="item-progress">
        <n-progress
          type="line"
          :percentage="Math.min(100, Math.max(0, item.percent))"
          :status="progressStatus(item.status)"
          :show-indicator="false"
          stroke-width="8"
        />
        <span class="item-percent">{{ item.percent }}%</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from '@/composables/locale'

export type UploadProgressStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface UploadProgressItem {
  id: string
  name: string
  percent: number
  status: UploadProgressStatus
}

const props = defineProps<{
  items: UploadProgressItem[]
}>()

const { t } = useI18n()

const statusLabelMap = computed<Record<UploadProgressStatus, string>>(() => ({
  pending: t('upload.status.pending'),
  uploading: t('upload.status.uploading'),
  success: t('upload.status.success'),
  error: t('upload.status.error'),
}))

function progressStatus(status: UploadProgressStatus) {
  if (status === 'success') return 'success'
  if (status === 'error') return 'error'
  return 'info'
}
</script>

<style scoped>
.upload-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background-color: rgb(var(--color-surface-muted) / 0.9);
  border: 1px solid var(--border-color-subtle);
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  max-width: 360px;
}

.upload-progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: rgb(var(--color-text-secondary));
}

.item-name {
  flex: 1;
  min-width: 0;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: rgb(var(--color-text-primary));
}

.item-status {
  text-transform: uppercase;
  font-size: 12px;
  color: rgb(var(--color-info));
}

.item-status.success {
  color: rgb(var(--color-success));
}

.item-status.error {
  color: rgb(var(--color-error));
}

.item-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-percent {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: rgb(var(--color-text-secondary));
}
</style>
