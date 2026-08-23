<template>
  <!--
    The touch scroll container. Teardown §3: the reference gives coarse
    pointers their own fixed, scrollable box rather than letting the document
    scroll, which is what keeps Lenis and the pinned scene stable on iOS.
    Retrofitting it later breaks the pin, so it exists from the first commit.
  -->
  <div class="has-not-hover:fixed has-not-hover:inset-0 has-not-hover:overflow-y-auto">
    <NuxtRouteAnnouncer />
    <SiteHeader />
    <NuxtPage />
    <SiteMenu />
    <MediaProbe />
  </div>
</template>
