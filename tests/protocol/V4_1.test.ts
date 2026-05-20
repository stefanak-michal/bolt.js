import { V4_1 } from '../../src/protocol/V4_1';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V4_1', () => {
    let conn: MockConnection;
    let protocol: V4_1;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V4_1(conn);
    });

    test('starts in CONNECTED state', () => {
        expect(protocol.serverState).toBe(ServerState.CONNECTED);
    });

    test('exposes same message set as V4', () => {
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.pull).toBe('function');
        expect(typeof protocol.discard).toBe('function');
        expect(typeof protocol.begin).toBe('function');
        expect(typeof protocol.commit).toBe('function');
        expect(typeof protocol.rollback).toBe('function');
    });

    test('does not expose ROUTE (added in v4.3)', () => {
        expect((protocol as any).route).toBeUndefined();
    });

    describe('HELLO with routing field', () => {
        test('HELLO including routing + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/4.1.0' }));
            protocol.hello({ auth_token: AUTH, routing: { address: 'host:7687' } });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.HELLO);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('HELLO without explicit routing still writes once', () => {
            protocol.hello({ auth_token: AUTH });
            expect(conn.write).toHaveBeenCalledTimes(1);
        });
    });

    describe('state transitions (v4Transitions)', () => {
        test('HELLO + SUCCESS → READY, RUN + SUCCESS → STREAMING', async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['x'] }));
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
            protocol.run('RETURN 1 AS x', {}, {});
            await protocol.getResponse();

            expect(protocol.serverState).toBe(ServerState.STREAMING);
        });

        test('PULL + FAILURE from STREAMING → FAILED', async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['x'] }), packFailure());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
            protocol.run('RETURN 1 AS x', {}, {});
            await protocol.getResponse();
            protocol.pull({ n: -1 });
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.FAILED);
        });
    });
});
