<template>
  <div class="share-page">
    <n-card class="share-card" :bordered="false">
      <template #header>
        <h2>{{ t('sharePage.title') }}</h2>
      </template>

      <n-space vertical size="large">
        <n-alert v-if="errorMessage" type="error" :bordered="false">
          {{ errorMessage }}
        </n-alert>

        <n-form
          ref="formRef"
          label-placement="top"
          :model="formModel"
          :rules="formRules"
          @submit.prevent="handleSubmit"
        >
          <n-form-item :label="t('sharePage.codeLabel')" path="code">
            <n-input
              v-model:value="formModel.code"
              :placeholder="t('common.placeholder.shareCode')"
              clearable
              :maxlength="10"
              show-count
            />
          </n-form-item>

          <n-form-item :label="t('sharePage.passwordLabel')" path="password">
            <n-input
              v-model:value="formModel.password"
              type="password"
              :placeholder="t('common.placeholder.password')"
              clearable
            />
          </n-form-item>

          <n-form-item>
            <n-button
              type="primary"
              :loading="loading"
              block
              round
              size="large"
              @click="handleSubmit"
            >
              {{ t('sharePage.submit') }}
            </n-button>
          </n-form-item>
        </n-form>

        <n-spin :show="loading">
          <div v-if="drop">
            <n-alert type="info" :bordered="false" class="share-info">
              <div class="info-row">
                <span class="label">{{ t('sharePage.codeLabel') }}</span>
                <span class="value">{{ drop.code }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ t('common.labels.expires') }}</span>
                <span class="value">{{ expireDisplay }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ t('common.labels.downloads') }}</span>
                <span class="value">
                  {{ drop.download_count }} / {{ drop.max_download_count }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">{{ t('sharePage.loginRequiredLabel') }}</span>
                <span class="value">
                  {{ drop.require_login ? t('sharePage.yes') : t('sharePage.no') }}
                </span>
              </div>
            </n-alert>

            <div v-if="files.length > 0">
              <div class="share-toolbar" v-if="isLoggedIn">
                <n-button
                  type="primary"
                  tertiary
                  round
                  size="medium"
                  :loading="savingAll"
                  :disabled="savingAll"
                  @click="saveEntireShare"
                >
                  {{ t('sharePage.saveShare') }}
                </n-button>
              </div>

              <div v-if="shareTree.length > 0" class="share-tree">
                <div class="section-title">{{ t('sharePage.treeTitle') }}</div>
                <n-tree
                  :key="drop?.id || drop?.code || 'share-tree'"
                  :data="shareTreeData"
                  :block-line="true"
                  :show-line="true"
                  :selectable="true"
                  :default-expanded-keys="shareTreeExpandedKeys"
                  :selected-keys="treeSelectedKeys"
                  @update:selected-keys="handleTreeSelect"
                />
              </div>

              <div class="current-path">
                {{ t('sharePage.currentPath', { path: currentFolderPath }) }}
              </div>

              <n-data-table
                :data="currentEntries"
                :columns="columns"
                :single-line="false"
                :row-key="rowKey"
                :row-props="rowProps"
                class="files-table"
              />
            </div>
            <div v-else>
              <n-empty :description="t('sharePage.noFiles')" />
            </div>
          </div>
          <div v-else-if="!loading">
            <n-empty :description="t('sharePage.empty')" />
          </div>
        </n-spin>
      </n-space>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, reactive, ref, watch } from 'vue'
import { useMessage, NButton, NSpace, type FormInst, type FormRules } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { FileDownloadPayload, FileRecord } from '@/api/files/type'
import type { DropDetailResponse, DropRecord } from '@/api/drop/type'
import { getDrop } from '@/api/drop/api'
import { downloadFile, notifyFileUploaded } from '@/api/files/api'
import { getTokenCookies } from '@/utils/userUtils'
import { buildShareTree, collectTreeKeys, type ShareTreeOption } from '@/utils/shareTree'
import { mapShareAccessError } from '@/utils/shareErrors'
import { useI18n } from '@/composables/locale'

const message = useMessage()
const { t } = useI18n()
const formRef = ref<FormInst | null>(null)

interface FormModel {
  code: string
  password: string
}

const formModel = reactive<FormModel>({
  code: '',
  password: '',
})

const formRules = computed<FormRules>(() => ({
  code: {
    required: true,
    message: t('shareModal.feedback.codeRequired'),
    trigger: ['blur', 'input'],
  },
}))

const drop = ref<DropRecord | null>(null)
const files = ref<FileRecord[]>([])
const loading = ref(false)
const savingAll = ref(false)
const errorMessage = ref('')
const lastAccessPayload = ref<FileDownloadPayload | null>(null)
const isLoggedIn = computed(() => {
  const { access, refresh } = getTokenCookies()
  return !!(access && refresh)
})

const shareTree = computed<ShareTreeOption[]>(() => buildShareTree(files.value))
const shareTreeData = computed<ShareTreeOption[]>(() => [
  {
    key: '__root__',
    label: '/',
    type: 'folder',
    children: shareTree.value,
  },
])
const shareTreeExpandedKeys = computed(() => ['__root__', ...collectTreeKeys(shareTree.value)])
const currentTreeKey = ref('__root__')
const treeSelectedKeys = computed(() => [currentTreeKey.value])

interface ShareEntry {
  key: string
  type: 'folder' | 'file'
  name: string
  record?: FileRecord
}

const currentTreeNode = computed(() =>
  findTreeNode(shareTreeData.value, currentTreeKey.value)
)

const currentEntries = computed<ShareEntry[]>(() => {
  const node = currentTreeNode.value
  if (!node?.children) return []
  const children = node.children as ShareTreeOption[]
  return children.map((child) => ({
    key: String(child.key),
    type: child.type as ShareEntry['type'],
    name: String(child.label ?? ''),
    record: child.record as FileRecord | undefined,
  }))
})

const currentFolderPath = computed(() => {
  if (currentTreeKey.value === '__root__') return '/'
  const key = currentTreeKey.value
  if (key.startsWith('dir-')) {
    const path = key.slice(4)
    return path ? path : '/'
  }
  return '/'
})

const columns = computed<DataTableColumns<ShareEntry>>(() => [
  { title: t('filesTable.columns.name'), key: 'name', minWidth: 260 },
  {
    title: t('filesTable.columns.contentType'),
    key: 'type',
    width: 140,
    render: (row) =>
      row.type === 'folder'
        ? t('sharePage.typeFolder')
        : row.record?.content_type || '-',
  },
  {
    title: t('filesTable.columns.size'),
    key: 'size',
    width: 140,
    render: (row) => (row.type === 'folder' ? '-' : formatSize(row.record?.size ?? 0)),
  },
  {
    title: t('filesTable.columns.actions'),
    key: 'actions',
    width: 220,
    render: (row) =>
      row.type === 'file'
        ? h(NSpace, { size: 'small' }, {
            default: () => [
              h(
                NButton,
                {
                  text: true,
                  type: 'default',
                  onClick: () => row.record && downloadShared(row.record),
                },
                { default: () => t('common.actions.download') }
              ),
              ...(isLoggedIn.value
                ? [
                    h(
                      NButton,
                      {
                        text: true,
                        type: 'default',
                        onClick: () => row.record && saveToMy(row.record),
                      },
                      { default: () => t('sharePage.saveSingle') }
                    ),
                  ]
                : []),
            ],
          })
        : null,
  },
])

const rowKey = (row: ShareEntry) => row.key

const rowProps = (row: ShareEntry) => ({
  onClick: () => {
    if (row.type === 'folder') openFolder(row.key)
  },
  onDblclick: () => {
    if (row.type === 'folder') openFolder(row.key)
  },
})

const expireDisplay = computed(() => {
  if (!drop.value) return '-'
  if (!drop.value.expire_time) return t('common.status.noEntries')
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(drop.value.expire_time))
  } catch {
    return drop.value.expire_time
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    await loadShare()
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

async function loadShare() {
  if (!formModel.code.trim()) {
    message.warning(t('shareModal.feedback.codeRequired'))
    return
  }

  loading.value = true
  errorMessage.value = ''
  drop.value = null
  files.value = []
  currentTreeKey.value = '__root__'
  lastAccessPayload.value = null

  try {
    const payload: { code: string; password?: string } = {
      code: formModel.code.trim()
    }
    if (formModel.password.trim()) {
      payload.password = formModel.password.trim()
    }

    const resp = await getDrop(payload)
    lastAccessPayload.value = {
      code: payload.code,
      ...(payload.password ? { password: payload.password } : {}),
    }
    handleResponse(resp)
    message.success(t('common.feedback.loadSharedSuccess'))
  } catch (error: any) {
    console.error(error)
    const msg = mapShareAccessError(error, t)
    errorMessage.value = msg
    message.error(msg)
  } finally {
    loading.value = false
  }
}

function handleResponse(resp: DropDetailResponse) {
  drop.value = resp.drop
  files.value = Array.isArray(resp.files) ? resp.files : []
  currentTreeKey.value = '__root__'
}

function handleTreeSelect(keys: Array<string | number>) {
  if (!keys || keys.length === 0) return
  const nextKey = String(keys[0])
  const node = findTreeNode(shareTreeData.value, nextKey)
  if (node?.type === 'folder') {
    currentTreeKey.value = nextKey
  }
}

watch(
  () => shareTreeData.value,
  () => {
    if (!findTreeNode(shareTreeData.value, currentTreeKey.value)) {
      currentTreeKey.value = '__root__'
    }
  },
  { deep: true }
)

function openFolder(key: string) {
  handleTreeSelect([key])
}

async function downloadShared(file: FileRecord) {
  if (!file) return
  const { access } = getTokenCookies()
  const requireLogin = normalizeRequireLogin(drop.value?.require_login)
  if (requireLogin && !access) {
    message.error(t('common.feedback.requireLoginDownload'))
    return
  }

  try {
    const downloadPayload: FileDownloadPayload = {}
    const codeSource =
      lastAccessPayload.value?.code ?? drop.value?.code ?? formModel.code
    const normalizedCode =
      typeof codeSource === 'string' ? codeSource.trim() : ''
    if (normalizedCode) downloadPayload.code = normalizedCode
    const passwordSource =
      lastAccessPayload.value?.password ?? formModel.password
    const normalizedPassword =
      typeof passwordSource === 'string' ? passwordSource.trim() : ''
    if (normalizedPassword) downloadPayload.password = normalizedPassword

    const { download_url } = await downloadFile(file.id, downloadPayload)
    if (!download_url) throw new Error(t('common.feedback.downloadFailed'))

    triggerDownload(download_url, file.name)
  } catch (error) {
    console.error(error)
    message.error(t('common.feedback.downloadFailed'))
  }
}

function normalizeRequireLogin(
  flag: DropRecord['require_login'] | string | number | null | undefined
): boolean {
  if (flag === null || flag === undefined) return false
  if (typeof flag === 'boolean') return flag
  if (typeof flag === 'number') return flag !== 0
  if (typeof flag === 'string') {
    const normalized = (flag as string).trim().toLowerCase()
    if (!normalized) return false
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    return true
  }
  return true
}

async function saveToMy(file: FileRecord) {
  if (!file) return
  if (!isLoggedIn.value) {
    message.warning(t('common.feedback.requireLoginSave'))
    return
  }

  try {
    const payload = {
      name: file.name,
      content_type: file.content_type,
      size: file.size,
      oss_url: file.oss_url,
      path: normalizeNotifyPath(file.path),
    }

    await notifyFileUploaded(payload)
    message.success(t('common.feedback.saved', { name: file.name }))
  } catch (error: any) {
    console.error(error)
    const msg =
      error?.response?.data?.message || error?.message || t('common.feedback.saveFailed')
    message.error(msg)
  }
}

async function saveEntireShare() {
  if (!drop.value) return
  if (!isLoggedIn.value) {
    message.warning(t('common.feedback.requireLoginSave'))
    return
  }

  const targets = files.value.filter((item) => item.content_type !== 'folder')
  if (targets.length === 0) {
    message.warning(t('common.feedback.noFilesToSave'))
    return
  }

  savingAll.value = true
  try {
    const payloads = targets.map((file) => ({
      name: file.name,
      content_type: file.content_type,
      size: file.size,
      oss_url: file.oss_url,
      path: normalizeNotifyPath(file.path),
    }))

    for (const payload of payloads) {
      await notifyFileUploaded(payload)
    }
    message.success(t('common.feedback.savedAll'))
  } catch (error: any) {
    console.error(error)
    const msg =
      error?.response?.data?.message || error?.message || t('common.feedback.saveAllFailed')
    message.error(msg)
  } finally {
    savingAll.value = false
  }
}

function triggerDownload(url: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename || ''
  anchor.rel = 'noopener'
  anchor.target = '_blank'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

function normalizeNotifyPath(rawPath: string | null | undefined): string {
  if (!rawPath) return '/'
  const trimmed = rawPath.replace(/^\/+/, '').replace(/\/+$/, '')
  return trimmed ? `/${trimmed}/` : '/'
}

function findTreeNode(nodes: ShareTreeOption[], key: string): ShareTreeOption | null {
  for (const node of nodes) {
    if (String(node.key) === key) return node
    if (node.children && node.children.length > 0) {
      const found = findTreeNode(node.children as ShareTreeOption[], key)
      if (found) return found
    }
  }
  return null
}

function formatSize(size: number) {
  if (!Number.isFinite(size)) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`
}
</script>

<style scoped>
.share-page {
  padding: 24px;
  width: min(60%, 1040px);
  margin: 0 auto;
}

.share-card {
  border-radius: 24px;
  border: 1px solid var(--border-color-subtle);
  box-shadow: 0 24px 80px rgba(17, 17, 17, 0.08);
}

.share-info {
  margin-bottom: 16px;
}

.share-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.share-tree {
  margin-bottom: 16px;
}

.share-tree :deep(.n-tree-node-content) {
  cursor: pointer;
}

.current-path {
  margin-bottom: 12px;
  font-weight: 500;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: rgb(var(--color-text-primary));
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.label {
  font-weight: 500;
  color: rgb(var(--color-text-secondary));
}

.value {
  font-weight: 600;
  color: rgb(var(--color-text-primary));
}

.files-table {
  margin-top: 16px;
}

@media (max-width: 960px) {
  .share-page {
    width: 100%;
  }
}
</style>
