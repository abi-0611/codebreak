<template>
  <!--
    The shell — the scroll container, the header, the menu overlay and the
    codec probe — lives in app/layouts/default.vue, not here.
    `app/error.vue` is rendered INSTEAD of this file rather than inside it, and
    a layout is the one place both can reach. See the note there.
  -->
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
