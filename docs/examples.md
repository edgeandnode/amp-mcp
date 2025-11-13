# Example Applications

This guide showcases complete example applications demonstrating different Amp integration patterns. All examples are available in the [amp-templates repository](https://github.com/edgeandnode/amp-templates).

## Frontend Examples

### 1. Vite + React + TanStack Query

**Portfolio tracking application with real-time updates**

A real-time portfolio tracking application that demonstrates querying blockchain data via Amp's JSON Lines API with TanStack Query for data fetching and caching.

#### Features
- Real-time ERC20 token balance tracking
- Transfer history with automatic polling (every 2 seconds)
- MetaMask wallet integration
- Token transfer functionality
- TanStack Query for declarative data fetching

#### Architecture

```
Anvil (Local Blockchain)
    ↓
Amp Server (indexed blockchain data)
    ↓
TanStack Query (data fetching and caching)
    ↓
React App (real-time UI updates)
```

#### Key Technologies
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4
- **Data Fetching**: TanStack Query 5 (server state management)
- **Data Layer**: JSON Lines API, Amp (blockchain indexing)
- **Blockchain**: Foundry (Anvil local testnet), Solidity 0.8.30
- **Wallet**: Wagmi 2, Viem 2

#### Quick Start

```bash
cd amp-templates/examples/vite-react/jsonl-tsquery

# Install dependencies
just install

# Start infrastructure (PostgreSQL, Amp, Anvil)
just up

# Start development servers
just dev

# Deploy contracts
just deploy-contracts

# Seed test data
just seed-transfers

# Open http://localhost:5173
```

#### Key Features

**TanStack Query Integration**:
- `useQuery` hook for fetching and caching transfer data
- Automatic polling with `refetchInterval` for real-time updates
- `placeholderData` keeps previous data visible during refetches
- Optimistic updates and cache invalidation
- Built-in loading and error states

**JSON Lines API**:
- SQL queries executed via JSON Lines endpoint
- Newline-delimited JSON (NDJSON) for efficient streaming
- DataFusion SQL engine with complex query support
- Schema validation for type-safe data parsing

### 2. Vite + React + Effect Atom

**Portfolio tracking with reactive state management**

Similar to the TanStack Query example but using Effect Atom for reactive state management.

#### Features
- Reactive state management with automatic refresh
- Separate atom instances per user address
- Polling mechanism (configurable refresh interval)
- Manual refresh triggers

#### Key Technologies
- **State Management**: Effect Atom (reactive state with polling)
- **Data Layer**: JSON Lines API, Effect Schema
- **Everything else**: Same as TanStack Query example

#### Effect Atom Highlights

```typescript
// Atom family creates separate instances per address
const transfersAtom = Atom.family((address: string) =>
  Atom.make({
    /* ... */
  })
);

// Automatic refresh every 2 seconds
useAutoRefresh(address, 2000);
```

### 3. Next.js + ElectricSQL

**Next.js application with PostgreSQL reactive sync**

Demonstrates using the `ampsync` crate to sync Amp data to PostgreSQL, then using Electric SQL to reactively sync the data to a Next.js UI.

#### Features
- Server-side rendering with Next.js App Router
- Real-time data sync via Electric SQL
- PostgreSQL as the sync target
- Reactive UI updates without manual polling

#### Architecture

```
Anvil → Amp → AmpSync → PostgreSQL → Electric SQL → Next.js UI
```

#### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Electric SQL replication
- **Sync**: ampsync crate for Amp → PostgreSQL sync
- **UI**: React 19, Tailwind CSS 4, Radix UI

## Backend Examples

### 1. Apollo GraphQL Server with Public Dataset

**Production-ready GraphQL API querying Ethereum mainnet via remote AMP Gateway**

A complete GraphQL API server that demonstrates querying **public datasets** via the remote AMP Gateway. No local Amp setup required - just authentication!

#### Features
- Apollo Server 4 with latest GraphQL features
- Queries the `edgeandnode/ethereum_mainnet@0.0.1` **public dataset**
- Remote AMP Gateway integration (no local infrastructure)
- Authentication via AMP CLI token
- Ethereum mainnet data (blocks, transactions, logs)
- GraphQL Playground for development
- Custom SQL query execution via GraphQL

#### Architecture

```
AMP Gateway (Remote) → Apollo Server → GraphQL API
        🌐                  🚀            📡
    Public Dataset      Authentication  Client Apps
```

#### Public Dataset Access

This example shows how to query **public datasets** hosted on the AMP Gateway:

- **Dataset**: `edgeandnode/ethereum_mainnet@0.0.1`
- **Tables**: blocks, transactions, logs
- **Access**: Via AMP Gateway (remote, no local setup)
- **Authentication**: AMP CLI token

#### Quick Start

```bash
cd amp-templates/examples/backend/apollo-graphql

# Get AMP auth token
pnpm install -g @edgeandnode/amp
amp auth login
amp auth token

# Create .env file
cat > .env << EOF
AMP_GATEWAY_URL=https://gateway.amp.staging.edgeandnode.com
AMP_AUTH_TOKEN=your_token_here
PORT=4000
EOF

# Install and run
pnpm install
pnpm dev

# Open GraphQL Playground
# http://localhost:4000/graphql
```

#### Example GraphQL Queries

**Get latest blocks from Ethereum mainnet:**
```graphql
query {
  blocks(limit: 10) {
    data {
      block_num
      hash
      timestamp
      miner
      gas_used
    }
    totalCount
    hasNextPage
  }
}
```

**Get recent transactions:**
```graphql
query {
  transactions(limit: 5) {
    data {
      tx_hash
      from
      to
      value
      gas_price
      block_num
    }
  }
}
```

**Execute custom SQL on public dataset:**
```graphql
query {
  executeQuery(
    query: "SELECT block_num, hash, miner FROM \"edgeandnode/ethereum_mainnet@0.0.1\".blocks ORDER BY block_num DESC LIMIT 5"
  ) {
    data
    rowCount
    executionTime
  }
}
```

#### Key Technologies
- **Server**: Apollo Server 4, Fastify
- **Data Source**: AMP Gateway (remote, public dataset)
- **Authentication**: AMP CLI token
- **GraphQL**: Schema-first with resolvers
- **TypeScript**: Full type safety

#### Security Features
- Only SELECT statements allowed
- Query result limits enforced (max 100 rows)
- Authentication required via AMP token
- Input validation on all parameters
- Dangerous SQL keywords blocked

### 2. Fastify Backend with Arrow Flight

**High-performance backend API with Arrow Flight**

A production-ready backend built with Fastify that queries blockchain data via Amp's Arrow Flight interface for lightning-fast data access.

#### Features
- High-performance Fastify backend
- Arrow Flight for ultra-fast queries (sub-second response times)
- REST API endpoints for blocks and transfers
- Custom SQL query execution endpoint
- Smart contract deployment and test data generation

#### Architecture

```
Smart Contracts → Anvil → Amp → Arrow Flight → Fastify → REST API
      📝            🐳      📊       ⚡         🐳        📡
```

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/` | GET | API documentation |
| `/api/blocks` | GET | Get blockchain blocks |
| `/api/transfers` | GET | Get ERC20 transfers |
| `/api/queries/execute` | POST | Execute custom SQL queries |

#### Quick Start

```bash
cd amp-templates/examples/backend/fastify

# One command setup (requires 'just' CLI)
just setup

# Manual setup
just start                    # Start services
just generate-activity        # Deploy contracts & generate data
just start-amp-dev           # Register datasets
just start-backend           # Start Fastify server
just test-api               # Test endpoints
```

#### Example Requests

```bash
# Get recent blocks
curl "http://localhost:3001/api/blocks?limit=5"

# Get ERC20 transfers
curl "http://localhost:3001/api/transfers?limit=10&offset=0"

# Custom SQL query
curl -X POST "http://localhost:3001/api/queries/execute" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT block_num, timestamp FROM anvil.blocks LIMIT 3"}'
```

#### Performance Benefits

**Arrow Flight advantages:**
- Sub-second queries on large datasets
- Columnar storage optimized for analytics
- Streaming results for memory efficiency
- Type-safe queries with Effect-TS
- Automatic indexing of blockchain events

## Amp Dataset Configuration

All examples use Amp's dataset configuration system. Here's a typical configuration:

```typescript
// amp.config.ts
export default defineDataset(() => ({
  name: "my_app",
  network: "anvil",
  version: "1.0.0",
  dependencies: {
    anvil: {
      owner: "graphprotocol",
      name: "anvil",
      version: "0.1.0",
    },
  },
  tables: {
    blocks: {
      sql: `SELECT block_num, timestamp, hash FROM anvil.blocks`,
    },
    erc20_transfers: {
      sql: `
        SELECT
          block_num,
          tx_hash,
          contract_address,
          decoded_event
        FROM anvil.logs
        WHERE topic0 = evm_topic('Transfer(address,address,uint256)')
      `,
    },
  },
}));
```

## Common Patterns

### JSON Lines API Client

```typescript
// Query blockchain data via JSON Lines
export async function queryJsonLines(sql: string) {
  const response = await fetch("http://localhost:1603", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: sql,
  });

  const text = await response.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
```

### Arrow Flight Client (Effect-TS)

```typescript
import { FlightClient } from "@apache-arrow/flight";
import { Effect, pipe } from "effect";

// Create Flight client
const client = FlightClient.connect("localhost:1602");

// Execute query
const result = pipe(
  Effect.tryPromise(() =>
    client.doGet({
      ticket: { ticket: Buffer.from(sql) },
    })
  ),
  Effect.map((stream) => stream.toArray()),
  Effect.provide(NodeHttpClient.layer)
);
```

### MetaMask Integration

```typescript
import { useConnect, useAccount } from "wagmi";

// Connect wallet
const { connect, connectors } = useConnect();
const { address, isConnected } = useAccount();

// Use in component
<button onClick={() => connect({ connector: connectors[0] })}>
  Connect MetaMask
</button>;
```

## Local Development Setup

All examples include Docker Compose configurations for local development:

### Services
- **Anvil**: Local Ethereum testnet (port 8545)
- **PostgreSQL**: Metadata database (port 5432)
- **Amp Server**: Query engine (ports 1602-1603, 1610)
- **Amp Proxy**: Arrow Flight web proxy (port 3002)

### MetaMask Configuration

Add Anvil network:
- **Network Name**: Anvil Local
- **RPC URL**: http://localhost:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

Import test accounts:
- **Account #1**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Account #2**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

## Troubleshooting

### Services not starting
```bash
# Check Docker logs
docker-compose logs [service-name]

# Verify ports are available
lsof -i :5173,1603,8545
```

### No data showing
```bash
# Verify contracts deployed
just deploy-contracts

# Check Amp logs
docker-compose logs amp

# Test JSON Lines API
curl -X POST http://localhost:1603 \
  -H "Content-Type: text/plain" \
  -d "SELECT * FROM my_dataset.blocks LIMIT 1"
```

### MetaMask issues
- Ensure Chain ID is 31337
- Reset account if transactions stuck
- Clear activity and nonce data

## Next Steps

1. **Clone an example**: Start with the example closest to your use case
2. **Customize the dataset**: Modify `amp.config.ts` for your data needs
3. **Add queries**: Extend with custom SQL queries and UDFs
4. **Deploy**: Adapt for production with mainnet/testnet
5. **Scale**: Use distributed Amp workers for large datasets

## Learn More

- [Getting Started](getting-started.md) - Installation and setup
- [Configuration](config.md) - Dataset configuration
- [Querying Data](querying-data.md) - Query patterns and best practices
- [User-Defined Functions](udfs.md) - Custom SQL functions
