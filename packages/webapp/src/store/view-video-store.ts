import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VideoSettingsStore {
  volume: number
  muted: boolean
  playbackRate: number

  setVolume(volume: number): void
  setMuted(muted: boolean): void
  setPlaybackRate(playbackRate: number): void
}

export const useVideoSettingsStore = create<
  VideoSettingsStore,
  [
    ["zustand/persist", VideoSettingsStore]
  ]
>(persist((set) => ({
  volume: 1.0,
  muted: false,
  playbackRate: 1.0,

  setVolume: (volume: number) => set((state: VideoSettingsStore) => ({...state, volume})),
  setMuted: (muted: boolean) => set((state: VideoSettingsStore) => ({...state, muted})),
  setPlaybackRate: (playbackRate: number) => set((state: VideoSettingsStore) => ({...state, playbackRate})),
}), {
  name: 'gallery-video-settings',
}))
