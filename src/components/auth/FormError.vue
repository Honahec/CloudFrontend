<template>
  <p v-if="message" class="form-error" role="alert" aria-live="polite">{{ message }}</p>
</template>
<script lang="ts" setup>
interface Props { message?: string }
const props = defineProps<Props>()
</script>
<style scoped>
.form-error {
  margin: 6px 0 0 0;
  color: rgb(var(--color-error));
  background: rgb(var(--color-error-bg));
  border: 1px solid rgb(var(--color-error) / 0.25);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
}
</style>
