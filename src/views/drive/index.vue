<template>
  <div class="drive">
    <div class="toolbar">
      <el-space wrap>
        <el-button type="primary" plain>Download</el-button>
        <el-button type="primary" plain>Move</el-button>
        <el-button type="danger" plain>Delete</el-button>
        <el-button type="primary" plain>Share</el-button>
        <el-button type="success" plain>Upload</el-button>
      </el-space>
    </div>

    <el-divider class="divider" />

    <el-breadcrumb separator="/" class="path">
      <el-breadcrumb-item>/</el-breadcrumb-item>
      <el-breadcrumb-item>path</el-breadcrumb-item>
      <el-breadcrumb-item>to</el-breadcrumb-item>
      <el-breadcrumb-item>the</el-breadcrumb-item>
      <el-breadcrumb-item>folder</el-breadcrumb-item>
    </el-breadcrumb>

    <el-table :data="[]" border class="file-table">
      <el-table-column type="selection" width="48" />
      <el-table-column prop="name" label="File Name" min-width="240" />
      <el-table-column prop="category" label="File Category" width="160" />
      <el-table-column prop="updatedAt" label="Update Time" width="180" />
      <el-table-column prop="user" label="User" width="140" />
      <el-table-column prop="status" label="Status" width="120" />
      <el-table-column prop="size" label="Size" width="120" />
      <el-table-column label="Actions" min-width="200">
        <template #default>
          <el-space size="small">
            <el-button link type="danger">Delete</el-button>
            <el-button link type="primary">Share</el-button>
            <el-button link type="primary">Download</el-button>
          </el-space>
        </template>
      </el-table-column>
    </el-table>
  </div>
  
</template>

<script lang="ts" setup>
// keep script empty for now
</script>

<style scoped>
.drive {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar {
  display: flex;
  justify-content: flex-end;
}
.divider {
  margin: 0;
}
.path {
  padding: 8px 0;
}
.file-table :deep(.cell) {
  white-space: nowrap;
}
</style>
