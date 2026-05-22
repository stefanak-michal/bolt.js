import { Bolt } from '../../src/Bolt';
import { WebSocketChannel } from '../../src/connection/WebSocketChannel';
import { Client, Transaction } from '../../src/helpers/Client';
import { jest, expect, describe, test, beforeEach, afterEach } from '@jest/globals';

const HOST = process.env.BOLT_HOST ?? 'localhost';
const PORT = parseInt(process.env.BOLT_PORT ?? '7687', 10);
const AUTH = {
    scheme: process.env.BOLT_AUTH_SCHEME ?? 'basic',
    principal: process.env.BOLT_USER ?? 'neo4j',
    credentials: process.env.BOLT_PASSWORD ?? 'nothing123',
};

jest.setTimeout(15000);

describe('Client', () => {
    let conn: WebSocketChannel;
    let client: Client;

    beforeEach(async () => {
        conn = new WebSocketChannel();
        const protocol = await Bolt.connect(conn, HOST, PORT);
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

    describe('beginTransaction()', () => {
        test('returns a Transaction instance', async () => {
            const tx = await client.beginTransaction();
            expect(tx).toBeInstanceOf(Transaction);
            await tx.rollback();
        });

        describe('Transaction.run()', () => {
            test('returns records inside a transaction', async () => {
                const tx = await client.beginTransaction();
                const records = await tx.run('RETURN 2 AS val');
                expect(records).toEqual([{ val: 2 }]);
                await tx.rollback();
            });

            test('supports parameters inside a transaction', async () => {
                const tx = await client.beginTransaction();
                const records = await tx.run('RETURN $n AS num', { n: 99 });
                expect(records).toEqual([{ num: 99 }]);
                await tx.rollback();
            });

            test('throws after commit', async () => {
                const tx = await client.beginTransaction();
                await tx.commit();
                await expect(tx.run('RETURN 1')).rejects.toThrow('Transaction already finished');
            });

            test('throws after rollback', async () => {
                const tx = await client.beginTransaction();
                await tx.rollback();
                await expect(tx.run('RETURN 1')).rejects.toThrow('Transaction already finished');
            });
        });

        describe('Transaction.commit()', () => {
            test('returns a successful response', async () => {
                const tx = await client.beginTransaction();
                const resp = await tx.commit();
                expect(resp.isSuccess).toBe(true);
            });

            test('committed writes are visible after commit', async () => {
                const label = `ClientTestNode_${Date.now()}`;
                const tx = await client.beginTransaction();
                await tx.run(`CREATE (:${label} {ok: true})`);
                await tx.commit();

                try {
                    const records = await client.query(`MATCH (n:${label}) RETURN n.ok AS ok`);
                    expect(records).toEqual([{ ok: true }]);
                } finally {
                    await client.query(`MATCH (n:${label}) DELETE n`);
                }
            });
        });

        describe('Transaction.rollback()', () => {
            test('returns a successful response', async () => {
                const tx = await client.beginTransaction();
                const resp = await tx.rollback();
                expect(resp.isSuccess).toBe(true);
            });

            test('rolled-back writes are not persisted', async () => {
                const label = `ClientTestNode_${Date.now()}`;
                const tx = await client.beginTransaction();
                await tx.run(`CREATE (:${label})`);
                await tx.rollback();

                const records = await client.query(`MATCH (n:${label}) RETURN n`);
                expect(records).toEqual([]);
            });
        });
    });
});
