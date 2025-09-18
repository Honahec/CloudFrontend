<template></template>
<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userLogout } from '@/api/users/api'
import { removeTokenCookies } from '@/utils/userUtils'

const router = useRouter()

function logout() {
  removeTokenCookies()
  userLogout()
}

onMounted(() => {
  logout()
  router.replace('/')
})
</script>
<style scoped></style>
