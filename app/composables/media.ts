/**
 * Codec capability probe — teardown §9.
 *
 * The reference boots with a `<video>` carrying a tiny inline base64 MP4 and
 * checks it once, rather than trusting `canPlayType` alone: Safari reports
 * "maybe" for H.264 while low-power mode is silently refusing to start
 * playback, and every autoplay policy on mobile is a runtime fact, not a
 * declared capability.
 *
 * Phase 5 reads the result to decide between a looping clip and a still frame
 * for the link tiles and the pinned scene. Rule 9: a scene that cannot play is
 * a scene that must not be downloaded.
 */
export type MediaSupport = {
  /** H.264 baseline in an MP4 wrapper. */
  mp4: boolean
  /** VP9 in a WebM wrapper. */
  webm: boolean
  /** Muted inline playback actually started, rather than merely being offered. */
  autoplay: boolean
  /** False until the probe has run; server-side this is always false. */
  checked: boolean
}

export const useMediaSupport = () =>
  useState<MediaSupport>('media-support', () => ({
    mp4: false,
    webm: false,
    autoplay: false,
    checked: false,
  }))

/**
 * 808 bytes: one 16x16 black frame, H.264 baseline, no audio, no encoder SEI.
 * Generated offline with ffmpeg; it exists to be decoded, never to be seen.
 */
export const PROBE_CLIP =
  'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAALqbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAAGQAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAjl0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAGQAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAABAAAAAQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAABkAAAAAAABAAAAAAGxbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAoAAAABABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABXG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAARxzdGJsAAAAuHN0c2QAAAAAAAAAAQAAAKhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAABAAEABIAAAASAAAAAAAAAABDExhdmMgbGlieDI2NAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALmF2Y0MBQsAe/+EAFmdCwB7ZHsBEAAADAAQAAAMAUDxYuSABAAVoy4PLIAAAABBwYXNwAAAAAQAAAAEAAAAUYnRydAAAAAAAAARgAAAAAAAAABhzdHRzAAAAAAAAAAEAAAABAAAEAAAAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAUc3RzegAAAAAAAAAOAAAAAQAAABRzdGNvAAAAAAAAAAEAAAMaAAAAPXVkdGEAAAA1bWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAIaWxzdAAAAAhmcmVlAAAAFm1kYXQAAAAKZYiEDfJigAC2/g=='
