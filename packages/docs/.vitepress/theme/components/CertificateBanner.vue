<template>
  <div v-if="show" class="certificate-banner">
    <div class="cert-icon">B</div>
    <div class="cert-text">
      <strong>Parabens! Voce completou todos os desafios.</strong>
      <span>Gere seu certificado de conclusao.</span>
    </div>
    <button @click="generateCertificate" class="cert-btn">Gerar Certificado</button>
    <button @click="dismiss" class="cert-dismiss">x</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadState, getLevelTitle, getLevel, CHALLENGES } from '../data/gamification'

const show = ref(false)

onMounted(() => {
  try {
    if (sessionStorage.getItem('bc_cert_dismissed')) return
  } catch {}
  const state = loadState()
  if (state.completedChallenges.length >= CHALLENGES.length) {
    show.value = true
  }
})

function dismiss() {
  show.value = false
  try { sessionStorage.setItem('bc_cert_dismissed', '1') } catch {}
}

function generateCertificate() {
  const state = loadState()
  const level = getLevel(state.xp)
  const title = getLevelTitle(level)
  const date = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificado</title><style>
    @page { size: landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; }
    .cert { width: 1000px; padding: 60px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid #3b82f6; border-radius: 16px; text-align: center; color: #f1f5f9; }
    .cert h1 { font-size: 2.5rem; font-weight: 800; color: #3b82f6; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
    .cert h2 { font-size: 1.4rem; font-weight: 600; color: #94a3b8; margin-bottom: 2rem; }
    .cert .name { font-size: 2rem; font-weight: 700; margin: 1.5rem 0 0.5rem; }
    .cert .desc { font-size: 1.1rem; color: #94a3b8; line-height: 1.6; max-width: 650px; margin: 0 auto 2rem; }
    .cert .stats { display: flex; justify-content: center; gap: 3rem; margin: 2rem 0; }
    .cert .stat { text-align: center; }
    .cert .stat-num { font-size: 2rem; font-weight: 800; color: #3b82f6; }
    .cert .stat-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .cert .footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #334155; font-size: 0.8rem; color: #64748b; }
    @media print { body { background: #0f172a; } }
  </style></head><body><div class="cert">
    <h1>Banking Challenges</h1>
    <h2>Certificado de Conclusao</h2>
    <p class="desc">Este certificado comprova que o portador completou todos os 17 desafios do Banking Challenges, demonstrando dominio em sistemas financeiros modernos — de ledger contabil a deteccao de fraude, de ISO 8583 a Open Finance.</p>
    <div class="stats">
      <div class="stat"><div class="stat-num">${CHALLENGES.length}</div><div class="stat-label">Desafios</div></div>
      <div class="stat"><div class="stat-num">${level}</div><div class="stat-label">Nivel</div></div>
      <div class="stat"><div class="stat-num">${state.xp}</div><div class="stat-label">XP</div></div>
      <div class="stat"><div class="stat-num">${state.achievements.length}</div><div class="stat-label">Conquistas</div></div>
    </div>
    <p class="name">${title}</p>
    <div class="footer">Emitido em ${date} · banking-stack.vercel.app</div>
  </div></body></html>`

  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }
}
</script>
