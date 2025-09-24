type Translator = (key: string, params?: Record<string, unknown>) => string

export function mapShareAccessError(error: unknown, t: Translator): string {
  const fallback = t('common.feedback.loadSharedFailed')
  const errorLike = error as {
    response?: { status?: number; data?: { message?: unknown; detail?: unknown } }
    message?: unknown
    status?: number
  }

  const status = normalizeStatus(errorLike)
  const rawMessage = extractMessage(errorLike)
  const normalized = rawMessage.toLowerCase()

  if (status === 401) {
    return t('sharePage.errors.unauthorized')
  }

  if (status === 404) {
    return t('sharePage.errors.notFound')
  }

  if (status === 403) {
    if (includesKeyword(normalized, ['password', 'secret', 'credential', '密码'])) {
      return t('sharePage.errors.invalidPassword')
    }
    if (includesKeyword(normalized, ['download', '次数', 'limit', 'quota', 'exceed'])) {
      return t('sharePage.errors.limitExceeded')
    }
    return t('sharePage.errors.unauthorized')
  }

  if (status === 400) {
    if (includesKeyword(normalized, ['password', 'secret', '密码'])) {
      return t('sharePage.errors.invalidPassword')
    }
  }

  if (includesKeyword(normalized, ['not found', '不存在'])) {
    return t('sharePage.errors.notFound')
  }

  if (includesKeyword(normalized, ['download', '次数', 'limit', 'quota', 'exceed'])) {
    return t('sharePage.errors.limitExceeded')
  }

  if (includesKeyword(normalized, ['password', 'secret', 'credential', '密码'])) {
    return t('sharePage.errors.invalidPassword')
  }

  if (includesKeyword(normalized, ['login', '登录', 'unauthorized', 'forbidden'])) {
    return t('sharePage.errors.unauthorized')
  }

  if (rawMessage) {
    return rawMessage
  }

  return fallback
}

function normalizeStatus(errorLike: {
  response?: { status?: number }
  status?: number
}): number | null {
  const status = errorLike?.response?.status ?? errorLike?.status
  return typeof status === 'number' ? status : null
}

function extractMessage(errorLike: {
  response?: { data?: { message?: unknown; detail?: unknown } }
  message?: unknown
}): string {
  const responseMessage = errorLike?.response?.data?.message
  const responseDetail = errorLike?.response?.data?.detail
  const fallback = errorLike?.message
  return toMessage(responseMessage) || toMessage(responseDetail) || toMessage(fallback)
}

function toMessage(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return ''
}

function includesKeyword(source: string, keywords: string[]): boolean {
  return keywords.some((keyword) => keyword && source.includes(keyword.toLowerCase()))
}
