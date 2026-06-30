import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3003';

const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration', true);
const requestCount = new Counter('request_count');

export const options = {
  stages: [
    { duration: '30s', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],
    errors: ['rate<0.01'],
  },
};

function generateRandomKey() {
  return `account-${Math.floor(Math.random() * 100000)}`;
}

function generateRandomEntry() {
  return {
    key: generateRandomKey(),
    value: {
      bankCode: `BANK${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      accountNumber: String(Math.floor(Math.random() * 9999999999)),
      name: `Account Holder ${Math.floor(Math.random() * 10000)}`,
      status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
    },
  };
}

export default function () {
  const isReadOperation = Math.random() < 0.5;
  const startTime = Date.now();

  let response;

  if (isReadOperation) {
    const key = generateRandomKey();
    response = http.get(`${BASE_URL}/dict/entries/${key}`, {
      tags: { operation: 'read' },
    });
  } else {
    const entry = generateRandomEntry();
    response = http.post(`${BASE_URL}/dict/entries`, JSON.stringify(entry), {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'write' },
    });
  }

  const duration = Date.now() - startTime;
  requestDuration.add(duration);
  requestCount.add(1);

  const success = check(response, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!success);
  sleep(0.01);
}
