<template>
  <el-container class="layout">
    <el-aside class="sidebar" width="200px">
      <h5 class="mb-2">CloudFrontend</h5>
      <el-menu
        default-active="2"
        class="el-menu-vertical-demo"
        @open="handleOpen"
        @close="handleClose"
      >
        <el-menu-item index="1">
          <el-icon><IconMenu /></el-icon>
          <span>Drive</span>
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><Setting /></el-icon>
          <span>Settings</span>
        </el-menu-item>
      </el-menu>

      <el-button
        class="get-started"
        type="primary"
        @click="isLoggedIn ? $router.push('/login') : $router.push('/settings')"
      >
        {{ isLoggedIn ? 'Get Started' : userName }}
      </el-button>
    </el-aside>

    <el-main class="content">
      <!-- 页面右侧内容区域（示例为路由视图） -->
      <router-view />
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { Menu as IconMenu, Setting } from '@element-plus/icons-vue'
import { ref, onMounted } from 'vue'
import type { UserInfo } from '@/api/users/type'
import { getUserInfo } from '@/api/users/api'

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
//UserInfo
const isLoggedIn = ref(false)
const user = ref<UserInfo | null>(null)
const userName = ref('')
const displayName = ref('')

//init
onMounted(async () => {
  try {
    const res = await getUserInfo()
    user.value = res
    userName.value = res.username
    displayName.value = res.display_name
    isLoggedIn.value = true
  } catch (e) {
    isLoggedIn.value = false
  }
})
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
.content {
  padding: 16px;
  box-sizing: border-box;
  overflow: auto;
}
</style>
