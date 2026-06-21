import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'pt-BR',
  ignoreDeadLinks: true,
  title: 'Banking Challenges',
  description: 'Full-stack fintech technical challenges monorepo',
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#7c3aed' }],
    ['meta', { property: 'og:title', content: 'Banking Challenges' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Monorepo de desafios técnicos full-stack para fintechs — SPI, DICT, Ledger, Open Finance e mais.',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Banking Challenges',

    nav: [
      { text: 'Início', link: '/' },
      { text: 'Arquitetura', link: '/architecture/overview' },
      { text: 'Desafios', link: '/challenges/01-ledger' },
      { text: 'Guias', link: '/guides/getting-started' },
      { text: 'RFCs', link: '/rfc/credit-on-pix' },
    ],

    sidebar: {
      '/architecture/': [
        {
          text: 'Arquitetura',
          items: [
            { text: 'Visão Geral', link: '/architecture/overview' },
            { text: 'Decisões (ADR)', link: '/architecture/decision-log' },
          ],
        },
      ],

      '/challenges/': [
        {
          text: 'Backend',
          items: [
            { text: '01 — Ledger (GraphQL Relay)', link: '/challenges/01-ledger' },
            { text: '02 — SPI Simulator (ISO 20022)', link: '/challenges/02-spi' },
            { text: '03 — DICT Simulator', link: '/challenges/03-dict' },
            { text: '04 — ISO 8583 Simulator', link: '/challenges/04-iso8583' },
            { text: '05 — Workflow Engine', link: '/challenges/05-workflow' },
            { text: '06 — Open Finance', link: '/challenges/06-open-finance' },
            { text: '07 — NFS-e Integration', link: '/challenges/07-nfse' },
            { text: '08 — Report System', link: '/challenges/08-report' },
            { text: '09 — Leaky Bucket', link: '/challenges/09-leaky-bucket' },
          ],
        },
        {
          text: 'Frontend',
          items: [
            { text: '10 — Landing Page + DS', link: '/challenges/10-landing-page' },
            { text: '11 — KYC System', link: '/challenges/11-kyc' },
          ],
        },
        {
          text: 'DevOps',
          items: [
            { text: '12 — Proxmox', link: '/challenges/12-proxmox' },
            { text: '13 — CI/CD', link: '/challenges/13-cicd' },
          ],
        },
        {
          text: 'Arquitetura',
          items: [
            { text: '14 — RFC Architecture', link: '/challenges/14-rfc' },
          ],
        },
      ],

      '/guides/': [
        {
          text: 'Guias',
          items: [
            { text: 'Introdução', link: '/guides/getting-started' },
            { text: 'Contribuição', link: '/guides/contribution' },
            { text: 'Deploy', link: '/guides/deployment' },
            { text: 'Testes', link: '/guides/testing' },
          ],
        },
      ],

      '/rfc/': [
        {
          text: 'RFCs',
          items: [
            { text: 'Crédito sobre Pix', link: '/rfc/credit-on-pix' },
            { text: 'Data Lake', link: '/rfc/data-lake' },
            { text: 'Monitoramento Financeiro', link: '/rfc/financial-monitoring' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/banking-challenges' },
    ],

    footer: {
      message: 'Distribuído sob licença MIT.',
      copyright: '© Banking Challenges',
    },

    editLink: {
      pattern: 'https://github.com/your-org/banking-challenges/edit/main/packages/docs/src/:path',
    },

    search: {
      provider: 'local',
    },
  },
})
