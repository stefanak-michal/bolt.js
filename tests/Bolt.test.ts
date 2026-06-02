import { jest, expect, test, afterEach } from '@jest/globals';
import { Bolt } from '../src/Bolt';
import { WebSocketChannel } from '../src/connection/WebSocketChannel';
import { V6 } from '../src/protocol/V6';

afterEach(() => {
    jest.restoreAllMocks();
});

test('connect() uses default WebSocketChannel and URI', async () => {
    const connectSpy = jest.spyOn(WebSocketChannel.prototype, 'connect').mockResolvedValue();
    const writeSpy = jest.spyOn(WebSocketChannel.prototype, 'write').mockImplementation(() => undefined);
    const setHandshakeDoneSpy = jest
        .spyOn(WebSocketChannel.prototype, 'setHandshakeDone')
        .mockImplementation(() => undefined);

    jest.spyOn(WebSocketChannel.prototype, 'readRaw').mockResolvedValue(new Uint8Array([0, 0, 0, 6]));

    const protocol = await Bolt.connect();

    expect(protocol).toBeInstanceOf(V6);
    expect(connectSpy).toHaveBeenCalledWith('bolt://localhost:7687');
    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(setHandshakeDoneSpy).toHaveBeenCalledTimes(1);
});
