import { UserSettings } from '@shared/types/state'
import Store from 'electron-store'

export const settingsDiskStore = new Store<Partial<UserSettings>>({
  name: 'settings'
})
