import type { TreeOption } from 'naive-ui'
import type { FileRecord } from '@/api/files/type'

export type ShareTreeOption = TreeOption & {
  key: string
  label: string
  type: 'folder' | 'file'
  record?: FileRecord
  children?: ShareTreeOption[]
}

export function buildShareTree(records: FileRecord[]): ShareTreeOption[] {
  const root: ShareTreeOption = {
    key: '__root__',
    label: '/',
    type: 'folder',
    children: [],
  }

  const dirMap = new Map<string, ShareTreeOption>()
  dirMap.set('/', root)

  const ensureDir = (path: string): ShareTreeOption => {
    const normalized = normalizeDirPath(path)
    if (dirMap.has(normalized)) {
      return dirMap.get(normalized) as ShareTreeOption
    }
    if (normalized === '/') return root

    const segments = normalized.slice(1).split('/')
    let current = root
    let currentPath = ''

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : `/${segment}`
      let node = dirMap.get(currentPath)
      if (!node) {
        node = {
          key: `dir-${currentPath}`,
          label: segment,
          type: 'folder',
          children: [],
        }
        dirMap.set(currentPath, node)
        if (!current.children) current.children = []
        if (!current.children.find((child) => child.key === node!.key)) {
          current.children.push(node)
        }
      }
      current = node
    }

    return current
  }

  for (const record of records) {
    if (record.content_type === 'folder') {
      const folderPath = joinPath(record.path, record.name)
      const folderNode = ensureDir(folderPath)
      folderNode.record = record
      continue
    }

    const parentNode = ensureDir(record.path || '/')
    if (!parentNode.children) parentNode.children = []
    if (!parentNode.children.find((child) => child.key === `file-${record.id}`)) {
      parentNode.children.push({
        key: `file-${record.id}`,
        label: record.name,
        type: 'file',
        record,
      })
    }
  }

  if (root.children) {
    sortNodes(root.children)
  }

  return root.children ?? []
}

export function collectTreeKeys(nodes: ShareTreeOption[]): string[] {
  const keys: string[] = []

  const walk = (list: ShareTreeOption[]) => {
    for (const node of list) {
      keys.push(node.key)
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }

  walk(nodes)
  return keys
}

function normalizeDirPath(path: string | null | undefined): string {
  if (!path || path === '/') return '/'
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : '/'
}

function joinPath(parentPath: string | null | undefined, name: string): string {
  const normalizedParent = normalizeDirPath(parentPath)
  const segment = name.replace(/\/+$/g, '')
  if (normalizedParent === '/') {
    return `/${segment}`
  }
  return `${normalizedParent}/${segment}`
}

function sortNodes(nodes: ShareTreeOption[]) {
  nodes.sort((a, b) => {
    if (a.type === b.type) {
      return (a.label || '').localeCompare(b.label || '')
    }
    return a.type === 'folder' ? -1 : 1
  })

  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      sortNodes(node.children)
    }
  }
}
