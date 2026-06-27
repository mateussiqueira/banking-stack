import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { onMounted, watch, nextTick } from 'vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  setup() {
    const { lang } = useData()
    
    onMounted(() => {
      // Initialize mermaid after mount
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
        // Re-render mermaid diagrams on language change
        import('mermaid').then((mermaid) => {
          mermaid.default.run()
        })
      })
    })
  },
}
