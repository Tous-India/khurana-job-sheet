import type { MetadataRoute } from 'next'

/**
 * Installs to the phone home screen so the engineer opens it like an app,
 * without a browser chrome or a URL to type (README 13, Phase 8).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Khurana Electronics — Job Sheet',
    short_name: 'KE Job Sheet',
    description:
      'Digital job sheet for Khurana Electronics field engineers, Sonipat.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#1e40af',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
