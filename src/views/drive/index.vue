<template>
  <div class="drive">
    <div class="toolbar">
      <el-space wrap>
        <el-button type="primary" plain @click="onNewFolder"
          >New Folder</el-button
        >
        <el-button type="success" plain @click="onUpload">Upload</el-button>
        <el-button
          type="primary"
          plain
          @click="onDownload"
          :disabled="selectedNonFolderCount === 0"
          >Download</el-button
        >
        <el-button
          type="primary"
          plain
          @click="onMove"
          :disabled="selected.length === 0"
          >Move</el-button
        >
        <el-button
          type="primary"
          plain
          @click="onRename"
          :disabled="selected.length !== 1"
          >Rename</el-button
        >
        <el-button
          type="danger"
          plain
          @click="onDelete"
          :disabled="selected.length === 0"
          >Delete</el-button
        >
      </el-space>
    </div>

    <el-divider class="divider" />

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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  listFilesByPath,
  deleteFile,
  updateFile,
  createFolder,
  getOSSPolicy,
} from '@/api/files/api'
import type { FileRecord } from '@/api/files/type'
import DriveBreadcrumb from '@/components/drive/DriveBreadcrumb.vue'
import FilesTable from '@/components/drive/FilesTable.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadAndNotify } from '@/utils/fileUtils'

const router = useRouter()
const route = useRoute()

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

function downloadRow(row: FileRecord) {
  if (row.content_type !== 'folder' && row.oss_url)
    window.open(row.oss_url, '_blank')
}
async function deleteRow(row: FileRecord) {
  const ok = await ElMessageBox.confirm(`Delete "${row.name}"?`, 'Delete', {
    type: 'warning',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
  }).catch(() => false)
  if (!ok) return
  try {
    await deleteFile(row.id).send()
    ElMessage.success('Deleted successfully')
    await fetchFiles()
  } catch (e) {
    console.error(e)
    ElMessage.error('Delete failed')
  }
}

function onSelectionChange(rows: FileRecord[]) {
  selected.value = rows
}

function onDownload() {
  if (selectedNonFolderCount.value === 0) return
  selected.value
    .filter((r) => r.content_type !== 'folder' && r.oss_url)
    .forEach((r) => window.open(r.oss_url, '_blank'))
}
async function onMove() {
  if (selected.value.length === 0) return
  const { value, action } = await ElMessageBox.prompt(
    'Destination path (e.g. /workspace/docs)',
    'Move',
    {
      confirmButtonText: 'Move',
      cancelButtonText: 'Cancel',
      inputPlaceholder: '/target/path',
    }
  ).catch(() => ({ value: null, action: 'cancel' as const }))
  if (!value || action !== 'confirm') return
  try {
    const dest = String(value)
    const normalized = dest.startsWith('/') ? dest : '/' + dest
    await Promise.all(
      selected.value.map((r) => updateFile(r.id, { path: normalized }).send())
    )
    ElMessage.success('Moved successfully')
    await fetchFiles()
  } catch (e) {
    console.error(e)
    ElMessage.error('Move failed')
  }
}
async function onDelete() {
  if (selected.value.length === 0) return
  const ok = await ElMessageBox.confirm(
    `Delete ${selected.value.length} item(s)?`,
    'Delete',
    { type: 'warning', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' }
  ).catch(() => false)
  if (!ok) return
  try {
    await Promise.all(selected.value.map((r) => deleteFile(r.id).send()))
    ElMessage.success('Deleted successfully')
    selected.value = []
    await fetchFiles()
  } catch (e) {
    console.error(e)
    ElMessage.error('Delete failed')
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
        keyResolver: (f) => `${prefix}${pathPrefix}${f.name}`,
        notifyPath,
      })

      ElMessage.success('Uploaded successfully')
      await fetchFiles()
    } catch (e) {
      console.error(e)
      ElMessage.error('Upload failed')
    }
  }
  input.click()
}

async function onNewFolder() {
  const { value, action } = await ElMessageBox.prompt(
    'Folder name',
    'New Folder',
    {
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel',
      inputPlaceholder: 'New folder',
    }
  ).catch(() => ({ value: null, action: 'cancel' as const }))
  if (!value || action !== 'confirm') return
  try {
    let path = currentPath.value
    if (!path) path = '/'
    else if (!path.startsWith('/')) path = '/' + path
    await createFolder(path, String(value)).send()
    ElMessage.success('Folder created')
    await fetchFiles()
  } catch (e) {
    console.error(e)
    ElMessage.error('Create folder failed')
  }
}

async function onRename() {
  if (selected.value.length !== 1) return
  const target = selected.value[0]
  const { value, action } = await ElMessageBox.prompt('New name', 'Rename', {
    confirmButtonText: 'Rename',
    cancelButtonText: 'Cancel',
    inputValue: target.name,
  }).catch(() => ({ value: null, action: 'cancel' as const }))
  if (!value || action !== 'confirm') return
  try {
    await updateFile(target.id, { name: String(value) }).send()
    ElMessage.success('Renamed successfully')
    selected.value = []
    await fetchFiles()
  } catch (e) {
    console.error(e)
    ElMessage.error('Rename failed')
  }
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
.file-table :deep(.cell) {
  white-space: nowrap;
}
.file-link {
  color: var(--el-color-primary);
}
.file-link:hover {
  text-decoration: underline;
}
</style>
