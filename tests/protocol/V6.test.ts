import { V6 } from '../../src/protocol/V6';
import { MockConnection, packSuccess } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V6', () => {
    let conn: MockConnection;
    let protocol: V6;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V6(conn);
    });

    test('starts in NEGOTIATION state', () => {
        expect(protocol.serverState).toBe(ServerState.NEGOTIATION);
    });

    test('exposes same message set as V5_4', () => {
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.logon).toBe('function');
        expect(typeof protocol.logoff).toBe('function');
        expect(typeof protocol.telemetry).toBe('function');
        expect(typeof protocol.route).toBe('function');
        expect(typeof protocol.run).toBe('function');
        expect(typeof protocol.pull).toBe('function');
        expect(typeof protocol.discard).toBe('function');
        expect(typeof protocol.begin).toBe('function');
        expect(typeof protocol.commit).toBe('function');
        expect(typeof protocol.rollback).toBe('function');
        expect(typeof protocol.reset).toBe('function');
        expect(typeof protocol.goodbye).toBe('function');
    });

    describe('HELLO → LOGON → READY (v5_1Transitions)', () => {
        test('HELLO + SUCCESS → AUTHENTICATION', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/6.0.0' }));
            protocol.hello({});
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.HELLO);
            expect(protocol.serverState).toBe(ServerState.AUTHENTICATION);
        });

        test('LOGON + SUCCESS → READY', async () => {
            conn.queueResponses(packSuccess(), packSuccess());
            protocol.hello({});
            await protocol.getResponse();
            protocol.logon(AUTH);
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.LOGON);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('TELEMETRY', () => {
        beforeEach(async () => {
            conn.queueResponses(packSuccess(), packSuccess());
            protocol.hello({});
            await protocol.getResponse();
            protocol.logon(AUTH);
            await protocol.getResponse();
        });

        test('telemetry() writes to connection', () => {
            protocol.telemetry(2);
            expect(conn.write).toHaveBeenCalledTimes(3);
        });
    });

    describe('full query flow', () => {
        test('HELLO → LOGON → RUN → PULL → COMMIT', async () => {
            conn.queueResponses(
                packSuccess({ server: 'Neo4j/6.0.0' }),
                packSuccess(),
                packSuccess(),
                packSuccess({ fields: ['n'] }),
                packSuccess({ type: 'r' }),
                packSuccess()
            );
            protocol.hello({});
            await protocol.getResponse();
            protocol.logon(AUTH);
            await protocol.getResponse();
            protocol.begin({});
            await protocol.getResponse();
            protocol.run('RETURN 1 AS n', {}, {});
            await protocol.getResponse();
            protocol.pull({ n: -1 });
            await protocol.getResponse();
            protocol.commit();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.COMMIT);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });
});
