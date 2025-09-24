<template>
  <div class="drive">
    <div class="toolbar">
      <div class="action-row primary">
        <n-button type="primary" round size="medium" @click="onNewFolder">
          {{ t('drive.toolbar.newFolder') }}
        </n-button>
        <n-button type="primary" tertiary round size="medium" @click="onUpload">
          {{ t('drive.toolbar.upload') }}
        </n-button>
        <n-button
          type="primary"
          tertiary
          round
          size="medium"
          @click="onShare"
          :disabled="selectedShareableCount === 0"
        >
          {{ t('drive.toolbar.share') }}
        </n-button>
      </div>
      <div class="action-row secondary">
        <n-button
          quaternary
          round
          size="medium"
          @click="onDownload"
          :disabled="selectedNonFolderCount === 0"
        >
          {{ t('drive.toolbar.download') }}
        </n-button>
        <n-button
          quaternary
          round
          size="medium"
          @click="openMoveDialog"
          :disabled="selected.length === 0"
        >
          {{ t('drive.toolbar.move') }}
        </n-button>
        <n-button
          quaternary
          round
          size="medium"
          @click="onRename"
          :disabled="selected.length !== 1"
        >
          {{ t('drive.toolbar.rename') }}
        </n-button>
        <n-button
          type="error"
          quaternary
          round
          size="medium"
          @click="onDelete"
          :disabled="selected.length === 0"
        >
          {{ t('drive.toolbar.delete') }}
        </n-button>
      </div>
    </div>

    <n-divider class="divider" />

    <DriveBreadcrumb
      :segments="breadcrumbSegments"
      :root-label="t('drive.breadcrumb.root')"
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

    <div v-if="uploadProgressItems.length" class="upload-progress-container">
      <UploadProgressList :items="uploadProgressItems" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDialog, useMessage, NInput } from 'naive-ui'
import DriveBreadcrumb from '@/components/drive/DriveBreadcrumb.vue'
import FilesTable from '@/components/drive/FilesTable.vue'
import CreateShareModal from '@/components/drop/CreateShareModal.vue'
import ShareSuccessBanner from '@/components/drop/ShareSuccessBanner.vue'
import MoveDialog from '@/components/drive/MoveDialog.vue'
import UploadProgressList, {
  type UploadProgressItem,
} from '@/components/upload/UploadProgressList.vue'
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
import { useI18n } from '@/composables/locale'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const { t } = useI18n()

const files = ref<FileRecord[]>([])
const loading = ref(false)
const selected = ref<FileRecord[]>([])
const shareSuccessInfo = ref<ShareInfoPayload | null>(null)
const shareModalVisible = ref(false)
const moveDialogVisible = ref(false)
const uploadProgressItems = ref<UploadProgressItem[]>([])

let clearProgressTimer: number | undefined

function clearProgressSchedule() {
  if (clearProgressTimer !== undefined) {
    window.clearTimeout(clearProgressTimer)
    clearProgressTimer = undefined
  }
}

function scheduleProgressClear(delay = 1800) {
  clearProgressSchedule()
  clearProgressTimer = window.setTimeout(() => {
    uploadProgressItems.value = []
    clearProgressTimer = undefined
  }, delay)
}

function initUploadProgress(filesToUpload: File[]) {
  clearProgressSchedule()
  const stamp = Date.now()
  uploadProgressItems.value = filesToUpload.map((file, index) => ({
    id: `${stamp}-${index}`,
    name: file.name,
    percent: 0,
    status: 'pending',
  }))
}

function updateUploadProgress(index: number, percent: number) {
  const entry = uploadProgressItems.value[index]
  if (!entry) return
  entry.percent = Math.min(100, Math.max(0, Math.round(percent)))
  if (entry.status === 'pending') entry.status = 'uploading'
  if (entry.percent >= 100) entry.status = 'success'
}

function markUploadSuccess() {
  uploadProgressItems.value.forEach((item) => {
    item.percent = 100
    item.status = 'success'
  })
  scheduleProgressClear()
}

function markUploadFailure() {
  clearProgressSchedule()
  if (uploadProgressItems.value.length === 0) return
  uploadProgressItems.value.forEach((item) => {
    if (item.percent < 100) {
      item.status = 'error'
    }
  })
}

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
    if (!url) throw new Error(t('common.feedback.downloadFailed'))
    triggerDownload(url, row.name)
  } catch (error) {
    console.error(error)
    message.error(t('common.feedback.downloadFailed'))
  }
}

async function deleteRow(row: FileRecord) {
  const ok = await confirmDialog(
    t('drive.dialogs.deleteSingle', { name: row.name }),
    t('drive.toolbar.delete')
  )
  if (!ok) return
  try {
    await deleteFile(row.id)
    message.success(t('common.feedback.deleteSuccess'))
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error(t('common.feedback.deleteFailed'))
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
    message.error(t('common.feedback.downloadFailed'))
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
    message.warning(t('common.feedback.selectOne'))
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
    message.success(t('common.feedback.moveSuccess'))
    moveDialogVisible.value = false
    selected.value = []
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error(t('common.feedback.moveFailed'))
  }
}

async function onDelete() {
  if (selected.value.length === 0) return
  const ok = await confirmDialog(
    t('drive.dialogs.deleteMultiple', { count: selected.value.length }),
    t('drive.toolbar.delete')
  )
  if (!ok) return
  try {
    const fileIds = selected.value.map((file) => file.id)
    await deleteFiles(fileIds)
    message.success(t('common.feedback.deleteSuccess'))
    selected.value = []
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error(t('common.feedback.deleteFailed'))
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

      initUploadProgress(filesToUpload as File[])

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
        onProgress: (_file, index, percent) => {
          updateUploadProgress(index, percent)
        },
      })

      markUploadSuccess()
      message.success(t('common.feedback.uploadSuccess'))
      await fetchFiles()
    } catch (error) {
      console.error(error)
      markUploadFailure()
      message.error(t('common.feedback.uploadFailed'))
    }
  }
  input.click()
}

async function onNewFolder() {
  const value = await promptDialog(
    t('drive.dialogs.newFolderTitle'),
    t('drive.dialogs.newFolderLabel'),
    t('drive.dialogs.newFolderPlaceholder')
  )
  if (!value) return
  try {
    let path = currentPath.value
    if (!path) path = '/'
    else if (!path.startsWith('/')) path = '/' + path
    if (!path.endsWith('/')) path = path + '/'
    await createFolder(path, String(value))
    message.success(t('common.feedback.folderCreated'))
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error(t('common.feedback.folderCreateFailed'))
  }
}

async function onRename() {
  if (selected.value.length !== 1) return
  const target = selected.value[0]
  const value = await promptDialog(
    t('drive.dialogs.renameTitle'),
    t('drive.dialogs.renameLabel'),
    target.name
  )
  if (!value) return
  try {
    await updateFile(target.id, { name: String(value) })
    message.success(t('common.feedback.renameSuccess'))
    selected.value = []
    await fetchFiles()
  } catch (error) {
    console.error(error)
    message.error(t('common.feedback.renameFailed'))
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
      positiveText: t('common.actions.confirm'),
      negativeText: t('common.actions.cancel'),
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

function confirmDialog(
  content: string,
  title = t('common.actions.confirm')
): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false
    dialog.warning({
      title,
      content,
      positiveText: t('common.actions.confirm'),
      negativeText: t('common.actions.cancel'),
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

onBeforeUnmount(() => {
  clearProgressSchedule()
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
  gap: 20px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-card-bg);
  box-shadow: 0 12px 40px rgba(17, 17, 17, 0.06);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-row.primary {
  justify-content: flex-start;
}

.action-row.secondary {
  justify-content: flex-start;
}

.divider {
  margin: 0;
}

.file-table :deep(.n-data-table-td) {
  white-space: nowrap;
}
.upload-progress-container {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
}
</style>
