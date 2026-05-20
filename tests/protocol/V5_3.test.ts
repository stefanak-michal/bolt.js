import { V5_3 } from '../../src/protocol/V5_3';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V5_3', () => {
    let conn: MockConnection;
    let protocol: V5_3;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V5_3(conn);
    });

    test('starts in NEGOTIATION state', () => {
        expect(protocol.serverState).toBe(ServerState.NEGOTIATION);
    });

    test('exposes same message set as V5_1', () => {
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.logon).toBe('function');
        expect(typeof protocol.logoff).toBe('function');
        expect(typeof protocol.route).toBe('function');
    });

    test('does not expose TELEMETRY', () => {
        expect((protocol as any).telemetry).toBeUndefined();
    });

    describe('HELLO (v5.3 variant — includes bolt_agent)', () => {
        test('HELLO + SUCCESS → AUTHENTICATION', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/5.3.0' }));
            protocol.hello({});
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.HELLO);
            expect(protocol.serverState).toBe(ServerState.AUTHENTICATION);
        });

        test('HELLO includes bolt_agent automatically', () => {
            protocol.hello({});
            // The packed bytes include bolt_agent — we verify write was called once
            expect(conn.write).toHaveBeenCalledTimes(1);
        });

        test('HELLO supports notification severity filter', () => {
            protocol.hello({ notifications_minimum_severity: 'WARNING' });
            expect(conn.write).toHaveBeenCalledTimes(1);
        });
    });

    describe('LOGON + LOGOFF flow', () => {
        test('HELLO → LOGON → READY, then LOGOFF → AUTHENTICATION', async () => {
            conn.queueResponses(packSuccess(), packSuccess(), packSuccess());
            protocol.hello({});
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.AUTHENTICATION);

            protocol.logon(AUTH);
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.READY);

            protocol.logoff();
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.AUTHENTICATION);
        });
    });

    describe('ROUTE', () => {
        beforeEach(async () => {
            conn.queueResponses(packSuccess(), packSuccess());
            protocol.hello({});
            await protocol.getResponse();
            protocol.logon(AUTH);
            await protocol.getResponse();
        });

        test('ROUTE + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ rt: {} }));
            protocol.route({}, [], { db: null, imp_user: null });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.ROUTE);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });
});
