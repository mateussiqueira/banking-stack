// stress-test.js
// Teste de estresse para SPI Simulator
//
// Rodar:
//   k6 run stress-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const transacoesAceitas = new Counter('transacoes_aceitas');
const transacoesRejeitadas = new Counter('transacoes_rejeitadas');
const taxaSucesso = new Rate('taxa_sucesso');

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 200 },  // Subir para 200 VUs
        { duration: '5m', target: 200 },  // Manter estresse
        { duration: '2m', target: 0 },    // Descer
      ],
      gracefulRampDown: '1m',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.10'],
    'taxa_sucesso': ['rate>0.90'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9090';

export default function () {
  const endToEndId = `STRESS${Date.now()}${__VU}${__ITER}`;
  
  const payload = JSON.stringify({
    endToEndId: endToEndId,
    valor: Math.random() * 50000,
    ispbOrigem: '00000000',
    ispbDestino: '60701190',
  });
  
  const res = http.post(`${BASE_URL}/spi/pacs.008`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });
  
  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  if (success) {
    transacoesAceitas.add(1);
    taxaSucesso.add(1);
  } else {
    transacoesRejeitadas.add(1);
    taxaSucesso.add(0);
  }
  
  sleep(0.02); // 20ms entre requests (mais agressivo)
}

export function setup() {
  console.log('=== Stress Test ===');
  console.log(`Target: ${BASE_URL}`);
  
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    throw new Error('Servidor não está rodando');
  }
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\nStress test concluído em ${duration.toFixed(1)}s`);
}
