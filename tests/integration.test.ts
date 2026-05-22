import { Bolt } from '../src/Bolt';
import { WebSocketChannel } from '../src/connection/WebSocketChannel';
import { jest, expect, test } from '@jest/globals';
import Node from '../src/protocol/structures/v5/Node';
import Relationship from '../src/protocol/structures/v5/Relationship';

const HOST = 'localhost';
const PORT = 7687;
const USER = 'neo4j';
const PASS = 'nothing123';

jest.setTimeout(15000);

async function connect() {
    const conn = new WebSocketChannel();
    const protocol = await Bolt.connect(conn, HOST, PORT);
    const p = protocol as any;

    if (typeof p.logon === 'function') {
        // v5.1+: HELLO without auth, then LOGON
        p.hello();
        const helloResp = await protocol.getResponse();
        if (helloResp.isFailure) throw new Error(`HELLO failed: ${JSON.stringify(helloResp.content)}`);

        p.logon({ scheme: 'basic', principal: USER, credentials: PASS });
        const logonResp = await protocol.getResponse();
        if (logonResp.isFailure) throw new Error(`LOGON failed: ${JSON.stringify(logonResp.content)}`);
    } else {
        // v3/v4/v5.0: HELLO with auth
        p.hello({ auth_token: { scheme: 'basic', principal: USER, credentials: PASS } });
        const helloResp = await protocol.getResponse();
        if (helloResp.isFailure) throw new Error(`HELLO failed: ${JSON.stringify(helloResp.content)}`);
    }

    return { protocol, conn };
}

test('create two nodes with relationship in transaction then rollback', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;

    try {
        p.begin();
        const beginResp = await protocol.getResponse();
        expect(beginResp.isSuccess).toBe(true);

        p.run('CREATE (a:Person {name: $name1})-[r:KNOWS]->(b:Person {name: $name2}) RETURN a, b, r', {
            name1: 'Alice',
            name2: 'Bob',
        });
        p.pull({ n: -1 });

        const runResp = await protocol.getResponse();
        expect(runResp.isSuccess).toBe(true);
        expect(runResp.content).toHaveProperty('fields');
        expect(runResp.content['fields']).toEqual(['a', 'b', 'r']);

        for await (const _resp of protocol.getResponses()) {
            if (_resp.isRecord) {
                expect(_resp.content[0]).toBeInstanceOf(Node);
                expect(_resp.content[1]).toBeInstanceOf(Node);
                expect(_resp.content[2]).toBeInstanceOf(Relationship);
            }
        }

        p.rollback();
        const rollbackResp = await protocol.getResponse();
        expect(rollbackResp.isSuccess).toBe(true);

        // Verify nodes were not persisted
        p.run('MATCH (p:Person) WHERE p.name IN [$name1, $name2] RETURN count(p) as cnt', {
            name1: 'Alice',
            name2: 'Bob',
        });
        p.pull({ n: -1 });

        const verifyRunResp = await protocol.getResponse();
        expect(verifyRunResp.isSuccess).toBe(true);
        expect(verifyRunResp.content['fields']).toEqual(['cnt']);

        for await (const _resp of protocol.getResponses()) {
            if (_resp.isRecord) {
                expect(_resp.content[0]).toBe(0);
            }
        }
    } finally {
        conn.disconnect();
    }
});

test('connect, authenticate, RETURN 1 as num', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;

    try {
        p.run('RETURN 1 as num', {}, {});
        p.pull({ n: -1 });

        const runResp = await protocol.getResponse();
        expect(runResp.isSuccess).toBe(true);
        const keys = runResp.content['fields'] as string[];
        expect(keys).toEqual(['num']);

        const records: Record<string, unknown>[] = [];
        for await (const resp of protocol.getResponses()) {
            if (resp.isRecord) {
                const values = Object.values(resp.content);
                const row: Record<string, unknown> = {};
                keys.forEach((k, i) => {
                    row[k] = values[i];
                });
                records.push(row);
            }
        }

        expect(records).toEqual([{ num: 1 }]);
    } finally {
        conn.disconnect();
    }
});
