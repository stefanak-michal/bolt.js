import { jest, expect, test } from '@jest/globals';
import Node from '../src/protocol/structures/v5/Node';
import Relationship from '../src/protocol/structures/v5/Relationship';
import { connect } from './utils';

jest.setTimeout(15000);

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
        p.pull();

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
        p.pull();

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
        p.run('RETURN 1 as num');
        p.pull();

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
