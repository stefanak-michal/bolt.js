import { V4 } from '../../src/protocol/V4';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V4', () => {
    let conn: MockConnection;
    let protocol: V4;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V4(conn);
    });

    test('starts in CONNECTED state', () => {
        expect(protocol.serverState).toBe(ServerState.CONNECTED);
    });

    test('exposes v4 mixin functions', () => {
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.goodbye).toBe('function');
        expect(typeof protocol.reset).toBe('function');
        expect(typeof protocol.run).toBe('function');
        expect(typeof protocol.pull).toBe('function');
        expect(typeof protocol.discard).toBe('function');
        expect(typeof protocol.begin).toBe('function');
        expect(typeof protocol.commit).toBe('function');
        expect(typeof protocol.rollback).toBe('function');
    });

    test('does not expose v1 PULL_ALL / DISCARD_ALL', () => {
        expect((protocol as any).pullAll).toBeUndefined();
        expect((protocol as any).discardAll).toBeUndefined();
    });

    test('does not expose v4.3+ ROUTE', () => {
        expect((protocol as any).route).toBeUndefined();
    });

    describe('HELLO', () => {
        test('HELLO + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/4.0.0', connection_id: 'bolt-2' }));
            protocol.hello({ auth_token: AUTH });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.HELLO);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('HELLO + FAILURE → DEFUNCT', async () => {
            conn.queueResponse(packFailure());
            protocol.hello({ auth_token: AUTH });
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.DEFUNCT);
        });
    });

    describe('PULL (from STREAMING state)', () => {
        beforeEach(async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['n'] }));
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
            protocol.run('RETURN 1 AS n', {}, {});
            await protocol.getResponse();
        });

        test('PULL with default n=-1', () => {
            protocol.pull({});
            expect(conn.write).toHaveBeenCalledTimes(3);
        });

        test('PULL + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ type: 'r' }));
            protocol.pull({ n: -1 });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.PULL);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('PULL + FAILURE → FAILED', async () => {
            conn.queueResponse(packFailure());
            protocol.pull({ n: 10 });
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.FAILED);
        });
    });

    describe('DISCARD (from STREAMING state)', () => {
        beforeEach(async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['n'] }));
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
            protocol.run('RETURN 1 AS n', {}, {});
            await protocol.getResponse();
        });

        test('DISCARD + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess());
            protocol.discard({ n: -1 });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.DISCARD);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('TX flow: BEGIN → RUN → PULL → COMMIT', () => {
        beforeEach(async () => {
            conn.queueResponse(packSuccess());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
        });

        test('TX_STREAMING PULL + SUCCESS → TX_READY', async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['n'] }));
            protocol.begin({});
            await protocol.getResponse();
            protocol.run('RETURN 1 AS n', {}, {});
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.TX_STREAMING);

            conn.queueResponse(packSuccess({ type: 'r' }));
            protocol.pull({ n: -1 });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.TX_READY);
        });
    });
});
