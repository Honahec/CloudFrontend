<template>
  <n-alert
    class="share-success-banner"
    type="success"
    :show-icon="false"
    :bordered="false"
    :closable="true"
    @close="emitClose"
  >
    <div class="banner-title">分享创建成功</div>
    <div class="row">
      <span class="label">分享码</span>
      <span class="value">{{ displayCode }}</span>
      <n-button size="tiny" quaternary @click="copyText(info.code)"
        >复制</n-button
      >
    </div>
    <div v-if="info.link" class="row">
      <span class="label">链接</span>
      <n-input size="small" readonly :value="info.link" class="link-input" />
      <n-button size="tiny" quaternary @click="copyText(info.link)"
        >复制链接</n-button
      >
    </div>
    <div v-if="info.password" class="row">
      <span class="label">访问密码</span>
      <n-input
        size="small"
        readonly
        :value="info.password"
        class="link-input"
      />
      <n-button size="tiny" quaternary @click="copyText(String(info.password))"
        >复制密码</n-button
      >
    </div>
    <div v-if="expireLabel" class="row info">
      <span class="label">过期时间</span>
      <span class="value">{{ expireLabel }}</span>
    </div>
  </n-alert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { ShareInfoPayload } from '@/utils/shareStorage'

const props = defineProps<{
  info: ShareInfoPayload
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const message = useMessage()

const displayCode = computed(() => props.info.code?.trim() || '-')

const expireLabel = computed(() => {
  const raw = props.info.expireTime
  if (!raw) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(raw))
  } catch (error) {
    console.warn('Failed to format expire time', error)
    return raw
  }
})

function emitClose() {
  emit('close')
}

async function copyText(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  } catch (error) {
    console.error(error)
    message.error('复制失败')
  }
}
</script>

<style scoped>
.share-success-banner {
  margin-bottom: 16px;
}
.banner-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.row.info {
  margin-bottom: 0;
}
.row.actions {
  justify-content: flex-end;
}
.label {
  color: #4b5563;
  min-width: 88px;
}
.value {
  font-weight: 600;
}
.link-input {
  max-width: 260px;
  flex: 1 1 240px;
}
</style>
