<template>
  <n-alert
    class="share-success-banner"
    type="success"
    :show-icon="false"
    :bordered="false"
    :closable="true"
    @close="emitClose"
  >
    <div class="banner-title">{{ t('shareBanner.title') }}</div>
    <div class="row">
      <span class="label">{{ t('shareBanner.code') }}</span>
      <span class="value">{{ displayCode }}</span>
      <n-button size="tiny" quaternary @click="copyText(info.code)">
        {{ t('common.actions.copy') }}
      </n-button>
      >
    </div>
    <div v-if="info.link" class="row">
      <span class="label">{{ t('shareBanner.link') }}</span>
      <n-input size="small" readonly :value="info.link" class="link-input" />
      <n-button size="tiny" quaternary @click="copyText(info.link)">
        {{ t('common.actions.copyLink') }}
      </n-button>
      >
    </div>
    <div v-if="info.password" class="row">
      <span class="label">{{ t('shareBanner.password') }}</span>
      <n-input
        size="small"
        readonly
        :value="info.password"
        class="link-input"
      />
      <n-button size="tiny" quaternary @click="copyText(String(info.password))">
        {{ t('common.actions.copyPassword') }}
      </n-button>
      >
    </div>
    <div v-if="expireLabel" class="row info">
      <span class="label">{{ t('shareBanner.expireTime') }}</span>
      <span class="value">{{ expireLabel }}</span>
    </div>
  </n-alert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { ShareInfoPayload } from '@/utils/shareStorage'
import { useI18n } from '@/composables/locale'

const props = defineProps<{
  info: ShareInfoPayload
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const message = useMessage()
const { t } = useI18n()

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
    message.success(t('common.feedback.copySuccess'))
  } catch (error) {
    console.error(error)
    message.error(t('common.feedback.copyError'))
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
