import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted, latin subset only, weights we actually set. No Google Fonts
// request sits in front of first paint — we have a 2.5s LCP budget on 4G.
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'

import App from '@/App'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
