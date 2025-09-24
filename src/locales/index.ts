import en from './en'
import zh from './zh'

export const messages = {
  en,
  zh,
}

export type MessageSchema = typeof en
export type MessageKey = keyof typeof messages
