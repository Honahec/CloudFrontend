<template>
  <div class="settings">
    <div class="grid">
      <div class="profile-card n-card">
        <div class="avatar-wrap">
          <n-avatar class="avatar" round :size="180">{{ initials }}</n-avatar>
        </div>
        <div class="name-wrap">
          <div class="display-name">{{ displayName }}</div>
          <div class="username">{{ username }}</div>
        </div>
        <n-space>
          <n-button tertiary type="primary" @click="openPwdDialog">Change Password</n-button>
          <n-button tertiary type="primary" @click="openNameDialog">Change Display Name</n-button>
        </n-space>
      </div>

      <div class="email-card n-card">
        <div class="email-header">
          <div class="email-title">Email</div>
          <n-button tertiary type="primary" @click="openEmailDialog">Edit</n-button>
        </div>
        <n-input class="email-input" disabled :value="email" placeholder="name@example.com" />
      </div>
    </div>

    <!-- Password Modal -->
    <n-modal v-model:show="pwdVisible" preset="card" title="Change Password" :style="{ width: '420px' }">
      <n-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-placement="top">
        <n-form-item label="Old Password" path="old_password">
          <n-input v-model:value="pwdForm.old_password" type="password" placeholder="Old password" />
        </n-form-item>
        <n-form-item label="New Password" path="new_password">
          <n-input v-model:value="pwdForm.new_password" type="password" placeholder="New password" />
        </n-form-item>
        <n-form-item label="Confirm" path="confirm_password">
          <n-input v-model:value="pwdForm.confirm_password" type="password" placeholder="Confirm new password" />
        </n-form-item>
        <div class="modal-actions">
          <n-button @click="onPwdCancel">Cancel</n-button>
          <n-button type="primary" @click="onPwdSave">Save</n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- Email Modal -->
    <n-modal v-model:show="emailVisible" preset="card" title="Change Email" :style="{ width: '420px' }">
      <n-form ref="emailFormRef" :model="emailForm" :rules="emailRules" label-placement="top">
        <n-form-item label="New Email" path="email">
          <n-input v-model:value="emailForm.email" placeholder="name@example.com" />
        </n-form-item>
        <div class="modal-actions">
          <n-button @click="onEmailCancel">Cancel</n-button>
          <n-button type="primary" @click="onEmailSave">Save</n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- Display Name Modal -->
    <n-modal v-model:show="nameVisible" preset="card" title="Change Display Name" :style="{ width: '420px' }">
      <n-form ref="nameFormRef" :model="nameForm" :rules="nameRules" label-placement="top">
        <n-form-item label="Display Name" path="display_name">
          <n-input v-model:value="nameForm.display_name" placeholder="New display name" />
        </n-form-item>
        <div class="modal-actions">
          <n-button @click="onNameCancel">Cancel</n-button>
          <n-button type="primary" @click="onNameSave">Save</n-button>
        </div>
      </n-form>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'
import {
  getUserInfo,
  changePassword as apiChangePassword,
  updateEmail as apiUpdateEmail,
  updateDisplayName as apiUpdateDisplayName,
} from '@/api/users/api'

// Password dialog state and form
const message = useMessage()

const pwdVisible = ref(false)
const pwdFormRef = ref<FormInst | null>(null)
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
      validator: (_r, v) => v === pwdForm.value.new_password,
      message: 'Passwords do not match',
      trigger: 'blur',
    },
  ],
}
const onPwdSave = () => {
  pwdFormRef.value?.validate().then(() => {
    apiChangePassword({
      old_password: pwdForm.value.old_password,
      new_password: pwdForm.value.new_password,
    })
      .then(() => {
        message.success('Password updated')
        pwdVisible.value = false
        pwdForm.value = { old_password: '', new_password: '', confirm_password: '' }
      })
      .catch((err: any) => {
        const msg = (err?.response?.data?.msg || err?.message || 'Failed to update password') as string
        message.error(msg)
      })
  })
}

// Email dialog state and form
const emailVisible = ref(false)
const emailFormRef = ref<FormInst | null>(null)
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
  emailFormRef.value?.validate().then(() => {
    apiUpdateEmail({ email: emailForm.value.email })
      .then(async () => {
        message.success('Email updated')
        emailVisible.value = false
        const res = await getUserInfo()
        email.value = res.email
      })
      .catch((err: any) => {
        const msg = (err?.response?.data?.msg || err?.message || 'Failed to update email') as string
        message.error(msg)
      })
  })
}

// Display name dialog state and form
const nameVisible = ref(false)
const nameFormRef = ref<FormInst | null>(null)
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
  nameFormRef.value?.validate().then(() => {
    apiUpdateDisplayName({ display_name: nameForm.value.display_name })
      .then(async () => {
        message.success('Display name updated')
        nameVisible.value = false
        const res = await getUserInfo()
        displayName.value = res.display_name
      })
      .catch((err: any) => {
        const msg = (err?.response?.data?.msg || err?.message || 'Failed to update display name') as string
        message.error(msg)
      })
  })
}
const displayName = ref('')
const username = ref('')
const email = ref('')
const initials = computed(() => (displayName.value || username.value || 'U').trim().slice(0, 1).toUpperCase())

onMounted(async () => {
  const res = await getUserInfo()
  displayName.value = res.display_name
  username.value = res.username
  email.value = res.email
})
</script>

<style scoped>
.settings { padding: 16px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
.n-card { border: 1px solid #eee; border-radius: 12px; padding: 24px; background: #fff; }
.profile-card { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.avatar-wrap { display: flex; justify-content: center; }
.avatar { border: 2px solid #e5e7eb; font-size: 48px; }
.name-wrap { text-align: left; width: 100%; }
.display-name { font-size: 28px; font-weight: 600; line-height: 1.2; }
.username { color: #6b7280; }
.email-card { padding: 24px; }
.email-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.email-title { font-size: 18px; font-weight: 600; }
.email-input { max-width: 420px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
@media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
</style>
