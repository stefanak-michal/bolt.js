import { V4_4 } from '../../src/protocol/V4_4';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V4_4', () => {
    let conn: MockConnection;
    let protocol: V4_4;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V4_4(conn);
    });

    test('starts in CONNECTED state', () => {
        expect(protocol.serverState).toBe(ServerState.CONNECTED);
    });

    test('exposes all v4.4 mixin functions', () => {
        expect(typeof protocol.hello).toBe('function');
        expect(typeof protocol.route).toBe('function');
        expect(typeof protocol.pull).toBe('function');
        expect(typeof protocol.discard).toBe('function');
        expect(typeof protocol.begin).toBe('function');
        expect(typeof protocol.commit).toBe('function');
        expect(typeof protocol.rollback).toBe('function');
    });

    describe('HELLO', () => {
        test('HELLO + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/4.4.0' }));
            protocol.hello({ auth_token: AUTH });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('ROUTE (v4.4 signature: routing, bookmarks, extras)', () => {
        beforeEach(async () => {
            conn.queueResponse(packSuccess());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
        });

        test('ROUTE with extras object writes to connection', () => {
            protocol.route({}, [], { db: 'neo4j', imp_user: null });
            expect(conn.write).toHaveBeenCalledTimes(2);
        });

        test('ROUTE + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ rt: {} }));
            protocol.route({}, [], { db: null, imp_user: null });
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.ROUTE);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('ROUTE with default extras (both null)', () => {
            protocol.route({}, []);
            expect(conn.write).toHaveBeenCalledTimes(2);
        });
    });

    describe('state transitions match v4Transitions', () => {
        test('BEGIN + SUCCESS → TX_READY', async () => {
            conn.queueResponses(packSuccess(), packSuccess());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
            protocol.begin({});
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.TX_READY);
        });

        test('ROLLBACK from TX_READY + SUCCESS → READY', async () => {
            conn.queueResponses(packSuccess(), packSuccess(), packSuccess());
            protocol.hello({ auth_token: AUTH });
            await protocol.getResponse();
            protocol.begin({});
            await protocol.getResponse();
            protocol.rollback();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });
});
