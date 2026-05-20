import { V4_3 } from '../../src/protocol/V4_3';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V4_3', () => {
    let conn: MockConnection;
    let protocol: V4_3;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V4_3(conn);
    });

    test('starts in CONNECTED state', () => {
        expect(protocol.serverState).toBe(ServerState.CONNECTED);
    });

    test('exposes ROUTE in addition to v4 messages', () => {
        expect(typeof protocol.route).toBe('function');
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.pull).toBe('function');
        expect(typeof protocol.discard).toBe('function');
    });

    test('does not expose v5.1+ LOGON / LOGOFF', () => {
        expect((protocol as any).logon).toBeUndefined();
        expect((protocol as any).logoff).toBeUndefined();
    });

    describe('HELLO', () => {
        test('HELLO + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/4.3.0' }));
            protocol.hello({ auth_token: AUTH });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('ROUTE (v4.3 signature: routing, bookmarks, db)', () => {
        beforeEach(async () => {
            conn.queueResponse(packSuccess());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
        });

        test('ROUTE writes to connection', () => {
            protocol.route({}, [], 'neo4j');
            expect(conn.write).toHaveBeenCalledTimes(2);
        });

        test('ROUTE + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ rt: {} }));
            protocol.route({}, [], 'neo4j');
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.ROUTE);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('ROUTE with null db', () => {
            protocol.route({}, [], null);
            expect(conn.write).toHaveBeenCalledTimes(2);
        });
    });
});
