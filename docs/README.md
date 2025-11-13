# Amp Documentation

Welcome to the Amp documentation. Amp is a high-performance ETL (Extract, Transform, Load) system for blockchain data that extracts data from various blockchain sources, transforms it via SQL queries, and serves it through multiple query interfaces.

## Quick Start

New to Amp? Start here:

1. **[Getting Started Guide](getting-started.md)** - Installation and setup instructions
2. **[Configuration Guide](config.md)** - Learn how to configure Amp for your deployment

## Documentation Index

### Core Concepts

#### [Getting Started Guide](getting-started.md)
Complete guide to getting started with Amp:
- Installation options (ampup, Nix, manual build)
- Understanding Amp components
- Example architectures
- Technology stack

#### [Configuration Guide](config.md)
Detailed configuration reference for all Amp components and settings.

### Data Sources & Schemas

#### [Dataset Definition Schemas](manifest-schemas/README.md)
JSON schemas for defining datasets:
- Common dataset fields
- EVM RPC datasets
- Firehose datasets
- SQL/manifest datasets (derived datasets)

#### Dataset Schema Documentation

- **[EVM RPC Schema](schemas/evm-rpc.md)** - Schema for Ethereum-compatible JSON-RPC data sources
- **[Firehose EVM Schema](schemas/firehose-evm.md)** - Schema for StreamingFast Firehose protocol data
- **[Ethereum Beacon Chain Schema](schemas/eth-beacon.md)** - Schema for Ethereum consensus layer data

#### [User-Defined Functions (UDFs)](udfs.md)
Custom SQL functions available in Amp queries:
- EVM decoding functions
- RPC call functions
- Attestation functions
- JavaScript UDFs

### Operations

#### [Reorgs](reorgs.md)
Understanding and handling blockchain reorganizations:
- How Amp detects and handles reorgs
- Impact on data consistency
- Best practices

### Reference

#### [Glossary](glossary.md)
Definitions of key terms and concepts used throughout Amp.

## Additional Resources

For more information about building applications with Amp, refer to the guides above or explore the example applications to see complete implementations.
