# Troubleshooting Common Issues

This guide covers common issues you may encounter when working with Amp and their solutions.

## Installation Issues

### ampup command not found

**Problem**: After installing ampup, the command is not recognized.

**Solutions**:
```bash
# Restart your terminal or reload shell configuration
source ~/.zshenv   # for zsh
source ~/.bashrc   # for bash

# Verify installation
which ampup

# If still not found, check if installation directory is in PATH
echo $PATH | grep -o "\.ampup"

# Manually add to PATH if needed
export PATH="$HOME/.ampup/bin:$PATH"
```

### ampd binary fails to start

**Problem**: `ampd: permission denied` or similar errors.

**Solutions**:
```bash
# Make binary executable
chmod +x ~/.ampup/bin/ampd

# Or if building from source
chmod +x target/release/ampd

# Verify it works
ampd --version
```

### Cargo build fails

**Problem**: Compilation errors when building from source.

**Solutions**:
```bash
# Update Rust toolchain
rustup update stable

# Clean build artifacts
cargo clean

# Rebuild
cargo build --release -p ampd

# If specific crate fails, try building it alone
cargo build --release -p metadata-db
```

## Docker & Infrastructure Issues

### Docker containers won't start

**Problem**: `docker-compose up` fails or containers crash.

**Solutions**:
```bash
# Check Docker is running
docker ps

# View logs for specific service
docker-compose logs amp
docker-compose logs db
docker-compose logs anvil

# Remove volumes and restart
docker-compose down -v
docker-compose up -d

# Check port conflicts
lsof -i :5432,8545,1602,1603,1610

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### PostgreSQL connection refused

**Problem**: Cannot connect to metadata database.

**Solutions**:
```bash
# Check if PostgreSQL is running
docker-compose ps db

# Verify connection details
psql postgresql://postgres:postgres@localhost:5432/amp

# Check logs for errors
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432; do sleep 1; done
```

### Anvil not producing blocks

**Problem**: Local blockchain not working.

**Solutions**:
```bash
# Check Anvil logs
docker-compose logs anvil

# Restart Anvil
docker-compose restart anvil

# Verify RPC endpoint
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check if port 8545 is available
lsof -i :8545
```

## Authentication & Gateway Issues

### AMP CLI authentication fails

**Problem**: Cannot authenticate with AMP Gateway.

**Solutions**:
```bash
# Login to AMP
amp auth login

# Print current token
amp auth token

# Check if token is valid
curl -H "Authorization: Bearer $(amp auth token)" \
  https://gateway.amp.staging.thegraph.com/health

# Clear authentication and re-login
amp auth logout
amp auth login
```

### Invalid or expired token

**Problem**: `401 Unauthorized` errors when querying AMP Gateway.

**Solutions**:
```bash
# Get fresh token
amp auth login
amp auth token

# Update environment variable
export AMP_AUTH_TOKEN=$(amp auth token)

# Update .env file
echo "AMP_AUTH_TOKEN=$(amp auth token)" >> .env

# Restart your application
```

## Dataset & Configuration Issues

### Dataset not found

**Problem**: `Table 'my_dataset.blocks' not found`.

**Solutions**:
```bash
# Check if dataset is registered
ampd datasets list

# Register dataset (dev mode)
ampd dev --config amp.config.ts

# Verify dataset configuration
cat amp.config.ts

# Check dataset name matches query
# Query: SELECT * FROM "namespace/dataset@version".blocks
# Config: name: "dataset", version: "version"
```

### Dataset not indexing data

**Problem**: Queries return no results.

**Solutions**:
```bash
# Check Amp server logs
docker-compose logs amp

# Verify data extraction is running
ampd dump --dataset my_dataset

# Check if source is accessible
curl http://localhost:8545  # for Anvil

# Restart Amp in dev mode
just start-amp-dev
# or
ampd dev
```

### Configuration file errors

**Problem**: `Failed to parse config` or similar errors.

**Solutions**:
```bash
# Validate TOML syntax
toml-test config.toml  # if you have toml-test installed

# Check for common issues:
# - Missing quotes around strings
# - Incorrect nesting
# - Typos in field names

# Create a basic config file with required fields
cat > config.toml << EOF
manifests_dir = "/path/to/manifests"
providers_dir = "/path/to/providers"
data_dir = "/path/to/data"
metadata_db_url = "postgresql://postgres:postgres@localhost:5432/amp"
EOF

# Verify paths are absolute
echo $AMP_CONFIG  # should be absolute path

# Check environment variable overrides
env | grep AMP_
```

## Query Issues

### SQL syntax errors

**Problem**: `Parse error: Expected identifier, found keyword`.

**Solutions**:
```sql
-- Wrap reserved keywords or special names in double quotes
SELECT * FROM "my-dataset".blocks  -- Good
SELECT * FROM my-dataset.blocks    -- Bad (hyphen not allowed)

-- Escape dataset names with special characters
SELECT * FROM "edgeandnode/ethereum_mainnet@0.0.1".blocks

-- Use proper SQL syntax for DataFusion
SELECT block_num FROM blocks WHERE block_num > 1000  -- Good
SELECT block_num FROM blocks WHERE block_num = '1000'  -- Bad (type mismatch)
```

### Binary address format errors

**Problem**: Address comparison fails in queries.

**Solutions**:
```sql
-- Use decode() for hex addresses
WHERE contract_address = decode('5fbdb2315678afecb367f032d93f642f64180aa3', 'hex')

-- Don't use quotes around hex
WHERE contract_address = '0x5fbd...'  -- Wrong

-- Use lower() for case-insensitive comparison
WHERE lower(encode(contract_address, 'hex')) = lower('5fbdb...')
```

### No results from queries

**Problem**: Queries run but return empty result sets.

**Solutions**:
```bash
# Check if data exists
curl -X POST http://localhost:1603 \
  -H "Content-Type: text/plain" \
  -d "SELECT COUNT(*) FROM my_dataset.blocks"

# Verify data source is producing data
# For Anvil: deploy contracts and generate transactions
just generate-activity

# Check block range
SELECT MIN(block_num), MAX(block_num) FROM my_dataset.blocks

# Ensure extraction completed
ampd dump --dataset my_dataset --check-progress
```

### Query timeout errors

**Problem**: Long-running queries time out.

**Solutions**:
```sql
-- Add LIMIT to reduce data scanned
SELECT * FROM blocks LIMIT 100

-- Add WHERE clause to filter early
SELECT * FROM logs
WHERE block_num BETWEEN 1000 AND 2000
LIMIT 100

-- Use Arrow Flight for large queries (faster than JSON Lines)

-- Check query execution plan
EXPLAIN SELECT * FROM blocks WHERE block_num > 1000000
```

## MetaMask & Wallet Issues

### Cannot connect MetaMask

**Problem**: MetaMask won't connect to local network.

**Solutions**:
1. Add Anvil network to MetaMask:
   - Network Name: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Import test account:
   ```
   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```

3. Reset account if needed:
   - Settings → Advanced → Reset Account

### Transactions stuck or failing

**Problem**: Transactions won't complete in MetaMask.

**Solutions**:
```bash
# Reset Anvil (clears all state)
docker-compose restart anvil

# Reset MetaMask account nonce
# Settings → Advanced → Reset Account

# Check Anvil is producing blocks
cast block latest --rpc-url http://localhost:8545

# Verify sufficient balance
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545
```

## Frontend Application Issues

### TanStack Query not updating

**Problem**: UI doesn't show new data despite polling.

**Solutions**:
```typescript
// Ensure refetchInterval is set
useQuery({
  queryKey: ["data", param],  // Include all dependencies in key
  queryFn: () => fetchData(param),
  refetchInterval: 2000,  // Poll every 2 seconds
  enabled: true,  // Ensure query is enabled
});

// Manually refetch on events
const { refetch } = useQuery(/* ... */);
onTransactionSuccess(() => refetch());

// Check if query is actually running
// Use React DevTools → TanStack Query panel
```

### Effect Atom not refreshing

**Problem**: Atom state not updating.

**Solutions**:
```typescript
// Verify atom family parameters match
const atom = transfersAtom(address);  // Same address?

// Ensure keepAlive is set
useAtomValue(atom, { keepAlive: true });

// Check refresh interval
useAutoRefresh(address, 2000);  // Is this actually running?

// Debug atom state
console.log(atom.get());
```

### CORS errors

**Problem**: Browser blocks requests to Amp server.

**Solutions**:
```typescript
// If using Arrow Flight proxy, ensure CORS is enabled
// Check proxy configuration

// For JSON Lines API, add CORS headers to Amp config
// Or use a proxy in development

// Vite dev server proxy example (vite.config.ts)
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:1603'
    }
  }
});
```

## Arrow Flight Issues

### Failed to get flight info

**Problem**: Arrow Flight client cannot connect.

**Solutions**:
```bash
# Check if Arrow Flight server is running
lsof -i :1602

# Verify amp is running
docker-compose ps amp

# Check Arrow Flight logs
docker-compose logs amp | grep -i flight

# Test connection
grpcurl -plaintext localhost:1602 list

# If using proxy, check proxy is running
docker-compose ps amp-proxy
lsof -i :3002
```

### Arrow data parsing errors

**Problem**: Cannot parse Arrow record batches.

**Solutions**:
```typescript
// Ensure correct Arrow library version
npm install @apache-arrow/flight@latest

// Handle null values properly
const value = batch.get('field')?.toString() ?? 'default';

// Check schema matches expectations
console.log(batch.schema.toString());

// Process batches correctly
const allData = batches.flatMap(batch => batch.toArray());
```

## Performance Issues

### Slow query performance

**Problem**: Queries take too long to execute.

**Solutions**:
```sql
-- Use LIMIT and WHERE to reduce data scanned
SELECT * FROM blocks
WHERE block_num > 1000000
LIMIT 100

-- Select only needed columns (not SELECT *)
SELECT block_num, hash, timestamp FROM blocks

-- Use Arrow Flight instead of JSON Lines for large queries

-- Check if data is properly partitioned
-- Amp partitions data by block_num automatically

-- Add indexes if querying custom fields frequently
```

### High memory usage

**Problem**: Amp server consuming too much memory.

**Solutions**:
```toml
# Adjust dump parameters in config
[dump]
partition_size_mb = 2048  # Reduce if low on memory
n_jobs = 2  # Reduce parallel jobs

# Limit query result sizes
max_rows = 1000

# Use streaming queries instead of loading all data
```

### Slow data extraction

**Problem**: `ampd dump` taking too long.

**Solutions**:
```bash
# Increase parallel jobs
ampd dump --dataset my_dataset -j 4

# Use smaller partition size
ampd dump --dataset my_dataset --partition-size 1024

# Check source performance
# For RPC: use a faster endpoint
# For Firehose: check network bandwidth

# Resume interrupted extraction (automatic)
ampd dump --dataset my_dataset  # Resumes from last checkpoint
```

## Debugging Tips

### Enable debug logging

```bash
# Set log level
export AMP_LOG=debug

# Or in config.toml
log_level = "debug"

# Start with verbose logging
ampd server --log-level debug

# Filter logs
ampd server 2>&1 | grep ERROR
```

### Check service health

```bash
# Health endpoints
curl http://localhost:1610/health  # Admin API
curl http://localhost:4000/health  # GraphQL API

# Check all services
docker-compose ps

# View recent logs
docker-compose logs --tail=50 amp
```

### Verify data files

```bash
# Check Parquet files exist
ls -lh data_dir/

# Read Parquet file metadata
parquet-tools meta data_dir/blocks/block_0.parquet

# Query Parquet files directly
duckdb -c "SELECT * FROM 'data_dir/blocks/*.parquet' LIMIT 10"
```

## Getting Help

If you're still experiencing issues:

1. **Check logs**: Look for error messages in service logs
2. **Verify versions**: Ensure all components are using compatible versions
3. **Minimal reproduction**: Try to reproduce with minimal example
4. **Search issues**: Check GitHub issues for similar problems
5. **Ask for help**: Open an issue with:
   - Error messages and logs
   - Configuration files
   - Steps to reproduce
   - Expected vs actual behavior

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `Table not found` | Dataset not registered | Run `ampd dev` to register dataset |
| `Connection refused` | Service not running | Check with `docker-compose ps` |
| `Parse error` | Invalid SQL syntax | Check SQL syntax, use proper quoting |
| `Authentication failed` | Invalid token | Run `amp auth login` |
| `Type mismatch` | Wrong data type in query | Use proper CAST or check schema |
| `Permission denied` | File/binary not executable | Run `chmod +x` on file |
| `Port already in use` | Port conflict | Stop conflicting service or change port |
| `Out of memory` | Insufficient RAM | Reduce parallel jobs or partition size |

## Next Steps

- [Getting Started](getting-started.md) - Installation and setup
- [Configuration](config.md) - Detailed configuration guide
- [Querying Data](querying-data.md) - Query patterns and optimization
- [Examples](examples.md) - Working example applications
