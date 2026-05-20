import { V1 } from '../../src/protocol/V1';
import { MockConnection, packSuccess, packFailure } from './helpers';
import ServerState from '../../src/enum/ServerState';
import Message from '../../src/enum/Message';
import { describe, beforeEach, expect, test } from '@jest/globals';

const AUTH = { scheme: 'basic', principal: 'neo4j', credentials: 'pass' };

describe('V1', () => {
    let conn: MockConnection;
    let protocol: V1;

    beforeEach(() => {
        conn = new MockConnection();
        protocol = new V1(conn);
    });

    test('starts in CONNECTED state', () => {
        expect(protocol.serverState).toBe(ServerState.CONNECTED);
    });

    test('exposes v1 mixin functions', () => {
        expect(typeof protocol.init).toBe('function');
        expect(typeof protocol.ackFailure).toBe('function');
        expect(typeof protocol.reset).toBe('function');
        expect(typeof protocol.run).toBe('function');
        expect(typeof protocol.pullAll).toBe('function');
        expect(typeof protocol.discardAll).toBe('function');
    });

    test('does not expose v3+ methods', () => {
        expect((protocol as any).hello).toBeUndefined();
        expect((protocol as any).goodbye).toBeUndefined();
        expect((protocol as any).begin).toBeUndefined();
        expect((protocol as any).logon).toBeUndefined();
    });

    describe('INIT', () => {
        test('writes to connection', () => {
            protocol.init('MyApp/1.0', AUTH);
            expect(conn.write).toHaveBeenCalledTimes(1);
        });

        test('INIT + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ server: 'Neo4j/3.5.0' }));
            protocol.init('MyApp/1.0', AUTH);
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.INIT);
            expect(resp.content).toEqual({ server: 'Neo4j/3.5.0' });
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('INIT + FAILURE → DEFUNCT', async () => {
            conn.queueResponse(packFailure({ code: 'Neo.ClientError.Security.Unauthorized' }));
            protocol.init('MyApp/1.0', AUTH);
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.DEFUNCT);
        });

        test('uses default user agent when null is passed', () => {
            protocol.init(null, AUTH);
            expect(conn.write).toHaveBeenCalledTimes(1);
        });
    });

    describe('RUN (from READY state)', () => {
        beforeEach(async () => {
            conn.queueResponse(packSuccess());
            protocol.init('MyApp/1.0', AUTH);
            await protocol.getResponse();
        });

        test('writes to connection', () => {
            protocol.run('RETURN 1', {});
            expect(conn.write).toHaveBeenCalledTimes(2);
        });

        test('RUN + SUCCESS → STREAMING', async () => {
            conn.queueResponse(packSuccess({ fields: ['n'] }));
            protocol.run('RETURN 1 AS n', {});
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.RUN);
            expect(resp.content).toEqual({ fields: ['n'] });
            expect(protocol.serverState).toBe(ServerState.STREAMING);
        });

        test('RUN + FAILURE → FAILED', async () => {
            conn.queueResponse(packFailure({ code: 'SyntaxError' }));
            protocol.run('INVALID', {});
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.FAILED);
        });
    });

    describe('PULL_ALL (from STREAMING state)', () => {
        beforeEach(async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['n'] }));
            protocol.init('MyApp/1.0', AUTH);
            await protocol.getResponse();
            protocol.run('RETURN 1 AS n', {});
            await protocol.getResponse();
        });

        test('writes to connection', () => {
            protocol.pullAll();
            expect(conn.write).toHaveBeenCalledTimes(3);
        });

        test('PULL_ALL + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess({ type: 'r' }));
            protocol.pullAll();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.PULL_ALL);
            expect(protocol.serverState).toBe(ServerState.READY);
        });

        test('PULL_ALL + FAILURE → FAILED', async () => {
            conn.queueResponse(packFailure());
            protocol.pullAll();
            const resp = await protocol.getResponse();

            expect(resp.isFailure).toBe(true);
            expect(protocol.serverState).toBe(ServerState.FAILED);
        });
    });

    describe('DISCARD_ALL (from STREAMING state)', () => {
        beforeEach(async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['n'] }));
            protocol.init('MyApp/1.0', AUTH);
            await protocol.getResponse();
            protocol.run('RETURN 1 AS n', {});
            await protocol.getResponse();
        });

        test('DISCARD_ALL + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess());
            protocol.discardAll();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.DISCARD_ALL);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('RESET', () => {
        test('RESET from READY + SUCCESS → READY', async () => {
            conn.queueResponse(packSuccess());
            protocol.init('MyApp/1.0', AUTH);
            await protocol.getResponse();

            conn.queueResponse(packSuccess());
            protocol.reset();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.RESET);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('ACK_FAILURE', () => {
        test('ACK_FAILURE from FAILED + SUCCESS → READY', async () => {
            conn.queueResponses(packSuccess(), packFailure());
            protocol.init('MyApp/1.0', AUTH);
            await protocol.getResponse();
            protocol.run('INVALID', {});
            await protocol.getResponse();
            expect(protocol.serverState).toBe(ServerState.FAILED);

            conn.queueResponse(packSuccess());
            protocol.ackFailure();
            const resp = await protocol.getResponse();

            expect(resp.isSuccess).toBe(true);
            expect(resp.message).toBe(Message.ACK_FAILURE);
            expect(protocol.serverState).toBe(ServerState.READY);
        });
    });

    describe('pipelining', () => {
        test('getResponse throws when no messages are queued', async () => {
            await expect(protocol.getResponse()).rejects.toThrow('No pipelined messages to read');
        });

        test('multiple messages can be pipelined before reading', async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['n'] }));
            protocol.init('MyApp/1.0', AUTH);
            protocol.run('RETURN 1 AS n', {});

            expect(conn.write).toHaveBeenCalledTimes(2);

            const r1 = await protocol.getResponse();
            const r2 = await protocol.getResponse();

            expect(r1.message).toBe(Message.INIT);
            expect(r2.message).toBe(Message.RUN);
        });
    });

    describe('getResponses()', () => {
        test('iterates all pipelined messages', async () => {
            conn.queueResponses(packSuccess(), packSuccess({ fields: ['n'] }));
            protocol.init('MyApp/1.0', AUTH);
            protocol.run('RETURN 1 AS n', {});

            const messages: Message[] = [];
            for await (const resp of protocol.getResponses()) {
                messages.push(resp.message);
            }

            expect(messages).toEqual([Message.INIT, Message.RUN]);
        });
    });
});
