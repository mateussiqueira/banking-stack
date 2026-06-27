import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { onMounted, watch, nextTick } from 'vue'
import LanguageToggle from './components/LanguageToggle.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LanguageToggle', LanguageToggle)
  },
  setup() {
    const { lang } = useData()
    
    onMounted(() => {
      import('mermaid').then((mermaid) => {
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        })
      })
    })

    watch(lang, () => {
      nextTick(() => {
        import('mermaid').then((mermaid) => {
          mermaid.default.run()
        })
      })
    })
  },
}
