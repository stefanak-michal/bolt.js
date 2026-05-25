import { jest, expect, test, afterEach } from '@jest/globals';
import { Bolt } from '../src/Bolt';
import { WebSocketChannel } from '../src/connection/WebSocketChannel';
import { V6 } from '../src/protocol/V6';

afterEach(() => {
    jest.restoreAllMocks();
});

test('connect() uses default WebSocketChannel, host and port', async () => {
    const connectSpy = jest.spyOn(WebSocketChannel.prototype, 'connect').mockResolvedValue();
    const writeSpy = jest.spyOn(WebSocketChannel.prototype, 'write').mockImplementation(() => undefined);
    const setHandshakeDoneSpy = jest.spyOn(WebSocketChannel.prototype, 'setHandshakeDone').mockImplementation(() => undefined);

    jest.spyOn(WebSocketChannel.prototype, 'readRaw').mockResolvedValue(new Uint8Array([0, 0, 0, 6]));

    const protocol = await Bolt.connect();

    expect(protocol).toBeInstanceOf(V6);
    expect(connectSpy).toHaveBeenCalledWith('127.0.0.1', 7687, false);
    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(setHandshakeDoneSpy).toHaveBeenCalledTimes(1);
});
