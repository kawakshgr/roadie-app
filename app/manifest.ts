import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Roadie — gestion de tournée',
    short_name: 'Roadie',
    description: 'Gère tes tournées, dates et invitations',
    start_url: '/groupes',
    display: 'standalone',
    background_color: '#0a0a14',
    theme_color: '#0a0a14',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}