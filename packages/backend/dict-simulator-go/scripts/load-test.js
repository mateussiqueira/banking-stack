import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3003';

const errorRate = new Rate('errors');
const readDuration = new Trend('read_duration', true);
const writeDuration = new Trend('write_duration', true);
const readCount = new Counter('read_count');
const writeCount = new Counter('write_count');

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '4m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'],
    errors: ['rate<0.02'],
  },
};

function generateRandomKey() {
  return `account-${Math.floor(Math.random() * 50000)}`;
}

function generateRandomEntry() {
  return {
    key: generateRandomKey(),
    value: {
      bankCode: `BANK${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      accountNumber: String(Math.floor(Math.random() * 9999999999)),
      name: `Account Holder ${Math.floor(Math.random() * 10000)}`,
      status: 'ACTIVE',
    },
  };
}

export default function () {
  const isReadOperation = Math.random() < 0.8;

  group('Read Operations', () => {
    if (isReadOperation) {
      const key = generateRandomKey();
      const startTime = Date.now();
      const response = http.get(`${BASE_URL}/dict/entries/${key}`, {
        tags: { operation: 'read' },
      });
      const duration = Date.now() - startTime;

      readDuration.add(duration);
      readCount.add(1);

      const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 150ms': (r) => r.timings.duration < 150,
      });

      errorRate.add(!success);
    }
  });

  group('Write Operations', () => {
    if (!isReadOperation) {
      const entry = generateRandomEntry();
      const startTime = Date.now();
      const response = http.post(`${BASE_URL}/dict/entries`, JSON.stringify(entry), {
        headers: { 'Content-Type': 'application/json' },
        tags: { operation: 'write' },
      });
      const duration = Date.now() - startTime;

      writeDuration.add(duration);
      writeCount.add(1);

      const success = check(response, {
        'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'response time < 150ms': (r) => r.timings.duration < 150,
      });

      errorRate.add(!success);
    }
  });

  sleep(0.02);
}
