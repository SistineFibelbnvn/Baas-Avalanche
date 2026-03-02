# 🌐 AVXU BaaS Platform

> **Blockchain-as-a-Service for Avalanche L1 Networks**

A production-ready platform for creating, managing, and interacting with custom Avalanche Layer 1 blockchains. Built for enterprises and developers who need full control over their blockchain infrastructure.

![Dashboard Preview](docs/assets/dashboard-preview.png)

---

## ✨ Key Features

### 🔗 Multi-Network Architecture
- **Create Custom L1s**: Deploy your own Avalanche-based blockchains
- **Network Selector**: Switch between networks with one click
- **Dynamic RPC**: All features adapt to selected network
- **MetaMask Integration**: Auto-add networks to wallet

### 🛡️ Validator Management
- Real-time validator status monitoring
- Add/remove validators from network
- Uptime tracking and stake visualization
- P-Chain RPC integration

### 📝 Smart Contract Studio
- Deploy contracts with MetaMask
- Contract registry and tracking
- Network-aware deployment
- Built-in SimpleStorage template

### ⚡ Benchmark Testing
- TPS measurement with real-time charts
- Latency distribution analysis  
- Configurable test parameters
- Export results as JSON

### 📊 Real-time Monitoring
- Block height and production rate
- Transaction statistics
- Node health status
- Recent blocks feed

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- Avalanche-CLI

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker compose up -d

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:4000
# - pgAdmin: http://localhost:8090
```

### Option 2: Development Mode

```bash
# Terminal 1: Backend
cd backend
npm install
npm run start:dev

# Terminal 2: Frontend  
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
Layer1/
├── frontend/                 # Next.js 15 + React 18
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # UI components
│   │   │   ├── network/     # NetworkSelector
│   │   │   ├── validators/  # ValidatorStudio
│   │   │   ├── contracts/   # ContractStudio
│   │   │   ├── benchmark/   # BenchmarkStudio
│   │   │   └── settings/    # SettingsPanel
│   │   └── context/         # NetworkContext
│   └── Dockerfile
│
├── backend/                  # NestJS + Prisma
│   ├── src/
│   │   ├── subnets/         # Subnet/Network management
│   │   ├── validators/      # Validator operations
│   │   ├── contracts/       # Contract registry
│   │   └── node-status/     # Node RPC integration
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── Dockerfile
│
├── docs/                     # Documentation
├── infrastructure/          # Scripts & configs
└── docker-compose.yml       # Full stack deployment
```

---

## 🔧 Configuration

### Backend Environment Variables

```env
# Node Connection
AVALANCHE_NODE_HOST=127.0.0.1
AVALANCHE_NODE_PORT=9650
AVALANCHE_NODE_PROTOCOL=http

# Avalanche CLI
AVALANCHE_CLI_PATH=avalanche
AVALANCHE_WSL_DISTRO=Ubuntu-22.04  # Windows only

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/baas

# Server
PORT=4000
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/node/status` | GET | Node status (supports `?rpcUrl=`) |
| `/node/dashboard` | GET | Dashboard statistics |
| `/node/blocks` | GET | Recent blocks |
| `/subnets` | GET/POST | List/Create networks |
| `/subnets/:id` | GET | Network details |
| `/subnets/:id/operations` | GET | Deployment logs |
| `/validators` | GET/POST | List/Add validators |
| `/contracts` | GET/POST | Contract registry |

---

## 🦊 MetaMask Configuration

For local Avalanche networks:

| Field | C-Chain (Primary) | Custom L1 |
|-------|-------------------|-----------|
| RPC URL | `http://127.0.0.1:9650/ext/bc/C/rpc` | `http://127.0.0.1:9650/ext/bc/{blockchainId}/rpc` |
| Chain ID | 43112 | Your Chain ID |
| Symbol | AVAX | Your Token |

**Pre-funded Address (Local):**
- Address: `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC`
- Private Key: See Avalanche documentation

---

## 🗄️ Database

Using PostgreSQL with Prisma ORM:

```bash
# Generate Prisma client
cd backend
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

**Models:**
- `Network` - Deployed L1 blockchains
- `Validator` - Network validators
- `Contract` - Deployed smart contracts
- `Operation` - CLI operations log
- `Benchmark` - Performance test results
- `Settings` - Platform configuration

---

## 🎨 Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons
- ethers.js

### Backend
- NestJS 11
- Prisma ORM
- PostgreSQL
- Avalanche SDK
- ethers.js

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📧 Support

For questions or issues, please open a GitHub issue.

---

Built with ❤️ for the Avalanche ecosystem
# Baas-Avalanche
# Baas-Avalanche
