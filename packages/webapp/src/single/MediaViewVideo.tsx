import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Hammer from 'hammerjs'

import { getHigherPreviewUrl } from '../utils/preview'
import { usePreviewSize } from "./usePreviewSize";
import { classNames } from "../utils/class-names";
import { useVideoSettingsStore } from "../store/view-video-store";

export const MediaViewVideo = (props) => {
  const { media, dispatch } = props
  const { previews } = media;
  const [isPlaying, setIsPlaying] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)
  const gestureOverlay = useRef<HTMLDivElement>(null)
  const previewSize = usePreviewSize()
  const posterUrl = getHigherPreviewUrl(previews, previewSize) || ''
  // Video settings store for persistent volume and muted state
  const volume = useVideoSettingsStore(state => state.volume)
  const muted = useVideoSettingsStore(state => state.muted)
  const playbackRate = useVideoSettingsStore(state => state.playbackRate)
  const setVolume = useVideoSettingsStore(state => state.setVolume)
  const setMuted = useVideoSettingsStore(state => state.setMuted)
  const setPlaybackRate = useVideoSettingsStore(state => state.setPlaybackRate)

  const videoPreview = previews.filter(p => p.match(/video-preview/)).shift()
  const videoUrl = videoPreview ? `files/${videoPreview}` : ''
  const videoMime = videoPreview ? `video/${videoPreview.substring(videoPreview.lastIndexOf('.') + 1).toLowerCase()}` : 'video/mp4'
  useEffect(() => {
    const e: HTMLVideoElement | null = ref.current;
    if (!e) {
      return
    }

    const onPause = () => {
      setIsPlaying(false)
      dispatch({type: 'pause'})
    }
    const onPlay = () => {
      setIsPlaying(true)
      dispatch({type: 'play'})
    }    // Save volume and muted state when they change
    const onVolumeChange = () => {
      setVolume(e.volume)
      setMuted(e.muted)
    }

    // Save playback rate when it changes
    const onRateChange = () => {
      setPlaybackRate(e.playbackRate)
    }

    e.addEventListener('pause', onPause)
    e.addEventListener('play', onPlay)
    e.addEventListener('volumechange', onVolumeChange)
    e.addEventListener('ratechange', onRateChange)

    return () => {
      e.removeEventListener('pause', onPause)
      e.removeEventListener('play', onPlay)
      e.removeEventListener('volumechange', onVolumeChange)
      e.removeEventListener('ratechange', onRateChange)
    }
  }, [ref, setVolume, setMuted, setPlaybackRate])
  useEffect(() => {
    const video: HTMLVideoElement | null = ref.current;
    const overlay: HTMLDivElement | null = gestureOverlay.current;

    if (!overlay || !video) {
      return
    }

    const onSwipeHandler = (ev) => {
      if (!video.paused) {
        return
      }
      ev.preventDefault()

      if (ev.direction === Hammer.DIRECTION_LEFT) {
        dispatch({type: 'next'})
      } else if (ev.direction === Hammer.DIRECTION_RIGHT) {
        dispatch({type: 'prev'})
      }
    }

    const onTapHandler = (ev) => {
      if (!video.paused) {
        return
      }

      ev.preventDefault()

      setIsPlaying(true)
      video.play()
    }

    const mc = new Hammer.Manager(overlay)
    mc.add(new Hammer.Swipe())
    mc.add(new Hammer.Tap());

    mc.on("swipe", onSwipeHandler)
    mc.on("tap", onTapHandler)

    return () => {
      mc.stop(false)
      mc.destroy()
    }  }, [ref, gestureOverlay])

  // Restore video settings when video loads
  useEffect(() => {
    const video: HTMLVideoElement | null = ref.current;
    if (!video) {
      return
    }    const onLoadedMetadata = () => {
      video.volume = volume
      video.muted = muted
      video.playbackRate = playbackRate
      // Auto-start video playback
      video.play().then(() => {
        setIsPlaying(true)
        dispatch({type: 'play'})
      }).catch((error) => {
        // Autoplay might be blocked by browser policy, user will need to manually start
        console.log('Autoplay prevented:', error)
      })
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)

    // Set initial values if video is already loaded
    if (video.readyState >= 1) { // HAVE_METADATA
      video.volume = volume
      video.muted = muted
      video.playbackRate = playbackRate
      // Auto-start video playback for already loaded video
      video.play().then(() => {
        setIsPlaying(true)
        dispatch({type: 'play'})
      }).catch((error) => {
        // Autoplay might be blocked by browser policy, user will need to manually start
        console.log('Autoplay prevented:', error)
      })
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [volume, muted, playbackRate, videoUrl]) // Include videoUrl to re-run when video changes

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        <video ref={ref} controls poster={posterUrl} className="w-full h-full">
          <source src={videoUrl} type={videoMime} />
          No native video element support. Watch video file from <a href={videoUrl}>here</a>
        </video>
        <div ref={gestureOverlay} className={classNames('absolute top-0 left-0 right-0 bottom-14 md:bottom-18', {'hidden': isPlaying})}></div>
      </div>
    </>
  )
}
