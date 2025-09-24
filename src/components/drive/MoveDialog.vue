<template>
  <n-modal
    :show="show"
    preset="card"
    class="move-modal"
    :style="modalStyle"
    @close="handleCancel"
  >
    <template #header>{{ t('moveDialog.title') }}</template>

    <div class="section">
      <DriveBreadcrumb
        :segments="breadcrumbSegments"
        :root-label="t('moveDialog.root')"
        @navigate-root="goRoot"
        @navigate-to="goTo"
      />
    </div>

    <n-spin :show="loading">
      <div v-if="!loading && folders.length === 0" class="empty-wrapper">
        <n-empty :description="t('moveDialog.empty')" />
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
            <n-button text type="primary" @click.stop="enterFolder(folder)">
              {{ t('moveDialog.open') }}
            </n-button>
          </template>
        </n-list-item>
      </n-list>
    </n-spin>

    <template #action>
      <n-space>
        <n-button @click="handleCancel">{{ t('moveDialog.cancel') }}</n-button>
        <n-button type="primary" :loading="loading" @click="handleConfirm">
          {{ t('moveDialog.confirm') }}
        </n-button>
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
import { useI18n } from '@/composables/locale'

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm', path: string): void
}>()

const message = useMessage()
const { t } = useI18n()
const internalPath = ref('')
const folders = ref<FileRecord[]>([])
const loading = ref(false)

const props = defineProps<{
  show: boolean
  startPath?: string
  minWidth?: string
  maxWidth?: string
}>()

const modalStyle = computed(() => ({
  width: props.minWidth ?? '60vw',
  maxWidth: props.maxWidth ?? '60vw',
}))

const breadcrumbSegments = computed(() =>
  internalPath.value ? internalPath.value.split('/').filter(Boolean) : []
)

function normalizeState(path?: string): string {
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
    folders.value = items.filter(
      (item: FileRecord) => item.content_type === 'folder'
    )
  } catch (error) {
    console.error(error)
    folders.value = []
    message.error(t('moveDialog.failed'))
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
