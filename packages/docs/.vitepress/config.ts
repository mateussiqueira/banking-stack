import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'Banking Challenges',
  description: 'Desafios técnicos full-stack para fintechs',
  cleanUrls: true,
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#0077B5' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'Banking Challenges — Desafios técnicos para fintechs' }],
    ['meta', { name: 'og:description', content: '14 projetos que simulam problemas reais do mercado financeiro brasileiro. SPI, DICT, ISO 8583, Open Finance, e mais.' }],
    ['meta', { name: 'og:image', content: '/og-image.png' }],
    ['meta', { name: 'og:url', content: 'https://banking-stack-docs.vercel.app' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Banking Challenges' }],
    ['meta', { name: 'twitter:description', content: '14 desafios técnicos para fintechs' }],
    ['meta', { name: 'twitter:image', content: '/og-image.png' }],
    ['meta', { name: 'author', content: 'Mateus Siqueira' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { name: 'keywords', content: 'fintech, banking, pix, spi, dict, iso8583, open finance, typescript, go, docker, graphql' }],
  ],
  
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'dracula'
    }
  },
  
  mermaid: {
    theme: 'dark',
    themeVariables: {
      dark: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#1d4ed8',
        lineColor: '#64748b',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
        background: '#0f172a',
        mainBkg: '#1e293b',
        nodeBorder: '#3b82f6',
        clusterBkg: '#1e293b',
        titleColor: '#f1f5f9',
        edgeLabelBackground: '#1e293b',
        textColor: '#f1f5f9'
      }
    }
  },
  
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
          { text: 'RFCs', link: '/rfc/' },
        ],
        sidebar: {
          '/': [
            {
              text: 'Introdução',
              collapsed: false,
              items: [
                { text: 'O que é', link: '/' },
                { text: 'Como rodar', link: '/guides/getting-started' },
                { text: 'Contribuir', link: '/guides/contribution' },
                { text: 'Testes', link: '/guides/testing' },
              ]
            },
            {
              text: 'Desafios',
              collapsed: false,
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
                { text: '12 — Proxmox', link: '/challenges/12-proxmox' },
                { text: '13 — CI/CD', link: '/challenges/13-cicd' },
                { text: '14 — RFC', link: '/challenges/14-rfc' },
                { text: '15 — PISP', link: '/challenges/15-pisp' },
                { text: '16 — Antecipação', link: '/challenges/16-anticipation' },
                { text: '17 — Fraud Detection', link: '/challenges/17-fraud-detection' },
              ]
            },
            {
              text: 'Decisões',
              collapsed: false,
              items: [
                { text: 'Por que Go?', link: '/decisions/why-go' },
                { text: 'ADR (5 decisões)', link: '/architecture/decision-log' },
                { text: 'Comparação de Stacks', link: '/stack-comparison' },
              ]
            },
            {
              text: 'RFCs',
              collapsed: false,
              items: [
                { text: 'Credit on Pix', link: '/rfc/credit-on-pix' },
                { text: 'Data Lake', link: '/rfc/data-lake' },
                { text: 'Financial Monitoring', link: '/rfc/financial-monitoring' },
              ]
            },
            {
              text: 'Referência',
              collapsed: false,
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
          { text: 'RFCs', link: '/en/rfc/' },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Introduction',
              collapsed: false,
              items: [
                { text: 'What is it', link: '/en/' },
                { text: 'Getting Started', link: '/en/guides/getting-started' },
                { text: 'Contribute', link: '/en/guides/contribution' },
                { text: 'Testing', link: '/en/guides/testing' },
              ]
            },
            {
              text: 'Challenges',
              collapsed: false,
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
                { text: '12 — Proxmox', link: '/en/challenges/12-proxmox' },
                { text: '13 — CI/CD', link: '/en/challenges/13-cicd' },
                { text: '14 — RFC', link: '/en/challenges/14-rfc' },
                { text: '15 — PISP', link: '/en/challenges/15-pisp' },
                { text: '16 — Antecipação', link: '/en/challenges/16-anticipation' },
                { text: '17 — Fraud Detection', link: '/en/challenges/17-fraud-detection' },
              ]
            },
            {
              text: 'Decisions',
              collapsed: false,
              items: [
                { text: 'Why Go?', link: '/en/decisions/why-go' },
                { text: 'ADR (5 decisions)', link: '/en/architecture/decision-log' },
                { text: 'Stack Comparison', link: '/en/stack-comparison' },
              ]
            },
            {
              text: 'RFCs',
              collapsed: false,
              items: [
                { text: 'Credit on Pix', link: '/en/rfc/credit-on-pix' },
                { text: 'Data Lake', link: '/en/rfc/data-lake' },
                { text: 'Financial Monitoring', link: '/en/rfc/financial-monitoring' },
              ]
            },
            {
              text: 'Reference',
              collapsed: false,
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
    logo: '/logo.svg',
    siteTitle: 'Banking Challenges',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mateussiqueira/banking-stack' }
    ],
    
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Buscar',
            buttonAriaLabel: 'Buscar'
          },
          modal: {
            displayDetails: 'Mostrar detalhes',
            resetButtonTitle: 'Limpar busca',
            backButtonTitle: 'Voltar',
            noResultsText: 'Nenhum resultado encontrado',
            footer: {
              selectText: 'selecionar',
              navigateText: 'navegar',
              closeText: 'fechar'
            }
          }
        }
      }
    },
    
    editLink: {
      pattern: 'https://github.com/mateussiqueira/banking-stack/edit/main/packages/docs/:path',
      text: 'Editar esta página'
    },
    
    lastUpdated: {
      text: 'Última atualização'
    },
    
    docFooter: {
      prev: 'Página anterior',
      next: 'Próxima página'
    },
    
    outline: {
      label: 'Nesta página'
    },
    
    returnToTopLabel: 'Voltar ao topo',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Tema',
    lightModeSwitchTitle: 'Modo claro',
    darkModeSwitchTitle: 'Modo escuro',
    systemModeSwitchTitle: 'Modo sistema'
  }
}))
