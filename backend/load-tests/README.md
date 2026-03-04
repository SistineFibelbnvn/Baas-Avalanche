# Layer1 Load Testing with K6 & Grafana

This directory contains K6 load testing scripts for the Layer1 backend.

## Prerequisites

1.  **Install K6**:
    -   Windows (Winget): `winget install k6`
    -   Chocolatey: `choco install k6`
    -   Download: [https://k6.io/docs/get-started/installation/](https://k6.io/docs/get-started/installation/)

2.  **Start the Backend**:
    Ensure your Layer1 backend is running on `http://localhost:4000`.

## Running the Load Test (Basic)

To run the test and see results in your terminal:

```bash
k6 run load-test-comprehensive.js
```

## Running with Grafana (via InfluxDB)

To visualize results in Grafana, you need an InfluxDB instance. The easiest way is using Docker.

### 1. Start InfluxDB & Grafana (Docker Compose)

Create a `docker-compose.k6.yml` (or add to your existing one):

```yaml
version: '3.8'
services:
  influxdb:
    image: influxdb:1.8
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=k6

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_BASIC_ENABLED=false
    links:
      - influxdb
```

Run it:
```bash
docker-compose -f docker-compose.k6.yml up -d
```

### 2. Configure Grafana

1.  Open Grafana at `http://localhost:3000`.
2.  Add Data Source:
    -   Type: **InfluxDB**
    -   URL: `http://influxdb:8086`
    -   Database: `k6`
    -   Click "Save & Test".
3.  Import Dashboard:
    -   Go to Dashboards -> Import.
    -   Enter ID `2587` (Official K6 Dashboard) and load.
    -   Select your InfluxDB data source.
    -   Click "Import".

### 3. Run K6 Outputting to InfluxDB

Run the script pointing to your local InfluxDB:

```bash
k6 run --out influxdb=http://localhost:8086/k6 load-test-comprehensive.js
```

You should now see real-time metrics in your Grafana dashboard!
