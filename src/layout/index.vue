<template>
  <el-container class="layout">
    <el-aside class="sidebar" width="200px">
      <h5 class="mb-2">CloudFrontend</h5>
      <el-menu
        :default-active="$route.path"
        class="el-menu"
        router
        @open="handleOpen"
        @close="handleClose"
      >
        <el-menu-item index="/drive">
          <el-icon><IMessageBox /></el-icon>
          <span>Drive</span>
        </el-menu-item>
      </el-menu>

      <div class="get-started">
        <template v-if="isLoggedIn">
          <el-dropdown
            trigger="click"
            placement="top-start"
            @command="onUserMenuCommand"
            @visible-change="onUserDropdownVisibleChange"
          >
            <div class="user-trigger" ref="userTriggerRef">
              <el-button type="primary" class="user-button">
                {{ displayName }}
              </el-button>
            </div>
            <template #dropdown>
              <el-dropdown-menu :style="{ width: userMenuWidth + 'px' }">
                <el-dropdown-item command="settings">Settings</el-dropdown-item>
                <el-dropdown-item command="logout">Logout</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <div class="user-trigger">
            <el-button
              type="primary"
              class="user-button"
              @click="$router.push('/login')"
            >
              Get Started
            </el-button>
          </div>
        </template>
      </div>
    </el-aside>

    <el-main class="content">
      <!-- 页面右侧内容区域（示例为路由视图） -->
      <router-view />
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { MessageBox as IMessageBox } from '@element-plus/icons-vue'
import { ref, onMounted, nextTick } from 'vue'
import { getUserInfo, refreshAccessToken } from '@/api/users/api'
import { getTokenCookies, setTokenCookies } from '@/utils/userUtils'
import { useRouter } from 'vue-router'

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
//UserInfo
const isLoggedIn = ref(false)
const userName = ref('')
const displayName = ref('')
// init
onMounted(async () => {
  try {
    const { access, refresh } = getTokenCookies()
    if (access && refresh) {
      try {
        const refreshTokens = await refreshAccessToken()
        setTokenCookies(refreshTokens.access, refreshTokens.refresh)
      } catch (e) {
        console.warn('Token refresh failed, using existing token')
      }
      const res = await getUserInfo()
      // API returns { user: {...}, access, refresh }
      userName.value =
        (res as any).user?.username ?? (res as any).username ?? ''
      displayName.value =
        (res as any).user?.display_name ?? (res as any).display_name ?? ''
      isLoggedIn.value = true
    } else {
      isLoggedIn.value = false
    }
  } catch (e) {
    isLoggedIn.value = false
  }
})

// dropdown commands
const router = useRouter()
const onUserMenuCommand = (cmd: string) => {
  if (cmd === 'settings') router.push('/settings')
  else if (cmd === 'logout') router.push('/logout')
}

// sync dropdown width with trigger width
const userTriggerRef = ref<HTMLElement | null>(null)
const userMenuWidth = ref(0)
const onUserDropdownVisibleChange = async (visible: boolean) => {
  if (visible) {
    await nextTick()
    userMenuWidth.value = userTriggerRef.value?.offsetWidth || 0
  }
}
</script>
<style scoped>
.layout {
  height: 100vh;
}
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 8px;
  box-sizing: border-box;
  border-right: 1px solid var(--el-border-color-light);
}
.get-started {
  margin-top: auto;
}
.user-trigger {
  width: 175px;
}
.user-button {
  width: 175px;
}
.content {
  padding: 16px;
  box-sizing: border-box;
  overflow: auto;
}
</style>
