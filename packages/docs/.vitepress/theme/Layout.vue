<script setup>
import DefaultTheme from 'vitepress/theme'
import SidebarProgress from './components/SidebarProgress.vue'
import AchievementToast from './components/AchievementToast.vue'
import FlashcardReview from './components/FlashcardReview.vue'
import ExportNotes from './components/ExportNotes.vue'
import CertificateBanner from './components/CertificateBanner.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #sidebar-nav-before>
      <SidebarProgress />
    </template>
  </Layout>
  <AchievementToast />
  <ExportNotes />
  <CertificateBanner />
</template>
