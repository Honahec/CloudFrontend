import enAuth from './en/auth.json'
import zhAuth from './zh/auth.json'
import enCommon from './en/common.json'
import zhCommon from './zh/common.json'
import enLayout from './en/layout.json'
import zhLayout from './zh/layout.json'
import enDrive from './en/drive.json'
import zhDrive from './zh/drive.json'
import enFilesTable from './en/filesTable.json'
import zhFilesTable from './zh/filesTable.json'
import enMoveDialog from './en/moveDialog.json'
import zhMoveDialog from './zh/moveDialog.json'
import enUpload from './en/upload.json'
import zhUpload from './zh/upload.json'
import enShareModal from './en/shareModal.json'
import zhShareModal from './zh/shareModal.json'
import enShareBanner from './en/shareBanner.json'
import zhShareBanner from './zh/shareBanner.json'
import enHome from './en/home.json'
import zhHome from './zh/home.json'
import enSharePage from './en/sharePage.json'
import zhSharePage from './zh/sharePage.json'
import enDropPage from './en/dropPage.json'
import zhDropPage from './zh/dropPage.json'
import enSettings from './en/settings.json'
import zhSettings from './zh/settings.json'

export const messages = {
  en: {
    auth: enAuth,
    common: enCommon,
    layout: enLayout,
    drive: enDrive,
    filesTable: enFilesTable,
    moveDialog: enMoveDialog,
    upload: enUpload,
    shareModal: enShareModal,
    shareBanner: enShareBanner,
    home: enHome,
    sharePage: enSharePage,
    dropPage: enDropPage,
    settings: enSettings,
  },
  zh: {
    auth: zhAuth,
    common: zhCommon,
    layout: zhLayout,
    drive: zhDrive,
    filesTable: zhFilesTable,
    moveDialog: zhMoveDialog,
    upload: zhUpload,
    shareModal: zhShareModal,
    shareBanner: zhShareBanner,
    home: zhHome,
    sharePage: zhSharePage,
    dropPage: zhDropPage,
    settings: zhSettings,
  },
}

export type MessageSchema = typeof messages['en']
export type MessageKey = keyof typeof messages
