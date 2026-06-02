# Bolt protocol js driver

JavaScript/TypeScript library for communication with graph databases over WebSocket using the Bolt protocol specification. Bolt protocol was created by [Neo4j](https://neo4j.com/) and documentation is available at [https://www.neo4j.com/docs/bolt/current/](https://www.neo4j.com/docs/bolt/current/). This library is aimed to be low level, support all available versions and keep up with protocol messages architecture and specifications.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z5ABMLW)

[![NPM Version](https://img.shields.io/npm/v/%40stefanak-michal%2Fbolt-protocol)](https://www.npmjs.com/package/@stefanak-michal/bolt-protocol)
[![GitHub commits since latest release](https://img.shields.io/github/commits-since/stefanak-michal/bolt.js/latest?cacheSeconds=0)](https://github.com/stefanak-michal/bolt.js/releases/latest)
[![NPM Downloads](https://img.shields.io/npm/dw/%40stefanak-michal%2Fbolt-protocol)](https://www.npmjs.com/package/@stefanak-michal/bolt-protocol)

:warning: This project was made as alternative for Neo4j official library which by how it's structured is vendor-locked without support for older bolt versions.

## :label: Version support

This library supports **Bolt <= 6**.

## :books: Supported ecosystems

- [Neo4j](https://www.neo4j.com/)
- [Memgraph](https://memgraph.com/)
- [Amazon Neptune](https://docs.aws.amazon.com/neptune/)
- [LadybugDB](https://github.com/LadybugDB/bolt4rs)
- [NornicDB](https://github.com/orneryd/NornicDB)
- [ArcadeDB](https://arcadedb.com/)
- [DozerDB](https://dozerdb.org/)
- [ONgDB](https://graphfoundation.org/ongdb/)

_This library doesn't guarantee that each ecosystem has Bolt protocol implemented correctly._

## :white_check_mark: Requirements

- Node.js 18+
- TypeScript 5+ (if using TypeScript)

## :floppy_disk: Installation

Within your node.js project use following command:

```bash
npm install @stefanak-michal/bolt-protocol
```

Or in your website include following code:

```html
<script src="https://cdn.jsdelivr.net/npm/@stefanak-michal/bolt-protocol@1"></script>
```

## :desktop_computer: Usage

Concept of usage is based on Bolt messages. Bolt messages are mapped 1:1 as protocol methods. Available protocol methods depend on the Bolt version. Communication works in [pipeline](https://www.neo4j.com/docs/bolt/current/bolt/message/#pipelining) and you can chain multiple Bolt messages before consuming responses from the server.

The main `Bolt` class handles the initial handshake and returns the appropriate protocol version instance. Basic usage consists of query execution and fetching responses split in two methods. First message `run` is for sending queries. Second message `pull` is for fetching the response from the executed query. The response for `pull` always contains n+1 rows because the last entry is a `success` message with meta information.

:information_source: More info about available Bolt messages: https://www.neo4j.com/docs/bolt/current/bolt/message/

### Available methods

**Bolt class**

| Method         | Description                                                                                           | Return      |
| -------------- | ----------------------------------------------------------------------------------------------------- | ----------- |
| `Bolt.connect` | Static factory. Creates a connection, executes the handshake and returns a protocol version instance. | `AProtocol` |

**`Bolt.connect` arguments**

| Argument     | Type          | Default                    | Description                                                      |
| ------------ | ------------- | -------------------------- | ---------------------------------------------------------------- |
| `connection` | `IConnection` | `new WebSocketChannel()`   | Transport channel. Provide a custom implementation if needed.    |
| `uri`        | `string`      | `bolt://localhost:7687`    | Full connection URI including scheme, host, and optional port.   |

**URI schemes**

| Scheme      | Encryption                       | Notes              |
| ----------- | -------------------------------- | ------------------ |
| `bolt`      | No                               | Default            |
| `bolt+s`    | Yes (CA-signed certificates)     |                    |
| `bolt+ssc`  | Yes (CA and self-signed)         |                    |
| `neo4j`     | No                               | Routing-aware      |
| `neo4j+s`   | Yes (CA-signed certificates)     | Default for Aura   |
| `neo4j+ssc` | Yes (CA and self-signed)         |                    |

**Protocol class**

| Method         | Description                                           |
| -------------- | ----------------------------------------------------- |
| `hello`        | Initialize connection with the server                 |
| `logon`        | Authenticate the user (Bolt 5.1+)                     |
| `logoff`       | Log out the authenticated user (Bolt 5.1+)            |
| `run`          | Execute a query. Response contains meta information.  |
| `pull`         | Pull results from an executed query                   |
| `discard`      | Discard results waiting for pull                      |
| `begin`        | Start a transaction                                   |
| `commit`       | Commit the current transaction                        |
| `rollback`     | Rollback the current transaction                      |
| `reset`        | Reset the connection state                            |
| `route`        | Fetch cluster routing information                     |
| `telemetry`    | Send telemetry data (Bolt 5.4+)                       |
| `getResponse`  | Await and return the next pending server response     |
| `getResponses` | Async generator yielding all pending server responses |
|                |                                                       |
| `init`         | @see hello (Bolt 1/2)                                 |
| `pullAll`      | @see pull (Bolt 1/2)                                  |
| `discardAll`   | @see discard (Bolt 1/2)                               |

Multiple methods accept an `extra` argument. This argument can contain any key-value pairs defined by the Bolt specification. The content of `extra` changed across Neo4j versions — check the Bolt documentation for the specific version you are working with.

### Authentication

`logon` (Bolt 5.1+) and `hello` (Bolt < 5.1) both accept an `auth` object. The object must contain a `scheme` key and optionally `principal` and `credentials` depending on the chosen scheme.

| scheme     | principal | credentials |
| ---------- | --------- | ----------- |
| `none`     |           |             |
| `basic`    | username  | password    |
| `bearer`   |           | token       |
| `kerberos` |           | token       |

### Transactions

Bolt from version 3 supports explicit transactions via the following methods:

- `begin`
- `commit`
- `rollback`

_`run` executes a query in an auto-commit transaction if no explicit transaction is open._

### Example

```typescript
import { Bolt } from 'bolt.js';

// Connect and negotiate the protocol version
// Defaults to WebSocketChannel and uri bolt://localhost:7687
const protocol = await Bolt.connect();

// Initialize connection with the server
let response = await protocol.hello({ user_agent: 'my-app/1.0' });
// verify response for successful initialization

// Authenticate (Bolt 5.1+)
response = await protocol.logon({ scheme: 'basic', principal: 'neo4j', credentials: 'neo4j' });
// verify response for successful login

// Pipeline two messages: execute a query with parameters, then pull records
protocol.run('RETURN $a AS num, $b AS str', { a: 123, b: 'text' });
protocol.pull();

// Consume all pending server responses
for await (const resp of protocol.getResponses()) {
    // resp is an instance of Response
    // First response:  SUCCESS for RUN
    // Second response: RECORD for PULL (one per row)
    // Third response:  SUCCESS for PULL
    if (resp.isRecord) {
        console.log(resp.content);
    }
}
```

## :package: Bundle usage

The library is also available as a pre-built UMD bundle:

```html
<script src="dist/bolt.js"></script>
<script>
    const { Bolt, WebSocketChannel } = BoltDriver;
</script>
```

## :busts_in_silhouette: Client helper class

The library includes a high-level `Client` helper class for simplified interaction with a graph database. It wraps common operations (authentication, queries, and transactions) so you don't have to manage protocol messages and responses manually.

**Constructor**

```typescript
new Client(protocol: AProtocol)
```

**Methods**

| Method                               | Description                                                 | Return                                    |
| ------------------------------------ | ----------------------------------------------------------- | ----------------------------------------- |
| `login(auth: AuthToken)`             | Authenticate. Automatically adapts to the protocol version. | `Promise<Response \| Response[] \| void>` |
| `logout()`                           | Log out (Bolt 5.1+).                                        | `Promise<Response>`                       |
| `query(cypher, parameters?, extra?)` | Execute a query and return all rows as arrays of values.    | `Promise<Record<string, unknown>[]>`      |
| `beginTransaction(extra?)`           | Begin a transaction.                                        | `Promise<Response>`                       |
| `commit()`                           | Commit the current transaction.                             | `Promise<Response>`                       |
| `rollback()`                         | Rollback the current transaction.                           | `Promise<Response>`                       |

**Example**

```typescript
import { Bolt, WebSocketChannel, Client } from 'bolt.js';

const protocol = await Bolt.connect();
const client = new Client(protocol);
await client.login({ scheme: 'basic', principal: 'neo4j', credentials: 'neo4j' });

// Returns all rows as arrays keyed by field name
const rows = await client.query('MATCH (n:Person) RETURN n.name AS name, n.age AS age');
// rows = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]

// Transaction example
await client.beginTransaction();
await client.query('CREATE (n:Person {name: $name})', { name: 'Charlie' });
await client.commit(); // or client.rollback()
```

## :chains: Connection

`Bolt.connect` accepts a connection object that implements `IConnection`. The library provides one built-in implementation.

**`WebSocketChannel`**

Uses the WebSocket protocol, which makes it compatible with browsers as well as Node.js. It handles Bolt message framing (chunking and dechunking) internally.

```typescript
const conn = new WebSocketChannel();
const protocol = await Bolt.connect(conn, 'bolt://localhost:7687');
```

`Bolt.connect` can also be called with no arguments. It defaults to `WebSocketChannel` and URI `bolt://localhost:7687`:

```typescript
const protocol = await Bolt.connect();
```

### Encrypted connections

Use a URI scheme that implies encryption. See the URI schemes table in the [Available methods](#available-methods) section for the full list.

```typescript
const protocol = await Bolt.connect(conn, 'neo4j+s://mydb.databases.neo4j.io');
```

## :vertical_traffic_light: Server state

Server state is not reported by the server but is derived from received responses. You can access the current state through `protocol.serverState`. The property is updated with every `getResponse` / `getResponses` call.

## :bar_chart: Cypher type mapping

| Neo4j               | JavaScript                                     |
| ------------------- | ---------------------------------------------- |
| Null                | `null`                                         |
| Boolean             | `boolean`                                      |
| Integer             | `number` or `BigInt`                           |
| Float               | `number`                                       |
| String              | `string`                                       |
| List                | `Array`                                        |
| Dictionary          | plain `object`                                 |
| Node                | `Node` structure class                         |
| Relationship        | `Relationship` structure class                 |
| UnboundRelationship | `UnboundRelationship` structure class          |
| Path                | `Path` structure class                         |
| Date / Time etc.    | Temporal structure classes (`Date`, `Time`, …) |
| Point               | `Point2D` / `Point3D` structure classes        |
| Vector _(Bolt 6)_   | `Vector` structure class                       |

### Integer vs Float

JavaScript has a single `number` type, so the library infers the Bolt type automatically: a number with no decimal part is sent as **Integer**, a number with a decimal part is sent as **Float**.

When you need to override this — for example, sending `5` as a Float or truncating `3.9` to an Integer — wrap the value in the provided helper classes:

```typescript
import { Integer, Float } from '@stefanak-michal/bolt-protocol';

// Sent as Bolt Float even though the value has no decimal part
protocol.run('CREATE (n:Node {x: $x})', { x: new Float(5) });

// Sent as Bolt Integer — decimal part is truncated
protocol.run('CREATE (n:Node {count: $count})', { count: new Integer(3.9) });
```

These wrappers work anywhere a value is accepted: query parameters, list elements, dictionary values, and nested structures.
