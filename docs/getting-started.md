# Getting Started with Amp

This guide will help you get started building applications with Amp, a high-performance ETL system for blockchain data.

## What is Amp?

Amp is a high-performance ETL (Extract, Transform, Load) system that:
- **Extracts** data from various blockchain sources (EVM RPC, Firehose, Beacon Chain)
- **Transforms** it via SQL queries with custom User-Defined Functions (UDFs)
- **Loads** it into Parquet files for efficient querying
- **Serves** it through multiple query interfaces (Arrow Flight gRPC, JSON Lines HTTP)

## Quick Start Options

### Option 1: Using Create Amp CLI (Recommended)

The fastest way to get started is using the Create Amp CLI tool, which scaffolds a complete application for you.

#### Interactive Mode

```bash
# Using npm
npx @edgeandnode/create-amp my-app

# Using pnpm
pnpm create @edgeandnode/amp my-app

# Using yarn
yarn create @edgeandnode/amp my-app

# Using bun
bunx @edgeandnode/create-amp my-app
```

The CLI will prompt you to select:
- **Framework**: Next.js or React (Vite)
- **Data Layer**: Arrow Flight or Amp Sync
- **ORM** (if using Amp Sync): ElectricSQL or Drizzle
- **Example**: Wallet app or blank starter
- **Blockchain Setup**: Anvil local testnet, public network, or both

#### Non-Interactive Mode

```bash
npx @edgeandnode/create-amp my-app \
  --framework nextjs \
  --data-layer arrow-flight \
  --example wallet \
  --local-setup anvil \
  --network arbitrum \
  --network-env testnet
```

### Option 2: Manual Setup

If you want to set up Amp manually for a custom use case:

#### Prerequisites

- Node.js >= 22.0.0
- Docker & Docker Compose
- Foundry (for smart contract deployment)
- pnpm >= 10.19.0

#### Installation

##### Using ampup (Recommended)

```bash
# Install ampup (Amp version manager)
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/edgeandnode/amp/refs/heads/main/install | sh

# Restart your terminal or run:
source ~/.zshenv

# Install latest version of ampd
ampup install

# Switch between versions
ampup use v0.1.0

# Build from source
ampup build

# Build from specific PR or branch
ampup build --pr 123
ampup build --branch develop
```

##### Using Nix

```bash
# Run directly
nix run github:edgeandnode/amp

# Install to your profile
nix profile install github:edgeandnode/amp

# Try it out temporarily
nix shell github:edgeandnode/amp -c ampd --version
```

##### Manual Build from Source

```bash
git clone https://github.com/edgeandnode/amp-private
cd amp-private
cargo build --release -p ampd
```

The binary will be available at `target/release/ampd`.

## Discovering Public Datasets

Amp provides access to public datasets that you can query without setting up your own infrastructure.

### AMP Playground

Explore and discover public datasets at:
**https://playground.amp.edgeandnode.com/**

The playground allows you to:
- Browse available public datasets
- Test SQL queries in real-time
- View dataset schemas and metadata
- Copy query examples for your applications
- No local setup required - just authentication

### Public Registry

Public datasets are registered and discoverable through the Amp platform. You can find dataset information in the public registry which includes:

- Dataset names and versions
- Available tables and schemas
- Query examples
- Access requirements

### Example Public Datasets

- `edgeandnode/ethereum_mainnet@0.0.1` - Ethereum mainnet blocks, transactions, and logs
- More datasets available in the playground

To use public datasets in your application, authenticate with the AMP Gateway and reference them in your queries:

```sql
SELECT * FROM "edgeandnode/ethereum_mainnet@0.0.1".blocks LIMIT 10
```

See the [Apollo GraphQL example](examples.md#apollo-graphql-server-with-public-dataset) for a complete implementation.

## Understanding Amp Components

### Core Components

1. **ampd** - Main binary with commands:
   - `dump`: Extract data from sources to Parquet
   - `dev`: Start development server
   - `server`: Start query servers
   - `worker`: Run distributed worker node

2. **Data Sources**:
   - **EVM RPC**: Ethereum-compatible JSON-RPC endpoints
   - **Firehose**: StreamingFast Firehose protocol (gRPC)
   - **Beacon Chain**: Ethereum consensus layer data

3. **Query Interfaces**:
   - **Arrow Flight Server** (port 1602): High-performance binary protocol
   - **JSON Lines Server** (port 1603): Simple HTTP interface
   - **Admin API** (port 1610): Management endpoints

4. **Storage**:
   - **Parquet Files**: Columnar format optimized for analytics
   - **PostgreSQL**: Metadata storage for tracking files, jobs, and workers

## Next Steps

### For Frontend Developers

1. Check out the [example applications](examples.md):
   - **Vite + React**: Portfolio tracking with TanStack Query or Effect Atom
   - **Next.js**: ElectricSQL integration with reactive sync
   - **Fastify Backend**: High-performance API with Arrow Flight

2. Learn about [querying data](querying-data.md):
   - Using the JSON Lines API
   - Using Arrow Flight for high-performance queries
   - Working with SQL and User-Defined Functions

### For Backend Developers

1. Understand [configuration](config.md):
   - Setting up datasets
   - Configuring data sources
   - Managing storage backends

2. Explore [User-Defined Functions](udfs.md):
   - EVM decoding functions
   - RPC call functions
   - JavaScript UDFs

3. Learn about [data schemas](schemas/evm-rpc.md):
   - Understanding blockchain data structures
   - Working with EVM data

### For DevOps

1. Review [configuration options](config.md):
   - Dataset configuration
   - Provider setup
   - Storage backends (S3, GCS, Azure)

2. Study [troubleshooting guide](troubleshooting.md):
   - Common issues and solutions
   - Performance optimization
   - Debugging tips

## Example Architectures

### Simple Frontend Application

```
Anvil (Local Blockchain)
    ↓
Amp Server (indexes blockchain data)
    ↓
JSON Lines API (port 1603)
    ↓
React App (fetches data via HTTP)
```

### Production Backend

```
Ethereum Mainnet
    ↓
Amp Workers (distributed extraction)
    ↓
S3 (Parquet storage)
    ↓
Amp Server (queries with Arrow Flight)
    ↓
Backend API (serves clients)
```

### Real-time Dashboard

```
Firehose (streaming blockchain data)
    ↓
Amp Server (indexes in real-time)
    ↓
Arrow Flight (high-performance queries)
    ↓
Dashboard (visualizes metrics)
```

## Technology Stack

- **Language**: Rust
- **Query Engine**: Apache DataFusion
- **Storage Format**: Apache Parquet
- **Wire Format**: Apache Arrow
- **Database**: PostgreSQL (metadata)
- **Protocols**: gRPC (Arrow Flight), HTTP (JSON Lines)

## Community & Support

- **Documentation**: See other guides in this MCP server
- **GitHub**: [edgeandnode/amp](https://github.com/edgeandnode/amp)
- **Examples**: Check the amp-templates repository

## Learn More

- [Configuration Guide](config.md) - Detailed configuration reference
- [Data Schemas](schemas/evm-rpc.md) - Understanding data source schemas
- [User-Defined Functions](udfs.md) - Custom SQL functions
- [Querying Data](querying-data.md) - Query patterns and optimization
- [Examples](examples.md) - Complete working examples
