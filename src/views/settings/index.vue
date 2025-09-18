<template>
  <div class="settings">
    <el-row :gutter="32" align="middle" class="row">
      <el-col :span="10">
        <el-card shadow="never" class="profile-card">
          <div class="avatar-wrap">
            <el-avatar class="avatar" shape="circle" :size="180">D</el-avatar>
          </div>
          <div class="name-wrap">
            <div class="display-name">{{ displayName }}</div>
            <div class="username">{{ username }}</div>
          </div>
          <el-button
            type="primary"
            plain
            class="change-password"
            @click="openPwdDialog"
            >Change Password</el-button
          >
          <el-button
            type="primary"
            plain
            class="change-display-name"
            @click="openNameDialog"
            >Change Display Name</el-button
          >
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="never" class="email-card">
          <div class="email-header">
            <div class="email-title">Email</div>
            <el-button
              type="primary"
              plain
              class="edit-email"
              @click="openEmailDialog"
              >Edit</el-button
            >
          </div>
          <el-input
            class="email-input"
            disabled
            :model-value="email"
            placeholder="name@example.com"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- Change Password Dialog -->
    <el-dialog v-model="pwdVisible" title="Change Password" width="420px">
      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-width="140px"
      >
        <el-form-item label="Old Password" prop="old_password">
          <el-input
            v-model="pwdForm.old_password"
            type="password"
            placeholder="Old password"
          />
        </el-form-item>
        <el-form-item label="New Password" prop="new_password">
          <el-input
            v-model="pwdForm.new_password"
            type="password"
            placeholder="New password"
          />
        </el-form-item>
        <el-form-item label="Confirm" prop="confirm_password">
          <el-input
            v-model="pwdForm.confirm_password"
            type="password"
            placeholder="Confirm new password"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onPwdCancel">Cancel</el-button>
        <el-button type="primary" @click="onPwdSave">Save</el-button>
      </template>
    </el-dialog>

    <!-- Change Email Dialog -->
    <el-dialog v-model="emailVisible" title="Change Email" width="420px">
      <el-form
        ref="emailFormRef"
        :model="emailForm"
        :rules="emailRules"
        label-width="120px"
      >
        <el-form-item label="New Email" prop="email">
          <el-input v-model="emailForm.email" placeholder="name@example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onEmailCancel">Cancel</el-button>
        <el-button type="primary" @click="onEmailSave">Save</el-button>
      </template>
    </el-dialog>

    <!-- Change Display Name Dialog -->
    <el-dialog v-model="nameVisible" title="Change Display Name" width="420px">
      <el-form
        ref="nameFormRef"
        :model="nameForm"
        :rules="nameRules"
        label-width="140px"
      >
        <el-form-item label="Display Name" prop="display_name">
          <el-input
            v-model="nameForm.display_name"
            placeholder="New display name"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onNameCancel">Cancel</el-button>
        <el-button type="primary" @click="onNameSave">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  getUserInfo,
  changePassword as apiChangePassword,
  updateEmail as apiUpdateEmail,
  updateDisplayName as apiUpdateDisplayName,
} from '@/api/users/api'

// Password dialog state and form
const pwdVisible = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: '',
})
const openPwdDialog = () => {
  pwdVisible.value = true
}
const onPwdCancel = () => {
  pwdVisible.value = false
  pwdForm.value = { old_password: '', new_password: '', confirm_password: '' }
}
const pwdRules: FormRules = {
  old_password: [
    { required: true, message: 'Please input old password', trigger: 'blur' },
  ],
  new_password: [
    { required: true, message: 'Please input new password', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: 'Please confirm new password', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        if (v !== pwdForm.value.new_password)
          cb(new Error('Passwords do not match'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}
const onPwdSave = () => {
  pwdFormRef.value?.validate((ok) => {
    if (!ok) return
    apiChangePassword({
      old_password: pwdForm.value.old_password,
      new_password: pwdForm.value.new_password,
    })
      .then(() => {
        ElMessage.success('Password updated')
        pwdVisible.value = false
        pwdForm.value = {
          old_password: '',
          new_password: '',
          confirm_password: '',
        }
      })
      .catch((err: any) => {
        const msg = (err?.response?.data?.msg ||
          err?.message ||
          'Failed to update password') as string
        ElMessage.error(msg)
      })
  })
}

// Email dialog state and form
const emailVisible = ref(false)
const emailFormRef = ref<FormInstance>()
const emailForm = ref({ email: '' })
const emailRules: FormRules = {
  email: [
    { required: true, message: 'Please input email', trigger: 'blur' },
    { type: 'email', message: 'Invalid email', trigger: 'blur' },
  ],
}
const openEmailDialog = () => {
  emailVisible.value = true
}
const onEmailCancel = () => {
  emailVisible.value = false
  emailForm.value.email = ''
}
const onEmailSave = () => {
  emailFormRef.value?.validate((ok) => {
    if (!ok) return
    apiUpdateEmail({ email: emailForm.value.email })
      .then(async () => {
        ElMessage.success('Email updated')
        emailVisible.value = false
        const res = await getUserInfo()
        email.value = res.email
      })
      .catch((err: any) => {
        const msg = (err?.response?.data?.msg ||
          err?.message ||
          'Failed to update email') as string
        ElMessage.error(msg)
      })
  })
}

// Display name dialog state and form
const nameVisible = ref(false)
const nameFormRef = ref<FormInstance>()
const nameForm = ref({ display_name: '' })
const nameRules: FormRules = {
  display_name: [
    { required: true, message: 'Please input display name', trigger: 'blur' },
  ],
}
const openNameDialog = () => {
  nameForm.value.display_name = displayName.value || ''
  nameVisible.value = true
}
const onNameCancel = () => {
  nameVisible.value = false
  nameForm.value.display_name = ''
}
const onNameSave = () => {
  nameFormRef.value?.validate((ok) => {
    if (!ok) return
    apiUpdateDisplayName({ display_name: nameForm.value.display_name })
      .then(async () => {
        ElMessage.success('Display name updated')
        nameVisible.value = false
        // refresh profile
        const res = await getUserInfo()
        displayName.value = res.display_name
      })
      .catch((err: any) => {
        const msg = (err?.response?.data?.msg ||
          err?.message ||
          'Failed to update display name') as string
        ElMessage.error(msg)
      })
  })
}
const displayName = ref('')
const username = ref('')
const email = ref('')

onMounted(async () => {
  const res = await getUserInfo()
  displayName.value = res.display_name
  username.value = res.username
  email.value = res.email
})
</script>

<style scoped>
.settings {
  padding: 16px;
}
.row {
  min-height: 60vh;
}
.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
}
.avatar-wrap {
  display: flex;
  justify-content: center;
}
.avatar {
  border: 2px solid var(--el-border-color);
  font-size: 48px;
}
.name-wrap {
  text-align: left;
  width: 100%;
}
.display-name {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}
.username {
  color: var(--el-text-color-secondary);
}
.change-password {
  align-self: flex-start;
}
.change-display-name {
  align-self: flex-start;
}

.email-card {
  padding: 24px;
}
.email-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.email-title {
  font-size: 18px;
  font-weight: 600;
}
.email-input {
  max-width: 420px;
}
</style>
