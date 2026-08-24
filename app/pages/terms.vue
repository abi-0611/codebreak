<script setup lang="ts">
import { terms } from '~/content/legal'

/**
 * `/terms` — phase 7, route 7. The whole page is <Notice/>; `/privacy` is the
 * same component with the other document. See the note there.
 */
usePageHead(terms.meta)
</script>

<template>
  <Notice :doc="terms" />
</template>
