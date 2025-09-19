<template>
  <div class="drive">
    <div class="toolbar">
      <n-space wrap>
        <n-button tertiary type="primary" @click="onNewFolder"
          >New Folder</n-button
        >
        <n-button tertiary type="success" @click="onUpload">Upload</n-button>
        <n-button
          tertiary
          type="primary"
          @click="onDownload"
          :disabled="selectedNonFolderCount === 0"
          >Download</n-button
        >
        <n-button
          tertiary
          type="primary"
          @click="onMove"
          :disabled="selected.length === 0"
          >Move</n-button
        >
        <n-button
          tertiary
          type="primary"
          @click="onRename"
          :disabled="selected.length !== 1"
          >Rename</n-button
        >
        <n-button
          tertiary
          type="error"
          @click="onDelete"
          :disabled="selected.length === 0"
          >Delete</n-button
        >
      </n-space>
    </div>

    <n-divider class="divider" />

    <DriveBreadcrumb
      :segments="segments"
      @navigate-root="goRoot"
      @navigate-to="goTo"
    />

    <FilesTable
      :files="files"
      :loading="loading"
      @open="openRow"
      @download="downloadRow"
      @delete="deleteRow"
      @selection-change="onSelectionChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  listFilesByPath,
  deleteFile,
  updateFile,
  createFolder,
  getOSSPolicy,
  downloadFile,
} from '@/api/files/api'
import type { FileRecord } from '@/api/files/type'
import DriveBreadcrumb from '@/components/drive/DriveBreadcrumb.vue'
import FilesTable from '@/components/drive/FilesTable.vue'
import { useMessage, useDialog, NInput } from 'naive-ui'
import { uploadAndNotify } from '@/utils/fileUtils'
import { md5 } from '@/utils/crypto/md5'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const dialog = useDialog()

const currentPath = computed(() => {
  const m = route.params.pathMatch
  if (!m) return ''
  return Array.isArray(m) ? m.join('/') : String(m)
})

const segments = computed(() =>
  currentPath.value ? currentPath.value.split('/') : []
)

const files = ref<FileRecord[]>([])
const loading = ref(false)
const selected = ref<FileRecord[]>([])
const selectedNonFolderCount = computed(
  () => selected.value.filter((r) => r.content_type !== 'folder').length
)

async function fetchFiles() {
  loading.value = true
  try {
    let path = currentPath.value
    if (!path) path = '/'
    else if (!path.endsWith('/')) path = path + '/'
    const req = listFilesByPath(path)
    const data = await req.send()
    files.value = Array.isArray((data as any)?.files) ? (data as any).files : []
  } catch (e) {
    console.error(e)
    files.value = []
  } finally {
    loading.value = false
  }
}

function goRoot() {
  router.push({ name: 'Drive' })
}
function goTo(idx: number) {
  const path = segments.value.slice(0, idx + 1).join('/')
  router.push({ name: 'DrivePath', params: { pathMatch: path } })
}

function openRow(row: FileRecord) {
  if ((row as any).is_dir || row.content_type === 'folder') {
    const next = currentPath.value
      ? `${currentPath.value}/${row.name}`
      : row.name
    router.push({ name: 'DrivePath', params: { pathMatch: next } })
  }
}

async function downloadRow(row: FileRecord) {
  if (row.content_type === 'folder') return
  try {
    const data = await downloadFile(row.id).send()
    const url = (data as any)?.download_url || row.oss_url
    if (!url) throw new Error('No download url')
    triggerDownload(url, row.name)
  } catch (e) {
    console.error(e)
    message.error('Download failed')
  }
}
async function deleteRow(row: FileRecord) {
  const ok = await confirmDialog(`Delete "${row.name}"?`, 'Delete')
  if (!ok) return
  try {
    await deleteFile(row.id).send()
    message.success('Deleted successfully')
    await fetchFiles()
  } catch (e) {
    console.error(e)
    message.error('Delete failed')
  }
}

function onSelectionChange(rows: FileRecord[]) {
  selected.value = rows
}

async function onDownload() {
  const targets = selected.value.filter((r) => r.content_type !== 'folder')
  if (targets.length === 0) return
  try {
    const results = await Promise.all(
      targets.map(async (r) => {
        const data = await downloadFile(r.id).send()
        const url = (data as any)?.download_url || r.oss_url
        return { url, name: r.name }
      })
    )
    results.forEach((it) => {
      if (it.url) triggerDownload(it.url, it.name)
    })
  } catch (e) {
    console.error(e)
    message.error('Download failed')
  }
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename || ''
  a.rel = 'noopener'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
async function onMove() {
  if (selected.value.length === 0) return
  const value = await promptDialog(
    'Move',
    'Destination path (e.g. /workspace/docs)',
    '/target/path'
  )
  if (!value) return
  try {
    const dest = String(value)
    const normalized = dest.startsWith('/') ? dest : '/' + dest
    await Promise.all(
      selected.value.map((r) => updateFile(r.id, { path: normalized }).send())
    )
    message.success('Moved successfully')
    await fetchFiles()
  } catch (e) {
    console.error(e)
    message.error('Move failed')
  }
}
async function onDelete() {
  if (selected.value.length === 0) return
  const ok = await confirmDialog(
    `Delete ${selected.value.length} item(s)?`,
    'Delete'
  )
  if (!ok) return
  try {
    await Promise.all(selected.value.map((r) => deleteFile(r.id).send()))
    message.success('Deleted successfully')
    selected.value = []
    await fetchFiles()
  } catch (e) {
    console.error(e)
    message.error('Delete failed')
  }
}
async function onUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '*/*'
  input.onchange = async () => {
    const fs = Array.from(input.files || [])
    if (fs.length === 0) return
    try {
      // 1) 获取直传凭证
      const policy = await getOSSPolicy().send()

      // 2) 计算对象 key：token.prefix + 当前虚拟路径 + 文件名
      const rawPrefix = policy.token?.prefix || ''
      const prefix = rawPrefix
        ? rawPrefix.endsWith('/')
          ? rawPrefix
          : rawPrefix + '/'
        : ''
      const withoutLeading = currentPath.value.replace(/^\/+/, '')
      const pathPrefix = withoutLeading ? withoutLeading + '/' : ''

      // 3) 通知后端的 path（以 / 开头，非根需以 / 结尾）
      let notifyPath = currentPath.value || '/'
      if (!notifyPath.startsWith('/')) notifyPath = '/' + notifyPath
      if (notifyPath !== '/' && !notifyPath.endsWith('/')) notifyPath += '/'

      // 4) 直传 OSS 然后通知后端
      await uploadAndNotify(fs as File[], policy.token, {
        keyResolver: (f) => {
          const name = f.name
          const dot = name.lastIndexOf('.')
          const ext = dot >= 0 ? name.slice(dot) : ''
          const rand = Math.random().toString(36).slice(2, 10)
          const stamp = Date.now().toString()
          const base = md5(`${name}-${stamp}-${rand}`)
          return `${prefix}${pathPrefix}${base}${ext}`
        },
        notifyPath,
      })

      message.success('Uploaded successfully')
      await fetchFiles()
    } catch (e) {
      console.error(e)
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
    await createFolder(path, String(value)).send()
    message.success('Folder created')
    await fetchFiles()
  } catch (e) {
    console.error(e)
    message.error('Create folder failed')
  }
}

async function onRename() {
  if (selected.value.length !== 1) return
  const target = selected.value[0]
  const value = await promptDialog('Rename', 'New name', target.name)
  if (!value) return
  try {
    await updateFile(target.id, { name: String(value) }).send()
    message.success('Renamed successfully')
    selected.value = []
    await fetchFiles()
  } catch (e) {
    console.error(e)
    message.error('Rename failed')
  }
}

// Naive UI helper dialogs
function promptDialog(
  title: string,
  label: string,
  placeholder = ''
): Promise<string | null> {
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

onMounted(fetchFiles)
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
.path {
  padding: 8px 0;
}
.file-table :deep(.n-data-table-td) {
  white-space: nowrap;
}
</style>
