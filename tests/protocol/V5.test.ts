import { V5 } from '../../src/protocol/V5';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V5', () => {
    let conn: MockConnection;
    let protocol: V5;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V5(conn);
    });

    test('starts in CONNECTED state', () => {
        expect(protocol.serverState).toBe(ServerState.CONNECTED);
    });

    test('exposes same message set as V4_4', () => {
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.route).toBe('function');
        expect(typeof protocol.pull).toBe('function');
        expect(typeof protocol.discard).toBe('function');
        expect(typeof protocol.begin).toBe('function');
        expect(typeof protocol.commit).toBe('function');
        expect(typeof protocol.rollback).toBe('function');
        expect(typeof protocol.reset).toBe('function');
        expect(typeof protocol.goodbye).toBe('function');
    });

    test('does not expose v5.1+ LOGON / LOGOFF / TELEMETRY', () => {
        expect((protocol as any).logon).toBeUndefined();
        expect((protocol as any).logoff).toBeUndefined();
        expect((protocol as any).telemetry).toBeUndefined();
    });

    describe('HELLO (v3 variant — auth included)', () => {
        test('HELLO + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/5.0.0' }));
            protocol.hello({ auth_token: AUTH });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.HELLO);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('HELLO + FAILURE → DEFUNCT', async () => {
            conn.queueResponse(packFailure({ code: 'Neo.ClientError.Security.Unauthorized' }));
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();

            expect(protocol.serverState).toBe(ServerState.DEFUNCT);
        });
    });

    describe('full query flow', () => {
        test('HELLO → RUN → PULL completes successfully', async () => {
            conn.queueResponses(
                packSuccess({ server: 'Neo4j/5.0.0' }),
                packSuccess({ fields: ['n'] }),
                packSuccess({ type: 'r' })
            );
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();

            protocol.run('RETURN 1 AS n', {}, {});
            const runResp = await protocol.getResponse();
            expect(runResp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.STREAMING);

            protocol.pull({ n: -1 });
            const pullResp = await protocol.getResponse();
            expect(pullResp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });
});
