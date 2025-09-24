<template>
  <div class="drive">
    <div class="toolbar">
      <n-space wrap>
        <n-button tertiary type="primary" @click="onNewFolder">New Folder</n-button>
        <n-button tertiary type="success" @click="onUpload">Upload</n-button>
        <n-button
          tertiary
          type="primary"
          @click="onDownload"
          :disabled="selectedNonFolderCount === 0"
        >
          Download
        </n-button>
        <n-button
          tertiary
          type="primary"
          @click="onShare"
          :disabled="selectedShareableCount === 0"
        >
          Share
        </n-button>
        <n-button
          tertiary
          type="primary"
          @click="openMoveDialog"
          :disabled="selected.length === 0"
        >
          Move
        </n-button>
        <n-button
          tertiary
          type="primary"
          @click="onRename"
          :disabled="selected.length !== 1"
        >
          Rename
        </n-button>
        <n-button
          tertiary
          type="error"
          @click="onDelete"
          :disabled="selected.length === 0"
        >
          Delete
        </n-button>
      </n-space>
    </div>

    <n-divider class="divider" />

    <DriveBreadcrumb
      :segments="breadcrumbSegments"
      root-label="Drive"
      @navigate-root="goRoot"
      @navigate-to="goTo"
    />

    <ShareSuccessBanner
      v-if="shareSuccessInfo"
      :info="shareSuccessInfo"
      @close="handleShareBannerClose"
    />

    <FilesTable
      :files="files"
      :loading="loading"
      @open="openRow"
      @download="downloadRow"
      @delete="deleteRow"
      @selection-change="onSelectionChange"
    />

    <CreateShareModal
      v-model:show="shareModalVisible"
      :files="selected"
      @created="onShareCreated"
    />

    <MoveDialog
      v-model:show="moveDialogVisible"
      :start-path="currentPath"
      @confirm="handleMoveConfirm"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDialog, useMessage, NInput } from 'naive-ui'
import DriveBreadcrumb from '@/components/drive/DriveBreadcrumb.vue'
import FilesTable from '@/components/drive/FilesTable.vue'
import CreateShareModal from '@/components/drop/CreateShareModal.vue'
import ShareSuccessBanner from '@/components/drop/ShareSuccessBanner.vue'
import MoveDialog from '@/components/drive/MoveDialog.vue'
import type { FileRecord } from '@/api/files/type'
import {
  createFolder,
  deleteFile,
  deleteFiles,
  downloadFile,
  getOSSPolicy,
  listFilesByPath,
  moveFiles,
  updateFile,
} from '@/api/files/api'
import { uploadAndNotify } from '@/utils/fileUtils'
import { takeShareInfo, type ShareInfoPayload } from '@/utils/shareStorage'
import { md5 } from '@/utils/crypto/md5'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const dialog = useDialog()

const files = ref<FileRecord[]>([])
const loading = ref(false)
const selected = ref<FileRecord[]>([])
const shareSuccessInfo = ref<ShareInfoPayload | null>(null)
const shareModalVisible = ref(false)
const moveDialogVisible = ref(false)

const currentPath = computed(() => {
  const match = route.params.pathMatch
  if (!match) return ''
  return Array.isArray(match) ? match.join('/') : String(match)
})

const breadcrumbSegments = computed(() =>
  currentPath.value ? currentPath.value.split('/').filter(Boolean) : []
)

const selectedNonFolderCount = computed(
  () => selected.value.filter((item) => item.content_type !== 'folder').length
)

const selectedShareableCount = computed(() => selected.value.length)

async function fetchFiles() {
  loading.value = true
  try {
    const apiPath = buildListPath(currentPath.value)
    const resp = await listFilesByPath(apiPath)
    files.value = Array.isArray((resp as any)?.files) ? (resp as any).files : []
    selected.value = []
  } catch (error) {
    console.error(error)
    files.value = []
  } finally {
    loading.value = false
  }
}

function buildListPath(path: string): string {
  if (!path) return '/'
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return `/${trimmed}/`
}

function buildNotifyPath(path: string): string {
  if (!path) return '/'
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return `/${trimmed}/`
}

function buildUpdatePath(path: string): string {
  if (!path || path === '/') return '/'
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return `/${trimmed}/`
}

function goRoot() {
  router.push({ name: 'Drive' })
}

function goTo(idx: number) {
  const path = breadcrumbSegments.value.slice(0, idx + 1).join('/')
  router.push({ name: 'DrivePath', params: { pathMatch: path } })
}

function openRow(row: FileRecord) {
  if ((row as any).is_dir || row.content_type === 'folder') {
    const next = currentPath.value ? `${currentPath.value}/${row.name}` : row.name
    router.push({ name: 'DrivePath', params: { pathMatch: next } })
  }
}

async function downloadRow(row: FileRecord) {
  if (row.content_type === 'folder') return
  try {
    const data = await downloadFile(row.id)
    const url = (data as any)?.download_url || row.oss_url
    if (!url) throw new Error('No download url')
    triggerDownload(url, row.name)
  } catch (error) {
    console.error(error)
    message.error('Download failed')
  }
}

async function deleteRow(row: FileRecord) {
  const ok = await confirmDialog(`Delete "${row.name}"?`, 'Delete')
  if (!ok) return
  try {
    await deleteFile(row.id)
    message.success('Deleted successfully')
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error('Delete failed')
  }
}

function onSelectionChange(rows: FileRecord[]) {
  selected.value = rows
}

async function onDownload() {
  const targets = selected.value.filter((item) => item.content_type !== 'folder')
  if (targets.length === 0) return
  try {
    const results = await Promise.all(
      targets.map(async (file) => {
        const data = await downloadFile(file.id)
        const url = (data as any)?.download_url || file.oss_url
        return { url, name: file.name }
      })
    )
    results.forEach((item) => {
      if (item.url) triggerDownload(item.url, item.name)
    })
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

function onShare() {
  if (selectedShareableCount.value === 0) {
    message.warning('Select at least one item to share')
    return
  }
  shareModalVisible.value = true
}

function onShareCreated() {
  shareModalVisible.value = false
}

function handleShareBannerClose() {
  shareSuccessInfo.value = null
}

function openMoveDialog() {
  if (selected.value.length === 0) return
  moveDialogVisible.value = true
}

async function handleMoveConfirm(dest: string) {
  if (selected.value.length === 0) return
  const normalized = buildUpdatePath(dest)
  try {
    const fileIds = selected.value.map((file) => file.id)
    await moveFiles(fileIds, normalized)
    message.success('Moved successfully')
    moveDialogVisible.value = false
    selected.value = []
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error('Move failed')
  }
}

async function onDelete() {
  if (selected.value.length === 0) return
  const ok = await confirmDialog(`Delete ${selected.value.length} item(s)?`, 'Delete')
  if (!ok) return
  try {
    const fileIds = selected.value.map((file) => file.id)
    await deleteFiles(fileIds)
    message.success('Deleted successfully')
    selected.value = []
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error('Delete failed')
  }
}

async function onUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '*/*'
  input.onchange = async () => {
    const filesToUpload = Array.from(input.files || [])
    if (filesToUpload.length === 0) return
    try {
      const policy = await getOSSPolicy()

      const notifyPath = buildNotifyPath(currentPath.value)

      await uploadAndNotify(filesToUpload as File[], policy.token, {
        keyResolver: (file) => {
          const name = file.name
          const dotIndex = name.lastIndexOf('.')
          const ext = dotIndex >= 0 ? name.slice(dotIndex) : ''
          const rand = Math.random().toString(36).slice(2, 10)
          const stamp = Date.now().toString()
          const base = md5(`${name}-${stamp}-${rand}`)
          const prefix = (policy.token?.prefix || '').replace(/\/+$/, '')
          return prefix ? `${prefix}/${base}${ext}` : `${base}${ext}`
        },
        notifyPath,
      })

      message.success('Uploaded successfully')
      await fetchFiles()
    } catch (error) {
      console.error(error)
      message.error('Upload failed')
    }
  }
  input.click()
}

async function onNewFolder() {
  const value = await promptDialog('New Folder', 'Folder name', 'New folder')
  if (!value) return
  try {
    let path = currentPath.value
    if (!path) path = '/'
    else if (!path.startsWith('/')) path = '/' + path
    if (!path.endsWith('/')) path = path + '/'
    await createFolder(path, String(value))
    message.success('Folder created')
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error('Create folder failed')
  }
}

async function onRename() {
  if (selected.value.length !== 1) return
  const target = selected.value[0]
  const value = await promptDialog('Rename', 'New name', target.name)
  if (!value) return
  try {
    await updateFile(target.id, { name: String(value) })
    message.success('Renamed successfully')
    selected.value = []
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error('Rename failed')
  }
}

function promptDialog(title: string, label: string, placeholder = ''): Promise<string | null> {
  return new Promise((resolve) => {
    const inputVal = ref('')
    let resolved = false
    dialog.create({
      title,
      content: () =>
        h('div', { style: 'margin-top: 8px;' }, [
          h('div', { style: 'margin-bottom: 8px;' }, label),
          h(NInput, {
            value: inputVal.value,
            placeholder,
            'onUpdate:value': (v: string) => (inputVal.value = v),
            size: 'medium',
          }),
        ]),
      positiveText: 'Confirm',
      negativeText: 'Cancel',
      onPositiveClick: () => {
        resolved = true
        resolve(inputVal.value.trim() || null)
      },
      onNegativeClick: () => {
        resolved = true
        resolve(null)
      },
      onClose: () => {
        if (!resolved) resolve(null)
      },
    })
  })
}

function confirmDialog(content: string, title = 'Confirm'): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false
    dialog.warning({
      title,
      content,
      positiveText: 'Confirm',
      negativeText: 'Cancel',
      onPositiveClick: () => {
        resolved = true
        resolve(true)
      },
      onNegativeClick: () => {
        resolved = true
        resolve(false)
      },
      onClose: () => {
        if (!resolved) resolve(false)
      },
    })
  })
}

onMounted(() => {
  const info = takeShareInfo()
  if (info) {
    shareSuccessInfo.value = info
  }
  fetchFiles()
})

watch(
  () => route.fullPath,
  () => {
    fetchFiles()
  }
)
</script>

<style scoped>
.drive {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar {
  display: flex;
  justify-content: flex-end;
}
.divider {
  margin: 0;
}
.file-table :deep(.n-data-table-td) {
  white-space: nowrap;
}
</style>
