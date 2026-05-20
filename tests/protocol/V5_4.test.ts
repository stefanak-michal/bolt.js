import { V5_4 } from '../../src/protocol/V5_4';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V5_4', () => {
    let conn: MockConnection;
    let protocol: V5_4;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V5_4(conn);
    });

    test('starts in NEGOTIATION state', () => {
        expect(protocol.serverState).toBe(ServerState.NEGOTIATION);
    });

    test('exposes TELEMETRY in addition to V5_3 messages', () => {
        expect(typeof protocol.telemetry).toBe('function');
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.logon).toBe('function');
        expect(typeof protocol.logoff).toBe('function');
        expect(typeof protocol.route).toBe('function');
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
            protocol.telemetry(1);
            expect(conn.write).toHaveBeenCalledTimes(3);
        });

        test('TELEMETRY + SUCCESS does not change state from READY', async () => {
            conn.queueResponse(packSuccess());
            protocol.telemetry(1);
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.TELEMETRY);
            // No transition defined for TELEMETRY in v5_1Transitions — state unchanged
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('HELLO → LOGON → READY flow', () => {
        test('full auth flow reaches READY', async () => {
            conn.queueResponses(packSuccess({ server: 'Neo4j/5.4.0' }), packSuccess());
            protocol.hello({});
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.AUTHENTICATION);

            protocol.logon(AUTH);
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('state transitions (v5_1Transitions)', () => {
        test('RESET from FAILED → READY', async () => {
            conn.queueResponses(packSuccess(), packSuccess(), packFailure());
            protocol.hello({});
            await protocol.getResponse();
            protocol.logon(AUTH);
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
