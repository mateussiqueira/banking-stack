// load-test.js
// Teste de carga para SPI Simulator
//
// Rodar:
//   k6 run load-test.js
//
// Com métricas JSON:
//   k6 run --out json=results.json load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ==================== MÉTRICAS CUSTOMIZADAS ====================

const transacoesAceitas = new Counter('transacoes_aceitas');
const transacoesRejeitadas = new Counter('transacoes_rejeitadas');
const taxaSucesso = new Rate('taxa_sucesso');
const latenciaTransacao = new Trend('latencia_transacao', true);

// ==================== CONFIGURAÇÃO ====================

export const options = {
  // Cenários de teste
  scenarios: {
    // Cenário 1: Load test gradual
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },   // Ramp up
        { duration: '30s', target: 50 },   // Carga constante
        { duration: '10s', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '10s',
    },
  },

  // Thresholds (limites aceitáveis)
  thresholds: {
    // Latência
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    
    // Erros
    'http_req_failed': ['rate<0.05'],
    
    // Throughput
    'http_reqs': ['rate>50'],
    
    // Métricas customizadas
    'taxa_sucesso': ['rate>0.95'],
  },
};

// ==================== URL BASE ====================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9090';

// ==================== FUNÇÃO PRINCIPAL ====================

export default function () {
  const endToEndId = `E2E${Date.now()}${__VU}${__ITER}`;
  
  const payload = JSON.stringify({
    endToEndId: endToEndId,
    valor: Math.random() * 10000,
    ispbOrigem: '00000000',
    ispbDestino: '60701190',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  // ==================== PROCESSAR TRANSAÇÃO ====================
  const start = Date.now();
  const res = http.post(`${BASE_URL}/spi/pacs.008`, payload, params);
  const duration = Date.now() - start;
  
  // Registrar métricas
  latenciaTransacao.add(duration);
  
  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has transacao': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.sucesso === true;
      } catch {
        return false;
      }
    },
  });
  
  if (success) {
    transacoesAceitas.add(1);
    taxaSucesso.add(1);
  } else {
    transacoesRejeitadas.add(1);
    taxaSucesso.add(0);
  }
  
  // ==================== HEALTH CHECK (10% das requisições) ====================
  if (Math.random() < 0.1) {
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health status is 200': (r) => r.status === 200,
    });
  }
  
  sleep(0.05); // 50ms entre requests
}

// ==================== SETUP ====================

export function setup() {
  console.log('=== Iniciando teste de carga ===');
  console.log(`Target: ${BASE_URL}`);
  
  // Verificar se servidor está rodando
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    throw new Error(`Servidor não está rodando em ${BASE_URL}`);
  }
  
  console.log('Servidor OK!');
  return { startTime: Date.now() };
}

// ==================== TEARDOWN ====================

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n=== Teste concluído em ${duration.toFixed(1)}s ===`);
}

// ==================== RESUMO ====================

export function handleSummary(data) {
  const { metrics } = data;
  
  const summary = {
    'summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
  
  return summary;
}

function textSummary(data) {
  const { metrics } = data;
  
  let output = '\n';
  output += '╔══════════════════════════════════════════════════════════════╗\n';
  output += '║              RESUMO DO TESTE DE CARGA                      ║\n';
  output += '╠══════════════════════════════════════════════════════════════╣\n';
  output += '║                                                            ║\n';
  
  // Requisições
  output += `║  Requisições totais:    ${String(metrics.http_reqs.values.count).padStart(10)}                ║\n`;
  output += `║  Requisições/s:         ${metrics.http_reqs.values.rate.toFixed(2).padStart(10)}                ║\n`;
  output += '║                                                            ║\n';
  
  // Latência
  output += '║  LATÊNCIA                                                           ║\n';
  output += `║    Média:               ${metrics.http_req_duration.values.avg.toFixed(2).padStart(8)}ms              ║\n`;
  output += `║    P95:                 ${metrics.http_req_duration.values['p(95)'].toFixed(2).padStart(8)}ms              ║\n`;
  output += `║    P99:                 ${metrics.http_req_duration.values['p(99)'].toFixed(2).padStart(8)}ms              ║\n`;
  output += `║    Max:                 ${metrics.http_req_duration.values.max.toFixed(2).padStart(8)}ms              ║\n`;
  output += '║                                                            ║\n';
  
  // Erros
  output += '║  ERROS                                                                ║\n';
  output += `║    Taxa de erro:        ${(metrics.http_req_failed.values.rate * 100).toFixed(2).padStart(8)}%               ║\n`;
  output += '║                                                            ║\n';
  
  // Métricas customizadas
  if (metrics.transacoesAceitas) {
    output += '║  TRANSAÇÕES                                                           ║\n';
    output += `║    Aceitas:             ${String(metrics.transacoesAceitas.values.count).padStart(10)}                ║\n`;
    output += `║    Rejeitadas:          ${String(metrics.transacoesRejeitadas.values.count).padStart(10)}                ║\n`;
    output += `║    Taxa de sucesso:     ${(metrics.taxa_sucesso.values.rate * 100).toFixed(2).padStart(8)}%               ║\n`;
    output += '║                                                            ║\n';
  }
  
  // Throughput
  output += '║  THROUGHPUT                                                          ║\n';
  output += `║    Dados recebidos:     ${(metrics.data_received.values.count / 1024 / 1024).toFixed(2).padStart(8)} MB            ║\n`;
  output += `║    Dados enviados:      ${(metrics.data_sent.values.count / 1024 / 1024).toFixed(2).padStart(8)} MB            ║\n`;
  output += '║                                                            ║\n';
  
  // Avaliação
  const p95 = metrics.http_req_duration.values['p(95)'];
  const errorRate = metrics.http_req_failed.values.rate * 100;
  
  output += '╠══════════════════════════════════════════════════════════════╣\n';
  
  if (p95 < 500 && errorRate < 5) {
    output += '║  ✅ APROVADO - Performance dentro do esperado              ║\n';
  } else {
    output += '║  ❌ REPROVADO - Performance abaixo do esperado             ║\n';
  }
  
  output += '╚══════════════════════════════════════════════════════════════╝\n';
  
  return output;
}
