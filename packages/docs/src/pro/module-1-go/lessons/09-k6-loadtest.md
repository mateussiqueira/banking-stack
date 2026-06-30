# Aula 09: Testes de Carga com k6

**Duração:** 55 minutos
**Pré-requisitos:** Aulas 01-08
**Objetivo:** Estressar e validar serviços Go com testes de carga realistas.

---

## 📋 Objetivos de Aprendizagem

1. Entender métricas de performance (RPS, latência, erros)
2. Instalar e configurar k6
3. Criar scripts de teste de carga
4. Simular race conditions sob pressão
5. Validar throughput em serviços financeiros

---

## 1. Métricas de Performance

### Indicadores-chave

| Métrica | O que mede | Meta típica |
|---------|------------|-------------|
| **RPS** | Requisições por segundo | > 1000 |
| **Latência P95** | 95% das requisições abaixo de | < 100ms |
| **Latência P99** | 99% das requisições abaixo de | < 500ms |
| **Taxa de Erro** | Requisições com erro | < 1% |
| **Throughput** | Dados transferidos por segundo | Variável |

### Por que isso importa em FinTech?

```
PIX: 10.000 transações/segundo
SPI: 1.000 liquidações/segundo
HFT: 1.000.000 ordens/segundo

Se seu serviço aguenta 100 RPS, ele vai cair em produção!
```

---

## 2. Instalando k6

### Mac

```bash
brew install k6
```

### Linux

```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Verificar

```bash
k6 version
# Saída: k6 v0.49.0
```

---

## 3. Estrutura de um Script k6

### Script básico

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp up
    { duration: '30s', target: 50 },   // Carga constante
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% < 200ms
    http_req_failed: ['rate<0.01'],    // < 1% erros
  },
};

export default function () {
  const res = http.get('http://localhost:8080/health');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(0.1); // 100ms entre requests
}
```

---

## 4. Tipos de Teste

### Ramp Up/Down (subida/descida gradual)

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Subir para 100 VUs
    { duration: '5m', target: 100 },  // Manter 100 VUs
    { duration: '1m', target: 0 },    // Descer para 0
  ],
};
```

### Stress Test (estresse)

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 200 },  // Subir rápido
    { duration: '5m', target: 200 },  // Manter
    { duration: '2m', target: 0 },    // Descer
  ],
};
```

### Spike Test (pico)

```javascript
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Normal
    { duration: '5s', target: 1000 },  // PICO!
    { duration: '30s', target: 10 },   // Volta ao normal
  ],
};
```

### Soak Test (resistência)

```javascript
export const options = {
  stages: [
    { duration: '5m', target: 50 },   // Ramp up
    { duration: '2h', target: 50 },   // Manter por 2 horas
    { duration: '5m', target: 0 },    // Ramp down
  ],
};
```

---

## 5. Exercício Prático: Load Test SPI

### Objetivo

Testar o SPI Simulator com múltiplos cenários de carga.

### Solução

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Métricas customizadas
const transacoesAceitas = new Counter('transacoes_aceitas');
const transacoesRejeitadas = new Counter('transacoes_rejeitadas');
const taxaSucesso = new Rate('taxa_sucesso');
const latenciaTransacao = new Trend('latencia_transacao');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up
    { duration: '1m', target: 50 },    // Carga constante
    { duration: '30s', target: 100 },  // Pico
    { duration: '1m', target: 50 },    // Estabilizar
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    taxa_sucesso: ['rate>0.95'],
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  const endToEndId = `E2E${Date.now()}${__VU}`;
  
  const payload = JSON.stringify({
    endToEndId: endToEndId,
    amount: Math.random() * 10000,
    creditorIspb: '60701190',
    creditorName: 'João Silva',
    debtorIspb: '00000000',
    debtorName: 'Maria Santos',
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  // Processar transação
  const start = Date.now();
  const res = http.post(`${BASE_URL}/spi/pacs.008`, payload, params);
  const duration = Date.now() - start;
  
  // Registrar métricas
  latenciaTransacao.add(duration);
  
  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has endToEndId': (r) => JSON.parse(r.body).endToEndId !== undefined,
  });
  
  if (success) {
    transacoesAceitas.add(1);
    taxaSucesso.add(1);
  } else {
    transacoesRejeitadas.add(1);
    taxaSucesso.add(0);
  }
  
  sleep(0.05); // 50ms entre requests
}

export function handleSummary(data) {
  const { metrics } = data;
  
  return {
    'summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  
  let summary = '\n=== Resumo do Teste de Carga ===\n\n';
  summary += `Requisições totais: ${metrics.http_reqs.values.count}\n`;
  summary += `Requisições/s: ${metrics.http_reqs.values.rate.toFixed(2)}\n`;
  summary += `Duração média: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `P99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `Taxa de erro: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  
  if (metrics.transacoesAceitas) {
    summary += `\nTransações aceitas: ${metrics.transacoesAceitas.values.count}\n`;
    summary += `Transações rejeitadas: ${metrics.transacoesRejeitadas.values.count}\n`;
    summary += `Taxa de sucesso: ${(metrics.taxa_sucesso.values.rate * 100).toFixed(2)}%\n`;
  }
  
  return summary;
}
```

---

## 6. Teste de Race Conditions

### Script para detectar race conditions

```javascript
// race-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

const BASE_URL = 'http://localhost:8080';
const CONTA_ID = 'conta-teste';

export default function () {
  // Operações concorrentes na mesma conta
  const operations = [
    () => http.post(`${BASE_URL}/conta/${CONTA_ID}/depositar`, 
      JSON.stringify({ valor: 10 }), 
      { headers: { 'Content-Type': 'application/json' } }),
    () => http.post(`${BASE_URL}/conta/${CONTA_ID}/sacar`, 
      JSON.stringify({ valor: 5 }), 
      { headers: { 'Content-Type': 'application/json' } }),
    () => http.get(`${BASE_URL}/conta/${CONTA_ID}/saldo`),
  ];
  
  const op = operations[Math.floor(Math.random() * operations.length)];
  const res = op();
  
  check(res, {
    'status is 2xx or 200': (r) => r.status >= 200 && r.status < 300,
    'no race condition': (r) => !r.body.includes('race condition'),
    'no deadlock': (r) => r.timings.duration < 5000,
  });
  
  sleep(0.01); // 10ms entre operações
}
```

---

## 7. Análise de Resultados

### Interpretando métricas

```
✓ http_req_duration...........: avg=45ms   min=2ms    med=35ms   max=500ms  p(90)=80ms   p(95)=120ms  p(99)=250ms
✓ http_reqs...................: 15000      250/s      
✓ iterations.................: 15000      250/s      
✓ data_received..............: 4.5 MB     75 kB/s    
✓ data_sent..................: 2.1 MB     35 kB/s    

✓ http_req_duration [p(95)]..............: 120ms  ← OK se < 200ms
✓ http_req_duration [p(99)]..............: 250ms  ← OK se < 500ms
✓ http_req_failed.........................: 0.5%   ← OK se < 1%
```

### Thresholds (limites)

```javascript
export const options = {
  thresholds: {
    // Latência
    'http_req_duration': ['p(95)<200', 'p(99)<500'],
    
    // Erros
    'http_req_failed': ['rate<0.01'],
    
    // Throughput
    'http_reqs': ['rate>1000'],
    
    // Métricas customizadas
    'taxa_sucesso': ['rate>0.95'],
  },
};
```

---

## 8. Resumo

| Comando | Uso |
|---------|-----|
| `k6 run script.js` | Rodar teste |
| `k6 run --out json=results.json script.js` | Salvar resultados |
| `k6 cloud script.js` | Rodar na nuvem |

### Tipos de teste

| Tipo | Duração | VUs | Objetivo |
|------|---------|-----|----------|
| Load | 5-10min | 10-100 | Performance normal |
| Stress | 10-15min | 100-500 | Limite do sistema |
| Spike | 5-10min | 10→1000→10 | Resiliência a picos |
| Soak | 1-24h | 50-100 | Estabilidade longa |

### Checklist

- [ ] Health check passando
- [ ] P95 < meta definida
- [ ] Taxa de erro < 1%
- [ ] Sem race conditions
- [ ] Sem memory leaks
- [ ] Sem goroutine leaks

---

**Exercício:** **Exercicio:** k6-loadtest/
