# Amp MCP

A Model Context Protocol (MCP) server providing developer-focused documentation for Amp - a high-performance ETL system for blockchain data. This server helps developers building applications on Amp by providing access to essential documentation, schemas, troubleshooting guides, and code examples.

## What is Amp?

Amp is a high-performance ETL system that:
- **Extracts** data from various blockchain sources (EVM RPC, Firehose, Beacon Chain)
- **Transforms** it via SQL queries with custom User-Defined Functions (UDFs)
- **Loads** it into Parquet files for efficient querying
- **Serves** it through multiple query interfaces (Arrow Flight gRPC, JSON Lines HTTP)

This MCP server focuses on documentation that helps developers build applications using Amp, answer questions about Amp, and troubleshoot issues.

## Installation

```bash
npm install @edgeandnode/amp-mcp
```

Or with pnpm:

```bash
pnpm add @edgeandnode/amp-mcp
```

## Usage

### As an MCP Server

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "amp": {
      "command": "npx",
      "args": ["-y", "@edgeandnode/amp-mcp"]
    }
  }
}
```

Or if installed locally:

```json
{
  "mcpServers": {
    "amp": {
      "command": "node",
      "args": ["/path/to/amp-mcp/dist/index.js"]
    }
  }
}
```

### Available Resources

The server provides developer-focused documentation for building applications on Amp:

#### Core Documentation
- `amp-docs://amp` - Main documentation index
- `amp-docs://amp-getting-started` - **Getting started guide (START HERE!)**
- `amp-docs://amp-config` - Configuration guide for developers
- `amp-docs://amp-glossary` - Definitions of key terms

#### Developer Guides
- `amp-docs://amp-examples` - Complete example applications with code
- `amp-docs://amp-querying-data` - How to query blockchain data
- `amp-docs://amp-troubleshooting` - Common issues and solutions

#### Data Sources & Schemas
- `amp-docs://amp-udfs` - User-Defined Functions for SQL queries
- `amp-docs://amp-schemas-evm-rpc` - EVM RPC schema documentation
- `amp-docs://amp-schemas-firehose-evm` - Firehose EVM schema
- `amp-docs://amp-schemas-eth-beacon` - Ethereum Beacon Chain schema
- `amp-docs://amp-manifest-schemas` - Dataset definition schemas

#### Blockchain-Specific
- `amp-docs://amp-reorgs` - Handling blockchain reorganizations

#### Admin API Error Documentation
- `amp-docs://admin-api-errors` - Comprehensive error code reference (JSON format)

#### Operational Documentation
Documentation from the amp repository for deployment, installation, and operations:
- `amp-repo-docs://amp-repo` - Main installation guide (ampup, Nix, building from source)
- `amp-repo-docs://amp-repo-references-concepts` - Technical overview and core concepts
- `amp-repo-docs://amp-repo-references-operational-mode` - Operational modes explained
- `amp-repo-docs://amp-repo-how-to-single-node` - Single-node development mode
- `amp-repo-docs://amp-repo-how-to-serverless-mode` - Serverless deployment
- `amp-repo-docs://amp-repo-how-to-battleship` - Battleship deployment pattern
- `amp-repo-docs://amp-repo-quick-start-local` - Local development quick start
- `amp-repo-docs://amp-repo-quick-start-ampup` - Quick start with ampup installer

### Available Tools

#### `amp-documentation`
Fetches and concatenates documentation for specified sections.

```typescript
{
  sections: ["amp", "amp/config", "amp/udfs"]
}
```

#### `amp-all-documentation`
Fetches all Amp documentation at once.

#### `amp-doc-links`
Returns resource links for specified sections.

```typescript
{
  sections: ["amp/config", "amp/udfs"]
}
```

#### `admin-api-error-lookup`
Lookup detailed information about a specific Admin API error code.

```typescript
{
  errorCode: "DATASET_NOT_FOUND"
}
```

Returns detailed documentation including:
- HTTP status code
- Endpoint where error occurs
- Description of the error
- Conditions that trigger this error
- Example error response

#### `admin-api-errors-by-endpoint`
Get all possible error codes for a specific Admin API endpoint.

```typescript
{
  endpoint: "/datasets"
}
```

Returns a formatted list of all errors that can occur on the specified endpoint.

#### `admin-api-all-errors`
Get a complete reference of all Admin API error codes.

No parameters required. Returns a comprehensive table of all error codes with their HTTP status codes and endpoints.

#### `amp-repo-documentation`
Fetches operational documentation from the amp repository.

```typescript
{
  docIds: [
    "amp-repo",
    "amp-repo/references/concepts",
    "amp-repo/quick-start/local"
  ]
}
```

Returns documentation for deployment, installation, and operational guides.

#### `amp-repo-all-documentation`
Fetches all operational documentation from the amp repository at once.

No parameters required. Returns all guides including quick starts, how-tos, and reference documentation.

## Development

### Building

```bash
pnpm install
pnpm build
```

### Running Locally

```bash
pnpm start
```

### Development Mode (with watch)

```bash
pnpm dev
```

## Documentation Coverage

This MCP server includes developer-focused documentation for building applications on Amp:

### Getting Started
- **Complete getting started guide** with installation options
- **Example applications** (Vite+React, Next.js, Fastify backend)
- **Querying data** guide with JSON Lines and Arrow Flight patterns

### Developer Guides
- Working with data sources (EVM RPC, Firehose, Beacon Chain)
- Using SQL queries and User-Defined Functions
- Building frontends with TanStack Query or Effect Atom
- Building backends with Arrow Flight
- Real-time data patterns and polling

### Configuration & Schema Reference
- Configuring Amp for your application
- Dataset versioning system
- Schema documentation for all data sources
- Dataset definition schemas

### Troubleshooting
- Common issues and solutions when building on Amp
- Understanding blockchain reorganizations and how to handle them

## License

MIT

## Links

- [Amp Repository](https://github.com/edgeandnode/amp)
- [Model Context Protocol](https://modelcontextprotocol.io)
