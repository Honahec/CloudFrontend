<template>
  <el-form
    :model="registerForm"
    :rules="rules"
    ref="registerFormRef"
    label-width="90px"
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
    <el-form-item label="密码" prop="password">
      <el-input
        v-model="registerForm.password"
        type="password"
        autocomplete="current-password"
      />
    </el-form-item>
    <el-form-item label="重复密码" prop="confirm_password">
      <el-input
        v-model="registerForm.confirm_password"
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
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { userRegister, userLogin } from '@/api/users/api'
import type { userLoginQuery, userRegisterQuery } from '@/api/users/type'
import { setTokenCookies } from '@/utils/userUtils'
import { useRouter } from 'vue-router'

const router = useRouter()
const registerForm = ref({
  username: '',
  password: '',
  confirm_password: '',
  email: '',
  display_name: '',
})

const registerFormRef = ref<FormInstance>()
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  display_name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirm_password: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        if (v !== registerForm.value.password) cb(new Error('两次密码不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

const onSubmit = () => {
  registerFormRef.value?.validate((ok) => {
    if (!ok) return
    if (registerForm.value.password !== registerForm.value.confirm_password) {
      ElMessage.error('两次密码不一致')
      return
    }
    const payload: userRegisterQuery = {
      username: registerForm.value.username,
      password: registerForm.value.password,
      email: registerForm.value.email,
      display_name: registerForm.value.display_name,
    }
    doRegister(payload)
  })
}

const doRegister = async (payload: userRegisterQuery) => {
  try {
    const res = await userRegister(payload)
    setTokenCookies(res.access, res.refresh)
    console.log('注册成功', res)
    router.replace('/drive')
  } catch (err) {
    console.error('注册失败', err)
  }
}
</script>
<style scoped>
.register-form {
  max-width: 350px;
  margin: 100px auto;
  padding: 32px 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}
</style>
