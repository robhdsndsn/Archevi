import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Archevi Documentation',
  description: 'Your family\'s AI-powered memory - private, isolated, and powered by your own AI',
  base: '/Archevi/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'Archevi' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Archevi',

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Architecture', link: '/architecture/multi-tenant-design' },
      { text: 'Use Cases', link: '/use-cases/' },
      { text: 'Pricing', link: '/pricing/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Using Archevi', link: '/guide/usage' },
            { text: 'BYOK Setup (Optional)', link: '/guide/byok-setup' },
            { text: 'FAQ', link: '/guide/faq' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Windmill Endpoints', link: '/api/windmill-endpoints' },
            { text: 'Frontend API', link: '/api/frontend-api' }
          ]
        }
      ],

      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Multi-Tenant Design', link: '/architecture/multi-tenant-design' },
            { text: 'API Key Management', link: '/architecture/api-key-management' }
          ]
        }
      ],

      '/use-cases/': [
        {
          text: 'Use Cases',
          items: [
            { text: 'Overview', link: '/use-cases/' },
            { text: 'Medical Records', link: '/use-cases/medical-records' },
            { text: 'Recipes', link: '/use-cases/recipes' },
            { text: 'Estate Planning', link: '/use-cases/estate-planning' },
            { text: 'Financial Documents', link: '/use-cases/financial' },
            { text: 'Family History', link: '/use-cases/family-history' }
          ]
        }
      ],

      '/comparison/': [
        {
          text: 'Comparisons',
          items: [
            { text: 'Overview', link: '/comparison/' },
            { text: 'vs Notion', link: '/comparison/notion' },
            { text: 'vs Obsidian', link: '/comparison/obsidian' },
            { text: 'vs Google Drive', link: '/comparison/google-drive' }
          ]
        }
      ],

      '/pricing/': [
        {
          text: 'Pricing',
          items: [
            { text: 'Plans & Pricing', link: '/pricing/' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/robhdsndsn/Archevi' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Canadian-hosted. PIPEDA compliant. Your data stays yours.',
      copyright: 'Copyright 2025-present Archevi'
    },

    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    }
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
