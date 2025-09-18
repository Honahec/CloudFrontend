<template>
  <el-form
    :model="loginForm"
    ref="loginFormRef"
    label-width="80px"
    class="login-form"
    @submit.prevent="onSubmit"
  >
    <el-form-item label="用户名" prop="UserName">
      <el-input v-model="loginForm.username" autocomplete="username" />
    </el-form-item>
    <el-form-item label="密码" prop="Password">
      <el-input
        v-model="loginForm.password"
        type="password"
        autocomplete="current-password"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">登录</el-button>
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { userRegister, userLogin } from '@/api/users/api'
import type { userLoginQuery, userRegisterQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import { useRouter } from 'vue-router'

const loginForm = ref<userLoginQuery>({
  username: '',
  password: '',
})

const router = useRouter()
const loginFormRef = ref()

const onSubmit = () => {
  doLogin(loginForm.value)
}

const doLogin = async (loginForm: userLoginQuery) => {
  try {
    const res = await userLogin(loginForm)
    console.log('登录成功', res)
    setTokenCookies(res.access, res.refresh)
    router.replace('/drive')
  } catch (err) {
    console.error('登录失败', err)
  }
}
</script>
<style scoped>
.login-form {
  max-width: 350px;
  margin: 100px auto;
  padding: 32px 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}
</style>
