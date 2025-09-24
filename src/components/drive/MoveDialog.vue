<template>
  <n-modal :show="show" preset="card" class="move-modal" @close="handleCancel">
    <template #header>Move To</template>

    <div class="section">
      <DriveBreadcrumb
        :segments="breadcrumbSegments"
        root-label="Drive"
        @navigate-root="goRoot"
        @navigate-to="goTo"
      />
    </div>

    <n-spin :show="loading">
      <div v-if="!loading && folders.length === 0" class="empty-wrapper">
        <n-empty description="No subfolders" />
      </div>
      <n-list v-else bordered hoverable>
        <n-list-item
          v-for="folder in folders"
          :key="folder.id"
          class="folder-item"
          @click="enterFolder(folder)"
        >
          <div class="folder-name">
            <n-icon size="18">
              <FolderIcon />
            </n-icon>
            <span>{{ folder.name }}</span>
          </div>
          <template #suffix>
            <n-button text type="primary" @click.stop="enterFolder(folder)">Open</n-button>
          </template>
        </n-list-item>
      </n-list>
    </n-spin>

    <template #action>
      <n-space>
        <n-button @click="handleCancel">Cancel</n-button>
        <n-button type="primary" :loading="loading" @click="handleConfirm">Move here</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import DriveBreadcrumb from './DriveBreadcrumb.vue'
import type { FileRecord } from '@/api/files/type'
import { listFilesByPath } from '@/api/files/api'
import { Folder as FolderIcon } from '@element-plus/icons-vue'

const props = defineProps<{
  show: boolean
  startPath: string
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm', path: string): void
}>()

const message = useMessage()
const internalPath = ref('')
const folders = ref<FileRecord[]>([])
const loading = ref(false)

const breadcrumbSegments = computed(() =>
  internalPath.value ? internalPath.value.split('/').filter(Boolean) : []
)

function normalizeState(path: string): string {
  if (!path) return ''
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return trimmed
}

function apiListPath(path: string): string {
  if (!path) return '/'
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return `/${trimmed}/`
}

async function fetchFolders() {
  if (!props.show) return
  loading.value = true
  try {
    const apiPath = apiListPath(internalPath.value)
    const resp = await listFilesByPath(apiPath)
    const items = Array.isArray((resp as any)?.files) ? (resp as any).files : []
    folders.value = items.filter((item: FileRecord) => item.content_type === 'folder')
  } catch (error) {
    console.error(error)
    folders.value = []
    message.error('Failed to load folders')
  } finally {
    loading.value = false
  }
}

function goRoot() {
  internalPath.value = ''
}

function goTo(idx: number) {
  const segs = breadcrumbSegments.value.slice(0, idx + 1)
  internalPath.value = segs.join('/')
}

function enterFolder(folder: FileRecord) {
  const next = internalPath.value
    ? `${internalPath.value}/${folder.name}`
    : folder.name
  internalPath.value = normalizeState(next)
}

function handleConfirm() {
  const normalized = internalPath.value ? `/${internalPath.value}/` : '/'
  emit('confirm', normalized)
  emit('update:show', false)
}

function handleCancel() {
  emit('update:show', false)
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      internalPath.value = normalizeState(props.startPath)
      fetchFolders()
    }
  }
)

watch(internalPath, () => {
  fetchFolders()
})

watch(
  () => props.startPath,
  (val) => {
    if (!props.show) internalPath.value = normalizeState(val)
  }
)

onMounted(() => {
  internalPath.value = normalizeState(props.startPath)
})
</script>

<style scoped>
.move-modal {
  width: 520px;
}
.section {
  margin-bottom: 12px;
}
.folder-item {
  cursor: pointer;
}
.folder-item:hover {
  background-color: rgba(24, 160, 88, 0.08);
}
.folder-name {
  display: flex;
  gap: 8px;
  align-items: center;
}
.empty-wrapper {
  padding: 16px 0;
}
</style>
