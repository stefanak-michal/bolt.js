const { Bolt, WebSocketChannel, Client } = require('../../dist/bolt.js');

const URI = process.env.BOLT_URI ?? 'bolt://localhost:7687';
const AUTH = {
    scheme: process.env.BOLT_AUTH_SCHEME ?? 'basic',
    principal: process.env.BOLT_USER ?? 'neo4j',
    credentials: process.env.BOLT_PASSWORD ?? 'nothing123',
};

jest.setTimeout(15000);

let conn;
let client;

beforeEach(async () => {
    conn = new WebSocketChannel();
    const protocol = await Bolt.connect(conn, URI);
    client = new Client(protocol);
    await client.login(AUTH);
});

afterEach(() => {
    conn.disconnect();
});

test('RETURN 1 AS num', async () => {
    const records = await client.query('RETURN 1 AS num');
    expect(records).toEqual([{ num: 1 }]);
});

test('RETURN multiple rows', async () => {
    const records = await client.query('UNWIND [1, 2, 3] AS n RETURN n');
    expect(records).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
});

test('RETURN with parameter', async () => {
    const records = await client.query('RETURN $x AS val', { x: 42 });
    expect(records).toEqual([{ val: 42 }]);
});
