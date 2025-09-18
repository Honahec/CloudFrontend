<template>
  <el-form
    :model="registerForm"
    ref="registerFormRef"
    label-width="80px"
    class="register-form"
    @submit.prevent="onSubmit"
  >
    <el-form-item label="用户名" prop="UserName">
      <el-input v-model="registerForm.username" autocomplete="username" />
    </el-form-item>
    <el-form-item label="昵称" prop="Display_Name">
      <el-input v-model="registerForm.display_name" autocomplete="username" />
    </el-form-item>
    <el-form-item label="邮件" prop="UserName">
      <el-input v-model="registerForm.email" autocomplete="username" />
    </el-form-item>
    <el-form-item label="密码" prop="Password">
      <el-input
        v-model="registerForm.password"
        type="password"
        autocomplete="current-password"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">注册</el-button>
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { userRegister, userLogin } from '@/api/users/api'
import type { userLoginQuery, userRegisterQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import { useRouter } from 'vue-router'

const router = useRouter()
const registerForm = ref<userRegisterQuery>({
  username: '',
  password: '',
  email: '',
  display_name: '',
})

const loginFormRef = ref()

const onSubmit = () => {
  doRegister(registerForm.value)
}

const doRegister = async (registerForm: userRegisterQuery) => {
  try {
    const res = await userRegister(registerForm)
    setTokenCookies(res.access, res.refresh)
    console.log('注册成功', res)
    router.replace('/drive')
  } catch (err) {
    console.error('注册失败', err)
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
