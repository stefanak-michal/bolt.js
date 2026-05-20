import { V3 } from '../../src/protocol/V3';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V3', () => {
    let conn: MockConnection;
    let protocol: V3;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V3(conn);
    });

    test('starts in CONNECTED state', () => {
        expect(protocol.serverState).toBe(ServerState.CONNECTED);
    });

    test('exposes v3 mixin functions', () => {
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.goodbye).toBe('function');
        expect(typeof protocol.reset).toBe('function');
        expect(typeof protocol.run).toBe('function');
        expect(typeof protocol.pullAll).toBe('function');
        expect(typeof protocol.discardAll).toBe('function');
        expect(typeof protocol.begin).toBe('function');
        expect(typeof protocol.commit).toBe('function');
        expect(typeof protocol.rollback).toBe('function');
    });

    test('does not expose v1 INIT / ACK_FAILURE', () => {
        expect((protocol as any).init).toBeUndefined();
        expect((protocol as any).ackFailure).toBeUndefined();
    });

    test('does not expose v4+ pull / discard', () => {
        expect((protocol as any).pull).toBeUndefined();
        expect((protocol as any).discard).toBeUndefined();
    });

    describe('HELLO', () => {
        test('writes to connection', () => {
            protocol.hello({ auth_token: AUTH });
            expect(conn.write).toHaveBeenCalledTimes(1);
        });

        test('HELLO + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/4.0.0', connection_id: 'bolt-1' }));
            protocol.hello({ auth_token: AUTH });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.HELLO);
            expect(resp.content).toHaveProperty('server');
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('HELLO + FAILURE → DEFUNCT', async () => {
            conn.queueResponse(packFailure({ code: 'Neo.ClientError.Security.Unauthorized' }));
            protocol.hello({ auth_token: AUTH });
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.DEFUNCT);
        });

        test('uses default user agent when not provided', () => {
            protocol.hello({ auth_token: AUTH });
            expect(conn.write).toHaveBeenCalledTimes(1);
        });
    });

    describe('RUN (from READY state)', () => {
        beforeEach(async () => {
            conn.queueResponse(packSuccess());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
        });

        test('RUN + SUCCESS → STREAMING', async () => {
            conn.queueResponse(packSuccess({ fields: ['n'] }));
            protocol.run('RETURN 1 AS n', {}, {});
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.RUN);
            expect(protocol.serverState).toBe(ServerState.STREAMING);
        });

        test('RUN + FAILURE → FAILED', async () => {
            conn.queueResponse(packFailure());
            protocol.run('INVALID', {}, {});
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.FAILED);
        });
    });

    describe('BEGIN / COMMIT / ROLLBACK', () => {
        beforeEach(async () => {
            conn.queueResponse(packSuccess());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
        });

        test('BEGIN + SUCCESS → TX_READY', async () => {
            conn.queueResponse(packSuccess());
            protocol.begin({});
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.BEGIN);
            expect(protocol.serverState).toBe(ServerState.TX_READY);
        });

        test('COMMIT from TX_READY + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess());
            protocol.begin({});
            await protocol.getResponse();

            conn.queueResponse(packSuccess());
            protocol.commit();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.COMMIT);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('ROLLBACK from TX_READY + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess());
            protocol.begin({});
            await protocol.getResponse();

            conn.queueResponse(packSuccess());
            protocol.rollback();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.ROLLBACK);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('BEGIN + FAILURE → FAILED', async () => {
            conn.queueResponse(packFailure());
            protocol.begin({});
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.FAILED);
        });
    });

    describe('TX_STREAMING (RUN inside transaction)', () => {
        beforeEach(async () => {
            conn.queueResponses(packSuccess(), packSuccess());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
            protocol.begin({});
            await protocol.getResponse();
        });

        test('RUN in TX + SUCCESS → TX_STREAMING', async () => {
            conn.queueResponse(packSuccess({ fields: ['n'] }));
            protocol.run('RETURN 1 AS n', {}, {});
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.TX_STREAMING);
        });
    });

    describe('RESET', () => {
        test('RESET from FAILED + SUCCESS → READY', async () => {
            conn.queueResponses(packSuccess(), packFailure());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
            protocol.run('INVALID', {}, {});
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.FAILED);

            conn.queueResponse(packSuccess());
            protocol.reset();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });
});
