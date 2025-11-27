import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Archevi Documentation',
  description: 'Your family\'s AI-powered memory - privately stored, instantly accessible, and 90% cheaper than alternatives',
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
      { text: 'Use Cases', link: '/use-cases/' },
      { text: 'Comparison', link: '/comparison/' },
      { text: 'API', link: '/api/' },
      { text: 'Pricing', link: '/pricing/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Managed Service', link: '/guide/managed-service' },
            { text: 'Usage', link: '/guide/usage' },
            { text: 'FAQ', link: '/guide/faq' }
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

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Windmill Endpoints', link: '/api/windmill-endpoints' },
            { text: 'Frontend API', link: '/api/frontend-api' },
            { text: 'Component API', link: '/api/components/' }
          ]
        }
      ],

      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Getting Started', link: '/contributing/' },
            { text: 'Architecture', link: '/contributing/architecture' },
            { text: 'Development Setup', link: '/contributing/development' },
            { text: 'Code Standards', link: '/contributing/code-standards' }
          ]
        }
      ],

      '/pricing/': [
        {
          text: 'Pricing',
          items: [
            { text: 'Overview', link: '/pricing/' },
            { text: 'Self-Hosted', link: '/pricing/self-hosted' },
            { text: 'Managed Service', link: '/pricing/managed' }
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

    editLink: {
      pattern: 'https://github.com/robhdsndsn/Archevi/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the Apache 2.0 License.',
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
