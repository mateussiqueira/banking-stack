<template>
  <div v-if="show" class="floating-nav">
    <a v-if="prev" :href="prev.link" class="floating-nav-link prev" :title="prev.text">
      ← {{ prev.text }}
    </a>
    <span class="floating-nav-spacer" />
    <a v-if="next" :href="next.link" class="floating-nav-link next" :title="next.text">
      {{ next.text }} →
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'

interface NavItem { text: string; link: string }

const show = ref(false)
const prev = ref<NavItem | null>(null)
const next = ref<NavItem | null>(null)

onMounted(() => {
  const prevEl = document.querySelector('.doc-footer .prev-next .prev .title') as HTMLElement | null
  const nextEl = document.querySelector('.doc-footer .prev-next .next .title') as HTMLElement | null
  const prevLink = document.querySelector('.doc-footer .prev-next .prev') as HTMLAnchorElement | null
  const nextLink = document.querySelector('.doc-footer .prev-next .next') as HTMLAnchorElement | null

  if (prevEl && prevLink) {
    prev.value = { text: prevEl.textContent || '', link: prevLink.getAttribute('href') || '' }
  }
  if (nextEl && nextLink) {
    next.value = { text: nextEl.textContent || '', link: nextLink.getAttribute('href') || '' }
  }

  if (prev.value || next.value) {
    show.value = true
    const footer = document.querySelector('.VPDocFooter')
    if (footer) (footer as HTMLElement).style.display = 'none'
  }
})
</script>
