import { V5_1 } from '../../src/protocol/V5_1';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V5_1', () => {
    let conn: MockConnection;
    let protocol: V5_1;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V5_1(conn);
    });

    test('starts in NEGOTIATION state (not CONNECTED)', () => {
        expect(protocol.serverState).toBe(ServerState.NEGOTIATION);
    });

    test('exposes v5.1 mixin functions', () => {
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.logon).toBe('function');
        expect(typeof protocol.logoff).toBe('function');
        expect(typeof protocol.goodbye).toBe('function');
        expect(typeof protocol.reset).toBe('function');
        expect(typeof protocol.run).toBe('function');
        expect(typeof protocol.pull).toBe('function');
        expect(typeof protocol.discard).toBe('function');
        expect(typeof protocol.begin).toBe('function');
        expect(typeof protocol.commit).toBe('function');
        expect(typeof protocol.rollback).toBe('function');
        expect(typeof protocol.route).toBe('function');
    });

    test('does not expose v5.4+ TELEMETRY', () => {
        expect((protocol as any).telemetry).toBeUndefined();
    });

    describe('HELLO (no auth — v5.1 variant)', () => {
        test('HELLO without auth + SUCCESS → AUTHENTICATION', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/5.1.0' }));
            protocol.hello({});
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.HELLO);
            expect(protocol.serverState).toBe(ServerState.AUTHENTICATION);
        });

        test('HELLO + FAILURE → DEFUNCT', async () => {
            conn.queueResponse(packFailure());
            protocol.hello({});
            await protocol.getResponse();

            expect(protocol.serverState).toBe(ServerState.DEFUNCT);
        });

        test('default routing inserted when not provided', () => {
            protocol.hello({});
            expect(conn.write).toHaveBeenCalledTimes(1);
        });
    });

    describe('LOGON', () => {
        beforeEach(async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/5.1.0' }));
            protocol.hello({});
            await protocol.getResponse();
            // Now in AUTHENTICATION state
        });

        test('LOGON writes to connection', () => {
            protocol.logon(AUTH);
            expect(conn.write).toHaveBeenCalledTimes(2);
        });

        test('LOGON + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess());
            protocol.logon(AUTH);
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.LOGON);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('LOGON + FAILURE → DEFUNCT', async () => {
            conn.queueResponse(packFailure({ code: 'Neo.ClientError.Security.Unauthorized' }));
            protocol.logon(AUTH);
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.DEFUNCT);
        });
    });

    describe('LOGOFF', () => {
        beforeEach(async () => {
            conn.queueResponses(packSuccess(), packSuccess());
            protocol.hello({});
            await protocol.getResponse();
            protocol.logon(AUTH);
            await protocol.getResponse();
            // Now in READY state
        });

        test('LOGOFF + SUCCESS → AUTHENTICATION', async () => {
            conn.queueResponse(packSuccess());
            protocol.logoff();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.LOGOFF);
            expect(protocol.serverState).toBe(ServerState.AUTHENTICATION);
        });

        test('LOGOFF + FAILURE → FAILED', async () => {
            conn.queueResponse(packFailure());
            protocol.logoff();
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.FAILED);
        });
    });

    describe('full authenticated query flow', () => {
        test('HELLO → LOGON → RUN → PULL', async () => {
            conn.queueResponses(
                packSuccess({ server: 'Neo4j/5.1.0' }),
                packSuccess(),
                packSuccess({ fields: ['n'] }),
                packSuccess({ type: 'r' })
            );
            protocol.hello({});
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.AUTHENTICATION);

            protocol.logon(AUTH);
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.READY);

            protocol.run('RETURN 1 AS n', {}, {});
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.STREAMING);

            protocol.pull({ n: -1 });
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });
});
