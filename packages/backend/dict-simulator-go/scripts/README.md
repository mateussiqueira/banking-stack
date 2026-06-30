# DICT Simulator k6 Test Scripts

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Configuration

Set the target URL (defaults to `http://localhost:3003`):

```bash
export BASE_URL=http://localhost:3003
```

## Running Tests

### Stress Test

Simulates high traffic with ramp-up to 200 virtual users over 3 minutes:

```bash
k6 run stress-test.js
```

### Load Test

Simulates normal sustained load at 50 VUs for 5 minutes with 80/20 read/write mix:

```bash
k6 run load-test.js
```

## Metrics Explained

- **http_req_duration**: Response time in ms
- **errors**: Rate of failed requests
- **read_duration**: Response time for read operations
- **write_duration**: Response time for write operations
- **read_count**: Total read requests
- **write_count**: Total write requests

## Thresholds

| Test | Metric | Threshold |
|------|--------|-----------|
| Stress | p95 duration | < 100ms |
| Stress | error rate | < 1% |
| Load | p95 duration | < 150ms |
| Load | error rate | < 2% |

## Output

k6 outputs results to stdout. For JSON output:

```bash
k6 run --out json=results.json stress-test.js
```

For InfluxDB output:

```bash
k6 run --out influxdb=http://localhost:8086/k6 stress-test.js
```
