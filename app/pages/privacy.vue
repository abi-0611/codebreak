<script setup lang="ts">
import { privacy } from '~/content/legal'

/**
 * `/privacy` — phase 7, route 6. The whole page is <Notice/>; `/terms` is the
 * same component with the other document. See the note there.
 */
usePageHead(privacy.meta)
</script>

<template>
  <Notice :doc="privacy" />
</template>
