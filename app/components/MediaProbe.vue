<script setup lang="ts">
/**
 * Runs the codec probe once at boot and parks the result in a composable.
 * The element is a measuring instrument, not content: no copy, no focus, and
 * nothing for assistive technology to announce.
 */
const support = useMediaSupport()
const el = ref<HTMLVideoElement | null>(null)

onMounted(async () => {
  const node = el.value
  if (!node) return

  const offers = (type: string) => node.canPlayType(type) !== ''
  support.value.mp4 = offers('video/mp4; codecs="avc1.42E01E"')
  support.value.webm = offers('video/webm; codecs="vp9"')

  // canPlayType is a promise, not a receipt. Ask the decoder to actually start.
  try {
    node.muted = true
    await node.play()
    node.pause()
    support.value.autoplay = true
  } catch {
    support.value.autoplay = false
  }

  support.value.checked = true
})
</script>

<template>
  <video
    id="probe"
    ref="el"
    class="fixed invisible"
    :src="PROBE_CLIP"
    width="1"
    height="1"
    muted
    playsinline
    preload="auto"
    disableremoteplayback
    aria-hidden="true"
    tabindex="-1"
  />
</template>
