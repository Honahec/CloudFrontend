<template>
  <AuthSplitView
    data-testid="auth-split-view"
    :brandName="brand"
    @loginSuccess="onSuccess"
    @registerSuccess="onSuccess"
    @authError="onAuthError"
  />
</template>

<script lang="ts" setup>
import AuthSplitView from '@/components/auth/AuthSplitView.vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from '@/composables/locale'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const brand = t('auth.brand')

function onSuccess() {
  const redirectParam = route.query.redirect
  const redirect = typeof redirectParam === 'string' && redirectParam.startsWith('/') ? redirectParam : '/drive'
  router.replace(redirect)
}

function onAuthError(_message: string) {
  // no-op placeholder for integration
}
</script>

<style scoped>
:host { display: contents; }
</style>
