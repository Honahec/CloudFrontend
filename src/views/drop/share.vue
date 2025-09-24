<template>
  <div class="share-page">
    <n-card class="share-card" :bordered="false">
      <template #header>
        <div class="header">
          <h2>Shared Files</h2>
          <span class="code">Code: {{ code }}</span>
        </div>
      </template>

      <n-space vertical size="large">
        <n-alert v-if="errorMessage" type="error" :bordered="false">
          {{ errorMessage }}
        </n-alert>

        <n-form label-placement="top" @submit.prevent="loadShare">
          <div class="form-grid">
            <n-form-item label="Access Password (if required)">
              <n-input v-model:value="password" type="password" placeholder="Enter password" clearable />
            </n-form-item>
            <div class="form-actions">
              <n-button type="primary" :loading="loading" @click="loadShare">Load Files</n-button>
            </div>
          </div>
        </n-form>

        <n-spin :show="loading">
          <div v-if="drop">
            <n-alert type="info" :bordered="false" class="meta">
              <div>Expires: {{ expireDisplay }}</div>
              <div>
                Downloads: {{ drop.download_count }} / {{ drop.max_download_count }}
              </div>
              <div v-if="drop.require_login">Login required to download.</div>
            </n-alert>

            <div v-if="files.length > 0">
              <div class="share-toolbar" v-if="isLoggedIn">
                <n-button
                  type="success"
                  :loading="savingAll"
                  :disabled="savingAll"
                  @click="saveEntireShare"
                >
                  Save All to My Drive
                </n-button>
              </div>

              <div v-if="shareTree.length > 0" class="share-tree">
                <div class="section-title">Folder Structure</div>
                <n-tree
                  :key="drop.id || drop.code"
                  :data="shareTreeData"
                  :block-line="true"
                  :show-line="true"
                  :selectable="true"
                  :default-expanded-keys="shareTreeExpandedKeys"
                  :selected-keys="treeSelectedKeys"
                  @update:selected-keys="handleTreeSelect"
                />
              </div>

              <div class="current-path">Current Path: {{ currentFolderPath }}</div>

              <n-data-table
                :data="currentEntries"
                :columns="columns"
                :single-line="false"
                :row-key="rowKey"
                :row-props="rowProps"
              />
            </div>
            <div v-else>
              <n-empty description="No files available" />
            </div>
          </div>
          <n-empty v-else description="Enter password if needed and click Load Files" />
        </n-spin>
      </n-space>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage, NButton, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { FileRecord } from '@/api/files/type'
import type { DropDetailResponse, DropRecord } from '@/api/drop/type'
import { getDrop } from '@/api/drop/api'
import { downloadFile, notifyFilesUploaded } from '@/api/files/api'
import { getTokenCookies } from '@/utils/userUtils'
import { buildShareTree, collectTreeKeys, type ShareTreeOption } from '@/utils/shareTree'

const route = useRoute()
const message = useMessage()

const code = computed(() => String(route.params.code || ''))
const password = ref('')
const drop = ref<DropRecord | null>(null)
const files = ref<FileRecord[]>([])
const loading = ref(false)
const savingAll = ref(false)
const errorMessage = ref('')

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

const currentTreeNode = computed(() => findTreeNode(shareTreeData.value, currentTreeKey.value))

const currentEntries = computed<ShareEntry[]>(() => {
  const node = currentTreeNode.value
  if (!node?.children) return []
  return node.children.map((child) => ({
    key: String(child.key),
    type: child.type as ShareEntry['type'],
    name: String(child.label ?? ''),
    record: child.record,
  }))
})

const currentFolderPath = computed(() => {
  if (currentTreeKey.value === '__root__') return '/'
  const key = currentTreeKey.value
  if (key.startsWith('dir-')) {
    return key.slice(4) || '/'
  }
  return '/'
})

const isLoggedIn = computed(() => {
  const { access, refresh } = getTokenCookies()
  return !!(access && refresh)
})

const columns = computed<DataTableColumns<ShareEntry>>(() => [
  { title: 'Name', key: 'name', minWidth: 260 },
  {
    title: 'Type',
    key: 'type',
    width: 120,
    render: (row) => (row.type === 'folder' ? 'Folder' : row.record?.content_type || '-'),
  },
  {
    title: 'Size',
    key: 'size',
    width: 140,
    render: (row) => (row.type === 'folder' ? '-' : formatSize(row.record?.size ?? 0)),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 200,
    render: (row) =>
      row.type === 'file'
        ? h(NSpace, { size: 'small' }, {
            default: () => [
              h(
                NButton,
                {
                  text: true,
                  type: 'primary',
                  onClick: () => row.record && downloadShared(row.record),
                },
                { default: () => 'Download' }
              ),
              ...(isLoggedIn.value
                ? [
                    h(
                      NButton,
                      {
                        text: true,
                        type: 'success',
                        onClick: () => row.record && saveToMy(row.record),
                      },
                      { default: () => 'Save to My Files' }
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
  if (!drop.value.expire_time) return 'No expiration information'
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

async function loadShare() {
  if (!code.value) {
    errorMessage.value = 'Invalid share code'
    return
  }
  loading.value = true
  errorMessage.value = ''
  drop.value = null
  files.value = []
  currentTreeKey.value = '__root__'
  try {
    const payload: { code: string; password?: string } = { code: code.value }
    if (password.value) payload.password = password.value
    const resp = await getDrop(payload)
    handleResponse(resp)
  } catch (error: any) {
    console.error(error)
    const msg = error?.response?.data?.message || error?.message || 'Failed to load shared files'
    errorMessage.value = msg
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
  try {
    let url = file.oss_url
    const { access } = getTokenCookies()
    if (access) {
      const data = await downloadFile(file.id)
      url = (data as any)?.download_url || url
    }
    if (!url) throw new Error('No download url')
    triggerDownload(url, file.name)
  } catch (error) {
    console.error(error)
    message.error('Download failed')
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

async function saveToMy(file: FileRecord) {
  if (!file) return
  if (!isLoggedIn.value) {
    message.warning('Please log in to save files')
    return
  }

  try {
    const notifyItems = [{
      name: file.name,
      content_type: file.content_type,
      size: file.size,
      oss_url: file.oss_url,
      path: normalizeNotifyPath(file.path),
    }]

    await notifyFilesUploaded(notifyItems)
    message.success(`${file.name} has been saved to your files`)
  } catch (error: any) {
    console.error(error)
    const msg = error?.response?.data?.message || error?.message || 'Failed to save file'
    message.error(msg)
  }
}

async function saveEntireShare() {
  if (!drop.value) return
  if (!isLoggedIn.value) {
    message.warning('Please log in to save files')
    return
  }

  const targets = files.value.filter((item) => item.content_type !== 'folder')
  if (targets.length === 0) {
    message.warning('No files available to save')
    return
  }

  savingAll.value = true
  try {
    const notifyItems = targets.map((file) => ({
      name: file.name,
      content_type: file.content_type,
      size: file.size,
      oss_url: file.oss_url,
      path: normalizeNotifyPath(file.path),
    }))

    await notifyFilesUploaded(notifyItems)
    message.success('Shared files saved to your drive')
  } catch (error: any) {
    console.error(error)
    const msg = error?.response?.data?.message || error?.message || 'Failed to save shared files'
    message.error(msg)
  } finally {
    savingAll.value = false
  }
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

onMounted(() => {
  if (code.value) loadShare()
})
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e2f5ec 100%);
  box-sizing: border-box;
}
.share-card {
  width: min(720px, 100%);
  box-shadow: 0 20px 45px rgba(58, 109, 75, 0.18);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.header h2 {
  margin: 0;
}
.code {
  font-size: 14px;
  color: #16a34a;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
}
.form-actions {
  display: flex;
  align-items: flex-end;
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.share-tree :deep(.n-tree-node-content) {
  cursor: pointer;
}

.share-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.share-tree {
  margin-bottom: 16px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.current-path {
  margin-bottom: 12px;
  font-weight: 500;
}
</style>
