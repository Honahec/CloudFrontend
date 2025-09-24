<template>
  <div class="settings">
    <div class="grid">
      <div class="profile-card n-card">
        <div class="avatar-wrap">
          <n-avatar class="avatar" round :size="180">{{ initials }}</n-avatar>
        </div>
        <div class="name-wrap">
          <div class="display-name">{{ displayName }}</div>
          <div class="username">@{{ username }}</div>
        </div>
        <n-space>
          <n-button tertiary type="primary" @click="openPwdDialog">
            {{ t('settings.changePassword') }}
          </n-button>
          <n-button tertiary type="primary" @click="openNameDialog">
            {{ t('settings.changeDisplayName') }}
          </n-button>
        </n-space>
      </div>

      <div class="email-card n-card">
        <div class="email-header">
          <div class="email-title">{{ t('settings.email') }}</div>
          <n-button tertiary type="primary" @click="openEmailDialog">
            {{ t('common.actions.edit') }}
          </n-button>
        </div>
        <n-input
          class="email-input"
          disabled
          :value="email"
          :placeholder="t('common.placeholder.email')"
        />
      </div>
    </div>

    <!-- Password Modal -->
    <n-modal
      v-model:show="pwdVisible"
      preset="card"
      :title="t('settings.modals.passwordTitle')"
      :style="{ width: '420px' }"
    >
      <n-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-placement="top">
        <n-form-item :label="t('settings.modals.oldPassword')" path="old_password">
          <n-input
            v-model:value="pwdForm.old_password"
            type="password"
            :placeholder="t('common.placeholder.passwordOld')"
          />
        </n-form-item>
        <n-form-item :label="t('settings.modals.newPassword')" path="new_password">
          <n-input
            v-model:value="pwdForm.new_password"
            type="password"
            :placeholder="t('common.placeholder.passwordNew')"
          />
        </n-form-item>
        <n-form-item :label="t('settings.modals.confirmPassword')" path="confirm_password">
          <n-input
            v-model:value="pwdForm.confirm_password"
            type="password"
            :placeholder="t('common.placeholder.confirmPassword')"
          />
        </n-form-item>
        <div class="modal-actions">
          <n-button @click="onPwdCancel">{{ t('settings.modals.cancel') }}</n-button>
          <n-button type="primary" @click="onPwdSave">
            {{ t('settings.modals.save') }}
          </n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- Email Modal -->
    <n-modal
      v-model:show="emailVisible"
      preset="card"
      :title="t('settings.modals.emailTitle')"
      :style="{ width: '420px' }"
    >
      <n-form ref="emailFormRef" :model="emailForm" :rules="emailRules" label-placement="top">
        <n-form-item :label="t('settings.modals.newEmail')" path="email">
          <n-input
            v-model:value="emailForm.email"
            :placeholder="t('common.placeholder.email')"
          />
        </n-form-item>
        <div class="modal-actions">
          <n-button @click="onEmailCancel">{{ t('settings.modals.cancel') }}</n-button>
          <n-button type="primary" @click="onEmailSave">
            {{ t('settings.modals.save') }}
          </n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- Display Name Modal -->
    <n-modal
      v-model:show="nameVisible"
      preset="card"
      :title="t('settings.modals.nameTitle')"
      :style="{ width: '420px' }"
    >
      <n-form ref="nameFormRef" :model="nameForm" :rules="nameRules" label-placement="top">
        <n-form-item :label="t('settings.modals.displayName')" path="display_name">
          <n-input
            v-model:value="nameForm.display_name"
            :placeholder="t('common.placeholder.displayName')"
          />
        </n-form-item>
        <div class="modal-actions">
          <n-button @click="onNameCancel">{{ t('settings.modals.cancel') }}</n-button>
          <n-button type="primary" @click="onNameSave">
            {{ t('settings.modals.save') }}
          </n-button>
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
import { useI18n } from '@/composables/locale'

// Password dialog state and form
const message = useMessage()
const { t } = useI18n()

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
const pwdRules = computed<FormRules>(() => ({
  old_password: [
    { required: true, message: t('settings.rules.oldPassword'), trigger: 'blur' },
  ],
  new_password: [
    { required: true, message: t('settings.rules.newPassword'), trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: t('settings.rules.confirmPassword'), trigger: 'blur' },
    {
      validator: (_r, v) => v === pwdForm.value.new_password,
      message: t('settings.rules.mismatch'),
      trigger: 'blur',
    },
  ],
}))
const onPwdSave = () => {
  pwdFormRef.value?.validate().then(() => {
    apiChangePassword({
      old_password: pwdForm.value.old_password,
      new_password: pwdForm.value.new_password,
    })
      .then(() => {
        message.success(t('settings.feedback.passwordUpdated'))
        pwdVisible.value = false
        pwdForm.value = { old_password: '', new_password: '', confirm_password: '' }
      })
      .catch((err: any) => {
        const msg =
          (err?.response?.data?.msg || err?.message || t('settings.feedback.passwordFailed')) as string
        message.error(msg)
      })
  })
}

// Email dialog state and form
const emailVisible = ref(false)
const emailFormRef = ref<FormInst | null>(null)
const emailForm = ref({ email: '' })
const emailRules = computed<FormRules>(() => ({
  email: [
    { required: true, message: t('settings.rules.email'), trigger: 'blur' },
    { type: 'email', message: t('settings.rules.emailInvalid'), trigger: 'blur' },
  ],
}))
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
        message.success(t('settings.feedback.emailUpdated'))
        emailVisible.value = false
        const res = await getUserInfo()
        email.value = res.email
      })
      .catch((err: any) => {
        const msg =
          (err?.response?.data?.msg || err?.message || t('settings.feedback.emailFailed')) as string
        message.error(msg)
      })
  })
}

// Display name dialog state and form
const nameVisible = ref(false)
const nameFormRef = ref<FormInst | null>(null)
const nameForm = ref({ display_name: '' })
const nameRules = computed<FormRules>(() => ({
  display_name: [
    { required: true, message: t('settings.rules.displayName'), trigger: 'blur' },
  ],
}))
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
        message.success(t('settings.feedback.nameUpdated'))
        nameVisible.value = false
        const res = await getUserInfo()
        displayName.value = res.display_name
      })
      .catch((err: any) => {
        const msg =
          (err?.response?.data?.msg || err?.message || t('settings.feedback.nameFailed')) as string
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
.settings {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 24px;
  align-items: start;
}

.n-card {
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 24px;
  background: var(--color-card-bg);
  box-shadow: 0 24px 80px rgba(17, 17, 17, 0.06);
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-wrap {
  display: flex;
  justify-content: center;
}

.avatar {
  border: 2px solid var(--color-border);
  font-size: 48px;
  background: var(--color-page-bg);
  color: var(--color-text);
}

.name-wrap {
  text-align: left;
  width: 100%;
}

.display-name {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-text);
}

.username {
  color: var(--color-subtle-text);
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
  color: var(--color-text);
}

.email-input {
  max-width: 420px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
