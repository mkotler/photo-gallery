import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface EditTagStore {
  autoAdvanceAfterTag: boolean

  setAutoAdvanceAfterTag(autoAdvance: boolean): void
}

export const useEditTagStore = create<
  EditTagStore,
  [
    ["zustand/persist", EditTagStore]
  ]
>(persist((set) => ({
  autoAdvanceAfterTag: false,

  setAutoAdvanceAfterTag: (autoAdvanceAfterTag: boolean) => set((state: EditTagStore) => ({...state, autoAdvanceAfterTag})),
}), {
  name: 'gallery-edit-tag-settings',
}))
