import { Bolt } from '../../src/Bolt';
import { WebSocketChannel } from '../../src/connection/WebSocketChannel';
import { Client } from '../../src/helpers/Client';
import { jest, expect, describe, test, beforeEach, afterEach } from '@jest/globals';

const URI = process.env.BOLT_URI ?? 'bolt://localhost:7687';
const AUTH = {
    scheme: process.env.BOLT_AUTH_SCHEME ?? 'basic',
    principal: process.env.BOLT_USER ?? 'neo4j',
    credentials: process.env.BOLT_PASSWORD ?? 'nothing123',
};
const VERSION = process.env.BOLT_VERSION ?? null;

jest.setTimeout(15000);

describe('Client', () => {
    let conn: WebSocketChannel;
    let client: Client;

    beforeEach(async () => {
        conn = new WebSocketChannel();
        if (VERSION) {
            const [major, minor = 0, range = 0] = VERSION.split('.').map(Number);
            Bolt.versions = [{ major, minor, range }];
        }
        const protocol = await Bolt.connect(new WebSocketChannel(), URI);
        client = new Client(protocol);
        await client.login(AUTH);
    });

    afterEach(() => {
        conn.disconnect();
    });

    describe('query()', () => {
        test('returns a single record for a basic RETURN query', async () => {
            const records = await client.query('RETURN 1 AS num');
            expect(records).toEqual([{ num: 1 }]);
        });

        test('returns multiple records', async () => {
            const records = await client.query('UNWIND [1, 2, 3] AS n RETURN n');
            expect(records).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
        });

        test('substitutes parameters', async () => {
            const records = await client.query('RETURN $x AS val', { x: 42 });
            expect(records).toEqual([{ val: 42 }]);
        });

        test('returns empty array when no rows match', async () => {
            const records = await client.query('MATCH (n:NonExistentLabel_ClientTest_XYZ) RETURN n');
            expect(records).toEqual([]);
        });

        test('returns multiple columns per row', async () => {
            const records = await client.query('RETURN 1 AS a, 2 AS b');
            expect(records).toEqual([{ a: 1, b: 2 }]);
        });
    });

    (VERSION && parseInt(VERSION.split('.')[0], 10) < 3 ? describe.skip : describe)('beginTransaction()', () => {
        test('returns a successful response', async () => {
            const resp = await client.beginTransaction();
            expect(resp.isSuccess).toBe(true);
            await client.rollback();
        });

        describe('query() inside transaction', () => {
            test('returns records inside a transaction', async () => {
                await client.beginTransaction();
                const records = await client.query('RETURN 2 AS val');
                expect(records).toEqual([{ val: 2 }]);
                await client.rollback();
            });

            test('supports parameters inside a transaction', async () => {
                await client.beginTransaction();
                const records = await client.query('RETURN $n AS num', { n: 99 });
                expect(records).toEqual([{ num: 99 }]);
                await client.rollback();
            });
        });

        describe('commit()', () => {
            test('returns a successful response', async () => {
                await client.beginTransaction();
                const resp = await client.commit();
                expect(resp.isSuccess).toBe(true);
            });

            test('allows running queries after commit', async () => {
                await client.beginTransaction();
                await client.commit();
                const records = await client.query('RETURN 1 AS num');
                expect(records).toEqual([{ num: 1 }]);
            });

            test('can start another transaction after commit', async () => {
                await client.beginTransaction();
                await client.commit();
                const beginResp = await client.beginTransaction();
                expect(beginResp.isSuccess).toBe(true);
                await client.rollback();
            });

            test('committed writes are visible after commit', async () => {
                const label = `ClientTestNode_${Date.now()}`;
                await client.beginTransaction();
                await client.query(`CREATE (:${label} {ok: true})`);
                await client.commit();

                try {
                    const records = await client.query(`MATCH (n:${label}) RETURN n.ok AS ok`);
                    expect(records).toEqual([{ ok: true }]);
                } finally {
                    await client.query(`MATCH (n:${label}) DELETE n`);
                }
            });
        });

        describe('rollback()', () => {
            test('returns a successful response', async () => {
                await client.beginTransaction();
                const resp = await client.rollback();
                expect(resp.isSuccess).toBe(true);
            });

            test('allows running queries after rollback', async () => {
                await client.beginTransaction();
                await client.rollback();
                const records = await client.query('RETURN 1 AS num');
                expect(records).toEqual([{ num: 1 }]);
            });

            test('can start another transaction after rollback', async () => {
                await client.beginTransaction();
                await client.rollback();
                const beginResp = await client.beginTransaction();
                expect(beginResp.isSuccess).toBe(true);
                await client.rollback();
            });

            test('rolled-back writes are not persisted', async () => {
                const label = `ClientTestNode_${Date.now()}`;
                await client.beginTransaction();
                await client.query(`CREATE (:${label})`);
                await client.rollback();

                const records = await client.query(`MATCH (n:${label}) RETURN n`);
                expect(records).toEqual([]);
            });
        });
    });
});
