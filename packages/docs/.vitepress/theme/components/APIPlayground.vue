<template>
  <div class="api-playground">
    <div class="ap-header" @click="open = !open">
      <span>API Playground</span>
      <span class="ap-toggle">{{ open ? 'Fechar' : 'Abrir' }}</span>
    </div>
    <Transition name="checkpoint">
      <div v-if="open" class="ap-body">
        <div class="ap-controls">
          <select v-model="method" class="ap-select">
            <option v-for="m in ['GET','POST','PUT','DELETE']" :key="m" :value="m">{{ m }}</option>
          </select>
          <input v-model="url" class="ap-url" placeholder="http://localhost:3001/graphql" />
          <button @click="send" :disabled="loading" class="ap-send">Enviar</button>
        </div>

        <div v-if="method !== 'GET'" class="ap-body-input">
          <textarea v-model="body" placeholder='{"query": "{ accounts(first: 10) { edges { node { name balance } } } }" }' rows="6" />
          <div class="ap-headers">
            <input v-model="headerKey" placeholder="Header" class="ap-header-key" />
            <input v-model="headerVal" placeholder="Value" class="ap-header-val" />
            <button @click="addHeader" class="ap-add-header">+</button>
          </div>
          <div v-for="(v, k) in headers" :key="k" class="ap-header-tag">
            {{ k }}: {{ v }} <button @click="removeHeader(k)" class="ap-remove">x</button>
          </div>
        </div>

        <div v-if="loading" class="ap-loading">Enviando...</div>

        <div v-if="response" class="ap-response">
          <div class="ap-resp-header">
            <span :class="'ap-status ' + (response.status < 400 ? 'ok' : 'err')">{{ response.status }}</span>
            <span class="ap-time">{{ response.time }}ms</span>
          </div>
          <pre class="ap-resp-body">{{ response.body }}</pre>
        </div>

        <div v-if="error" class="ap-error">{{ error }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const method = ref('GET')
const url = ref('http://localhost:3001/graphql')
const body = ref('')
const headers = ref<Record<string, string>>({})
const headerKey = ref('')
const headerVal = ref('')
const loading = ref(false)
const response = ref<{ status: number; time: number; body: string } | null>(null)
const error = ref('')

function addHeader() {
  if (headerKey.value.trim()) {
    headers.value[headerKey.value.trim()] = headerVal.value.trim()
    headerKey.value = ''
    headerVal.value = ''
  }
}

function removeHeader(key: string) {
  delete headers.value[key]
}

async function send() {
  loading.value = true
  response.value = null
  error.value = ''
  const start = performance.now()

  try {
    const opts: RequestInit = {
      method: method.value,
      headers: { 'Content-Type': 'application/json', ...headers.value },
    }
    if (method.value !== 'GET' && body.value.trim()) {
      opts.body = body.value
    }
    const res = await fetch(url.value, opts)
    const text = await res.text()
    const time = Math.round(performance.now() - start)
    response.value = {
      status: res.status,
      time,
      body: text.slice(0, 5000) + (text.length > 5000 ? '\n...truncated' : ''),
    }
  } catch (e: any) {
    error.value = e.message || 'Erro de conexao. O servidor esta rodando?'
  } finally {
    loading.value = false
  }
}
</script>
