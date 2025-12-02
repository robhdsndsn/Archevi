import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      resizeOptions: {
        background: '#3b82f6' // Archevi blue
      }
    },
    apple: {
      sizes: [180],
      resizeOptions: {
        background: '#ffffff'
      }
    }
  },
  images: ['public/logo.svg']
})
