import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Banking Challenges',
  description: 'Desafios técnicos full-stack para fintechs',
  
  locales: {
    root: {
      label: 'Português',
      lang: 'pt-BR',
      themeConfig: {
        nav: [
          { text: 'Início', link: '/' },
          { text: 'Desafios', link: '/challenges/' },
          { text: 'Arquitetura', link: '/architecture/' },
          { text: 'Guias', link: '/guides/' },
        ],
        sidebar: {
          '/': [
            {
              text: 'Introdução',
              items: [
                { text: 'O que é', link: '/' },
                { text: 'Como rodar', link: '/getting-started' },
              ]
            },
            {
              text: 'Desafios',
              items: [
                { text: '01 — Ledger GraphQL', link: '/challenges/01-ledger' },
                { text: '02 — SPI Simulator', link: '/challenges/02-spi' },
                { text: '03 — DICT Simulator', link: '/challenges/03-dict' },
                { text: '04 — ISO 8583', link: '/challenges/04-iso8583' },
                { text: '05 — Workflow Engine', link: '/challenges/05-workflow' },
                { text: '06 — Open Finance', link: '/challenges/06-open-finance' },
                { text: '07 — NFS-e', link: '/challenges/07-nfse' },
                { text: '08 — Report System', link: '/challenges/08-report' },
                { text: '09 — Leaky Bucket', link: '/challenges/09-leaky-bucket' },
                { text: '10 — Landing Page', link: '/challenges/10-landing-page' },
                { text: '11 — KYC System', link: '/challenges/11-kyc' },
              ]
            },
            {
              text: 'Decisões',
              items: [
                { text: 'Por que Go?', link: '/decisions/why-go' },
                { text: 'Comparação de Stacks', link: '/stack-comparison' },
              ]
            },
            {
              text: 'Referência',
              items: [
                { text: 'API Reference', link: '/api-reference' },
                { text: 'Deploy', link: '/guides/deployment' },
                { text: 'Changelog', link: '/changelog' },
              ]
            }
          ]
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Challenges', link: '/en/challenges/' },
          { text: 'Architecture', link: '/en/architecture/' },
          { text: 'Guides', link: '/en/guides/' },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Introduction',
              items: [
                { text: 'What is it', link: '/en/' },
                { text: 'Getting Started', link: '/en/getting-started' },
              ]
            },
            {
              text: 'Challenges',
              items: [
                { text: '01 — Ledger GraphQL', link: '/en/challenges/01-ledger' },
                { text: '02 — SPI Simulator', link: '/en/challenges/02-spi' },
                { text: '03 — DICT Simulator', link: '/en/challenges/03-dict' },
                { text: '04 — ISO 8583', link: '/en/challenges/04-iso8583' },
                { text: '05 — Workflow Engine', link: '/en/challenges/05-workflow' },
                { text: '06 — Open Finance', link: '/en/challenges/06-open-finance' },
                { text: '07 — NFS-e', link: '/en/challenges/07-nfse' },
                { text: '08 — Report System', link: '/en/challenges/08-report' },
                { text: '09 — Leaky Bucket', link: '/en/challenges/09-leaky-bucket' },
                { text: '10 — Landing Page', link: '/en/challenges/10-landing-page' },
                { text: '11 — KYC System', link: '/en/challenges/11-kyc' },
              ]
            },
            {
              text: 'Decisions',
              items: [
                { text: 'Why Go?', link: '/en/decisions/why-go' },
                { text: 'Stack Comparison', link: '/en/stack-comparison' },
              ]
            },
            {
              text: 'Reference',
              items: [
                { text: 'API Reference', link: '/en/api-reference' },
                { text: 'Deployment', link: '/en/guides/deployment' },
                { text: 'Changelog', link: '/en/changelog' },
              ]
            }
          ]
        }
      }
    }
  },
  
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mateussiqueira/banking-stack' }
    ],
    
    search: {
      provider: 'local'
    }
  }
})
