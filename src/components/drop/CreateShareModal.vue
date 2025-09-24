<template>
  <n-modal
    :show="show"
    preset="card"
    class="share-modal"
    :style="modalStyle"
    @close="handleCancel"
  >
    <template #header>{{ t('shareModal.title') }}</template>

    <div class="section">
      <div class="section-title">{{ t('shareModal.selectedItems') }}</div>
      <n-spin :show="previewLoading" size="small">
        <div v-if="selectedItems.length === 0" class="hint">
          {{ t('shareModal.noSelection') }}
        </div>
        <n-tree
          v-else-if="selectedTree.length > 0"
          :data="selectedTree"
          :block-line="true"
          :selectable="false"
          :show-line="true"
          :default-expanded-keys="selectedTreeKeys"
        />
        <div v-else class="hint">{{ t('shareModal.noFiles') }}</div>
      </n-spin>
      <n-alert
        v-if="hasFolderSelected"
        type="info"
        class="mt-2"
        :bordered="false"
      >
        {{ t('shareModal.includeHint') }}
      </n-alert>
    </div>

    <n-form label-placement="top" class="section" :model="formModel">
      <n-form-item :label="t('shareModal.form.code')" path="code">
        <n-input v-model:value="formModel.code" maxlength="10" show-count />
      </n-form-item>
      <div class="form-grid">
        <n-form-item :label="t('shareModal.form.expires')" path="expire_days">
          <n-select
            v-model:value="formModel.expire_days"
            :options="expireOptions"
          />
        </n-form-item>
        <n-form-item
          :label="t('shareModal.form.downloads')"
          path="max_download_count"
        >
          <n-input-number
            v-model:value="formModel.max_download_count"
            :min="1"
          />
        </n-form-item>
      </div>
      <div class="form-grid">
        <n-form-item
          :label="t('shareModal.form.requireLogin')"
          path="require_login"
        >
          <n-switch v-model:value="formModel.require_login" />
        </n-form-item>
        <n-form-item :label="t('shareModal.form.password')" path="password">
          <n-input
            v-model:value="formModel.password"
            type="password"
            clearable
          />
        </n-form-item>
      </div>
    </n-form>

    <n-alert
      v-if="shareResult"
      type="success"
      class="section"
      :bordered="false"
    >
      <div class="result-row">
        <span>{{ t('shareModal.result.code') }}:</span>
        <strong>{{ shareResult.drop.code }}</strong>
      </div>
      <div class="result-row">
        <span>{{ t('shareModal.result.link') }}:</span>
        <a :href="shareLink" target="_blank" rel="noopener">{{ shareLink }}</a>
      </div>
      <div v-if="formModel.password" class="result-row">
        <span>{{ t('shareModal.result.password') }}:</span>
        <strong>{{ formModel.password }}</strong>
      </div>
      <div class="result-row" v-if="shareResult.drop.expire_time">
        <span>{{ t('shareModal.result.expires') }}:</span
        >{{ formatDate(shareResult.drop.expire_time) }}
      </div>
    </n-alert>

    <template #action>
      <n-space>
        <n-button @click="handleCancel">{{
          t('common.actions.close')
        }}</n-button>
        <n-button
          v-if="!shareResult"
          type="primary"
          :disabled="selectedItems.length === 0"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ t('common.actions.createShare') }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { listFilesByPath } from '@/api/files/api'
import type { FileRecord } from '@/api/files/type'
import { createDrop } from '@/api/drop/api'
import type { DropCreateResponse } from '@/api/drop/type'
import { storeShareInfo } from '@/utils/shareStorage'
import {
  buildShareTree,
  collectTreeKeys,
  type ShareTreeOption,
} from '@/utils/shareTree'
import { useI18n } from '@/composables/locale'

const props = defineProps<{
  show: boolean
  files: FileRecord[]
  minWidth?: string
  maxWidth?: string
}>()

const modalStyle = computed(() => ({
  width: props.minWidth ?? '60vw',
  maxWidth: props.maxWidth ?? '60vw',
}))

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'created', payload: DropCreateResponse): void
}>()

const message = useMessage()
const { t } = useI18n()

interface FormModel {
  code: string
  expire_days: 1 | 3 | 7 | 15
  require_login: boolean
  max_download_count: number
  password: string
}

const formModel = reactive<FormModel>({
  code: generateCode(),
  expire_days: 7,
  require_login: false,
  max_download_count: 10,
  password: '',
})

const expireOptions = computed(() => [
  { label: t('shareModal.expireOptions.one'), value: 1 },
  { label: t('shareModal.expireOptions.three'), value: 3 },
  { label: t('shareModal.expireOptions.seven'), value: 7 },
  { label: t('shareModal.expireOptions.fifteen'), value: 15 },
])

const loading = ref(false)
const shareResult = ref<DropCreateResponse | null>(null)
const previewLoading = ref(false)
const expandedSelection = ref<FileRecord[]>([])
const expandedFileIds = ref<number[]>([])

const selectedItems = computed(() => props.files)
const selectedTree = computed<ShareTreeOption[]>(() =>
  buildShareTree(expandedSelection.value)
)
const selectedTreeKeys = computed(() => collectTreeKeys(selectedTree.value))
const hasFolderSelected = computed(() =>
  selectedItems.value.some((item) => item.content_type === 'folder')
)

const shareLink = computed(() => {
  const code = shareResult.value?.drop?.code
  if (!code) return ''
  const origin = window?.location?.origin ?? ''
  return `${origin}/share/${code}`
})

function generateCode(): string {
  return Math.random()
    .toString(36)
    .replace(/[^a-z0-9]+/gi, '')
    .slice(0, 6)
}

function resetForm() {
  formModel.code = generateCode()
  formModel.expire_days = 7
  formModel.require_login = false
  formModel.max_download_count = 10
  formModel.password = ''
  shareResult.value = null
}

async function handleSubmit() {
  if (selectedItems.value.length === 0) {
    message.warning(t('common.feedback.selectOne'))
    return
  }
  if (!formModel.code.trim()) {
    message.warning(t('shareModal.feedback.codeRequired'))
    return
  }
  loading.value = true
  try {
    let filesToShare = expandedFileIds.value
    if (!filesToShare.length) {
      const expanded = await expandSelectionRecords(selectedItems.value)
      expandedSelection.value = expanded.records
      expandedFileIds.value = expanded.ids
      filesToShare = expanded.ids
    }

    if (filesToShare.length === 0) {
      message.warning(t('common.feedback.selectOne'))
      return
    }

    const payload = {
      files: filesToShare,
      code: formModel.code.trim(),
      expire_days: formModel.expire_days,
      require_login: formModel.require_login,
      max_download_count: formModel.max_download_count,
      password: formModel.password ? formModel.password.trim() : undefined,
    }

    const resp = await createDrop(payload)
    shareResult.value = resp
    emit('created', resp)

    const shareCode = (resp?.drop?.code || payload.code || '').trim()
    const shareLinkValue =
      resp?.share_url || (shareCode ? buildShareLink(shareCode) : '')
    const sharePassword = formModel.password
      ? formModel.password.trim()
      : undefined
    storeShareInfo({
      code: shareCode,
      link: shareLinkValue,
      password: sharePassword,
      expireTime: resp?.drop?.expire_time ?? null,
    })

    message.success(t('common.feedback.shareCreateSuccess'))
    emit('update:show', false)

    if (typeof window !== 'undefined') {
      window.setTimeout(() => window.location.reload(), 0)
    }
  } catch (error: any) {
    console.error(error)
    message.error(error?.message || t('common.feedback.shareCreateFailed'))
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('update:show', false)
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function buildShareLink(code: string) {
  if (!code) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return origin ? `${origin}/share/${code}` : `/share/${code}`
}

async function expandSelectionRecords(records: FileRecord[]): Promise<{
  records: FileRecord[]
  ids: number[]
}> {
  if (!records.length) {
    return { records: [], ids: [] }
  }
  const result = new Map<number, FileRecord>()
  const fileIds = new Set<number>()
  const visitedFolders = new Set<number>()
  const folderCache = new Map<string, FileRecord[]>()
  const stack: FileRecord[] = [...records]

  while (stack.length > 0) {
    const current = stack.pop() as FileRecord
    if (!result.has(current.id)) {
      result.set(current.id, current)
    }

    if (current.content_type !== 'folder') {
      fileIds.add(current.id)
      continue
    }

    if (visitedFolders.has(current.id)) continue
    visitedFolders.add(current.id)

    const folderPath = buildFolderListPath(current)
    let children = folderCache.get(folderPath)
    if (!children) {
      try {
        const resp = await listFilesByPath(folderPath)
        children = Array.isArray(resp?.files) ? resp.files : []
      } catch (error) {
        throw new Error(
          t('shareModal.feedback.loadFolderFailed', { name: current.name })
        )
      }
      folderCache.set(folderPath, children)
    }

    for (const child of children) {
      if (!result.has(child.id)) {
        stack.push(child)
      }
    }
  }

  return {
    records: Array.from(result.values()),
    ids: Array.from(fileIds.values()),
  }
}

function buildFolderListPath(folder: FileRecord): string {
  const parent = normalizeListPath(folder.path)
  const folderName = folder.name.replace(/\/+$/g, '')
  if (!folderName) return parent
  if (parent === '/') {
    return `/${folderName}/`
  }
  return `${parent}${folderName}/`
}

function normalizeListPath(rawPath: string | null | undefined): string {
  if (!rawPath) return '/'
  const trimmed = rawPath.replace(/^\/+/, '').replace(/\/+$/, '')
  return trimmed ? `/${trimmed}/` : '/'
}

let previewRequestId = 0

async function refreshSelectionPreview() {
  if (!props.show) return
  if (selectedItems.value.length === 0) {
    expandedSelection.value = []
    expandedFileIds.value = []
    previewLoading.value = false
    return
  }

  const requestId = ++previewRequestId
  previewLoading.value = true
  try {
    const expanded = await expandSelectionRecords(selectedItems.value)
    if (requestId !== previewRequestId) return
    expandedSelection.value = expanded.records
    expandedFileIds.value = expanded.ids
  } catch (error: any) {
    if (requestId !== previewRequestId) return
    console.error(error)
    message.error(error?.message || t('shareModal.feedback.loadFailed'))
  } finally {
    if (requestId === previewRequestId) {
      previewLoading.value = false
    }
  }
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      resetForm()
      void refreshSelectionPreview()
    } else {
      previewRequestId++
      expandedSelection.value = []
      expandedFileIds.value = []
      previewLoading.value = false
    }
  }
)

watch(
  () => props.files,
  () => {
    if (props.show) {
      void refreshSelectionPreview()
    }
  },
  { deep: true }
)
</script>

<style scoped>
.section {
  margin-bottom: 16px;
}
.section-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.hint {
  color: #6b7280;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.mt-2 {
  margin-top: 8px;
}
.result-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 4px;
  word-break: break-all;
}
.result-row strong {
  font-weight: 600;
}
</style>
