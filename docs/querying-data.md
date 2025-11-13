# Querying Data with Amp

Amp provides multiple interfaces for querying blockchain data. This guide covers the different query methods, patterns, and best practices.

## Query Interfaces

Amp offers two primary query interfaces:

### 1. JSON Lines API (HTTP)

Simple HTTP interface that returns newline-delimited JSON (NDJSON).

- **Port**: 1603 (default)
- **Protocol**: HTTP POST
- **Format**: Newline-delimited JSON
- **Use case**: Simple queries, web applications, REST APIs

### 2. Arrow Flight (gRPC)

High-performance binary protocol using Apache Arrow for columnar data transfer.

- **Port**: 1602 (default)
- **Protocol**: gRPC
- **Format**: Apache Arrow batches
- **Use case**: Analytics, high-throughput queries, large datasets

## JSON Lines API

### Basic Usage

```bash
# Simple query
curl -X POST http://localhost:1603 \
  -H "Content-Type: text/plain" \
  -d "SELECT * FROM my_dataset.blocks LIMIT 10"
```

### JavaScript/TypeScript Client

```typescript
async function queryJsonLines<T>(sql: string): Promise<T[]> {
  const response = await fetch("http://localhost:1603", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: sql,
  });

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }

  const text = await response.text();
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

// Usage
const blocks = await queryJsonLines<Block>(
  "SELECT block_num, timestamp, hash FROM my_dataset.blocks LIMIT 10"
);
```

### With TanStack Query

```typescript
import { useQuery } from "@tanstack/react-query";

function useBlocks(limit: number = 10) {
  return useQuery({
    queryKey: ["blocks", limit],
    queryFn: () =>
      queryJsonLines(
        `SELECT * FROM my_dataset.blocks ORDER BY block_num DESC LIMIT ${limit}`
      ),
    refetchInterval: 2000, // Poll every 2 seconds
    placeholderData: (prev) => prev, // Keep previous data during refetch
  });
}

// In component
function BlocksList() {
  const { data, isLoading, error } = useBlocks(10);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map((block) => (
        <li key={block.block_num}>Block #{block.block_num}</li>
      ))}
    </ul>
  );
}
```

### Response Format

Responses are newline-delimited JSON. Each line is a separate JSON object:

```json
{"block_num":"1","timestamp":1234567890,"hash":"0x..."}
{"block_num":"2","timestamp":1234567891,"hash":"0x..."}
{"block_num":"3","timestamp":1234567892,"hash":"0x..."}
```

**Note**: Responses are always uncompressed, regardless of `accept-encoding` headers.

## Arrow Flight API

### Setup

```bash
# Install Arrow Flight client
npm install @apache-arrow/flight
```

### Basic Usage (Effect-TS)

```typescript
import { FlightClient } from "@apache-arrow/flight";
import { Effect, pipe } from "effect";
import { NodeHttpClient } from "@effect/platform-node";

// Create client
const createClient = () =>
  Effect.sync(() => FlightClient.connect("localhost:1602"));

// Execute query
const query = (sql: string) =>
  pipe(
    createClient(),
    Effect.flatMap((client) =>
      Effect.tryPromise(() =>
        client.doGet({
          ticket: { ticket: Buffer.from(sql) },
        })
      )
    ),
    Effect.flatMap((stream) => Effect.tryPromise(() => stream.toArray())),
    Effect.provide(NodeHttpClient.layer)
  );

// Run query
const program = pipe(
  query("SELECT * FROM my_dataset.blocks LIMIT 10"),
  Effect.map((batches) => {
    // Process Arrow record batches
    return batches.flatMap((batch) => batch.toArray());
  })
);

Effect.runPromise(program);
```

### Fastify Backend Integration

```typescript
import Fastify from "fastify";
import { FlightClient } from "@apache-arrow/flight";

const fastify = Fastify({ logger: true });
const flightClient = FlightClient.connect("localhost:1602");

// Execute query endpoint
fastify.post("/api/queries/execute", async (request, reply) => {
  const { query } = request.body;

  try {
    const stream = await flightClient.doGet({
      ticket: { ticket: Buffer.from(query) },
    });

    const batches = await stream.toArray();
    const data = batches.flatMap((batch) => batch.toArray());

    return {
      data,
      row_count: data.length,
    };
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});
```

### Performance Benefits

Arrow Flight provides:
- **Sub-second queries** on large datasets
- **Columnar format** optimized for analytics
- **Zero-copy** data transfer
- **Streaming results** for memory efficiency
- **Type preservation** (no JSON serialization overhead)

## SQL Query Patterns

### Basic Queries

```sql
-- Select all columns
SELECT * FROM my_dataset.blocks LIMIT 10

-- Select specific columns
SELECT block_num, timestamp, hash FROM my_dataset.blocks

-- Filter by condition
SELECT * FROM my_dataset.logs
WHERE contract_address = decode('5fbdb2315678afecb367f032d93f642f64180aa3', 'hex')

-- Order results
SELECT * FROM my_dataset.blocks
ORDER BY block_num DESC
LIMIT 10

-- Aggregate functions
SELECT
  COUNT(*) as total_blocks,
  MIN(block_num) as first_block,
  MAX(block_num) as last_block
FROM my_dataset.blocks
```

### Working with ERC20 Transfers

```sql
-- Get all Transfer events
SELECT
  block_num,
  tx_hash,
  contract_address,
  decoded_event->>'from' as from_address,
  decoded_event->>'to' as to_address,
  decoded_event->>'value' as value
FROM my_dataset.logs
WHERE topic0 = evm_topic('Transfer(address,address,uint256)')
ORDER BY block_num DESC

-- Filter by address (received transfers)
SELECT *
FROM my_dataset.logs
WHERE topic0 = evm_topic('Transfer(address,address,uint256)')
  AND decoded_event->>'to' = lower('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')

-- Calculate balance (sent + received)
WITH transfers AS (
  SELECT
    CASE
      WHEN decoded_event->>'from' = lower('0xf39fd...') THEN -CAST(decoded_event->>'value' AS BIGINT)
      WHEN decoded_event->>'to' = lower('0xf39fd...') THEN CAST(decoded_event->>'value' AS BIGINT)
    END as amount
  FROM my_dataset.logs
  WHERE topic0 = evm_topic('Transfer(address,address,uint256)')
    AND (decoded_event->>'from' = lower('0xf39fd...') OR decoded_event->>'to' = lower('0xf39fd...'))
)
SELECT SUM(amount) as balance FROM transfers
```

### Using User-Defined Functions

Amp provides several built-in UDFs for working with EVM data:

```sql
-- Decode event log
SELECT
  evm_decode_log(
    'Transfer(address,address,uint256)',
    data,
    ARRAY[topic1, topic2, topic3]
  ) as decoded
FROM my_dataset.logs

-- Get event topic hash
SELECT * FROM my_dataset.logs
WHERE topic0 = evm_topic('Transfer(address,address,uint256)')

-- Execute RPC call during query
SELECT
  eth_call(
    'balanceOf(address)',
    ARRAY['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
    '0x5fbdb2315678afecb367f032d93f642f64180aa3'
  ) as balance
FROM my_dataset.blocks
WHERE block_num = 100

-- Decode function parameters
SELECT
  evm_decode_params(
    'transfer(address,uint256)',
    input
  ) as params
FROM my_dataset.transactions
WHERE to_address = decode('5fbdb...', 'hex')
```

See [User-Defined Functions](udfs.md) for complete UDF reference.

### Joins and Complex Queries

```sql
-- Join blocks and transactions
SELECT
  b.block_num,
  b.timestamp,
  t.tx_hash,
  t.from_address,
  t.to_address,
  t.value
FROM my_dataset.blocks b
JOIN my_dataset.transactions t ON b.block_num = t.block_num
WHERE b.block_num > 1000000
ORDER BY b.block_num DESC
LIMIT 100

-- Subqueries
SELECT *
FROM my_dataset.logs
WHERE block_num IN (
  SELECT block_num
  FROM my_dataset.blocks
  WHERE timestamp > 1704067200000
)
```

## Query Optimization

### Best Practices

1. **Use LIMIT**: Always limit results for testing
   ```sql
   SELECT * FROM large_table LIMIT 100
   ```

2. **Filter early**: Apply WHERE clauses to reduce data scanned
   ```sql
   -- Good
   SELECT * FROM logs
   WHERE block_num BETWEEN 1000 AND 2000
     AND topic0 = evm_topic('Transfer(address,address,uint256)')

   -- Bad (scans all blocks first)
   SELECT * FROM logs
   WHERE topic0 = evm_topic('Transfer(address,address,uint256)')
   ```

3. **Select only needed columns**: Don't use `SELECT *` unless necessary
   ```sql
   -- Good
   SELECT block_num, timestamp, hash FROM blocks

   -- Bad
   SELECT * FROM blocks
   ```

4. **Use indexes**: Amp automatically indexes common fields like `block_num`

5. **Batch queries**: Fetch multiple rows at once instead of many small queries

### Performance Tips

- **Arrow Flight** is 10-100x faster than JSON Lines for large result sets
- **Parquet** columnar format is optimized for analytical queries
- **Predicate pushdown** automatically filters data at storage level
- **Projection pushdown** only reads columns you SELECT

## Schema Inspection

### Discover Available Tables

```sql
-- List all tables in a dataset
SHOW TABLES FROM my_dataset

-- Get table schema
DESCRIBE my_dataset.blocks
```

### Common Table Schemas

**Blocks table**:
- `block_num` (BIGINT)
- `timestamp` (BIGINT) - Unix timestamp in milliseconds
- `hash` (BINARY)
- `parent_hash` (BINARY)
- `state_root` (BINARY)
- `transactions_root` (BINARY)
- `receipts_root` (BINARY)
- `gas_used` (BIGINT)
- `gas_limit` (BIGINT)

**Transactions table**:
- `block_num` (BIGINT)
- `tx_index` (INT)
- `tx_hash` (BINARY)
- `from_address` (BINARY)
- `to_address` (BINARY)
- `value` (VARCHAR)
- `gas` (BIGINT)
- `gas_price` (VARCHAR)
- `input` (BINARY)
- `nonce` (BIGINT)

**Logs table**:
- `block_num` (BIGINT)
- `tx_index` (INT)
- `log_index` (INT)
- `tx_hash` (BINARY)
- `contract_address` (BINARY)
- `topic0` (BINARY)
- `topic1` (BINARY)
- `topic2` (BINARY)
- `topic3` (BINARY)
- `data` (BINARY)
- `decoded_event` (JSON) - Auto-decoded if ABI provided

See [Data Schemas](schemas/evm-rpc.md) for complete schema reference.

## Error Handling

### Common Errors

**"Table not found"**
```
Error: Table 'my_dataset.blocks' not found
```
Solution: Ensure dataset is registered and data is indexed

**"Parse error"**
```
Error: SQL parse error: Expected identifier, found keyword
```
Solution: Check SQL syntax, escape reserved keywords

**"Type mismatch"**
```
Error: Cannot cast VARCHAR to BIGINT
```
Solution: Use explicit CAST or verify data types

### Handling Errors in Code

```typescript
try {
  const data = await queryJsonLines(sql);
  return data;
} catch (error) {
  if (error.message.includes("Table not found")) {
    console.error("Dataset not registered");
  } else if (error.message.includes("Parse error")) {
    console.error("Invalid SQL syntax");
  } else {
    console.error("Query failed:", error);
  }
  throw error;
}
```

## Real-time Updates

### Polling Pattern

```typescript
// TanStack Query
useQuery({
  queryKey: ["transfers", address],
  queryFn: () => fetchTransfers(address),
  refetchInterval: 2000, // Poll every 2 seconds
});

// Effect Atom
const transfersAtom = Atom.make({
  /* ... */
});
useAutoRefresh(transfersAtom, 2000);
```

### Event-Driven Updates

For production applications, consider:
- WebSocket subscriptions
- Server-Sent Events (SSE)
- Amp's streaming capabilities
- PostgreSQL LISTEN/NOTIFY via ampsync

## Production Considerations

1. **Connection Pooling**: Reuse HTTP clients and Arrow Flight connections
2. **Caching**: Cache query results with appropriate TTL
3. **Rate Limiting**: Implement rate limits on query endpoints
4. **Query Validation**: Validate and sanitize SQL before execution
5. **Monitoring**: Track query performance and errors
6. **Timeout Handling**: Set appropriate timeouts for long-running queries

## Next Steps

- [User-Defined Functions](udfs.md) - Learn about custom SQL functions
- [Data Schemas](schemas/evm-rpc.md) - Understand data source schemas
- [Examples](examples.md) - See complete working examples
- [Configuration](config.md) - Configure datasets and tables
