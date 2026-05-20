import { IConnection } from '../../src/connection/IConnection';
import { Packer } from '../../src/packstream/v1/Packer';
import Signature from '../../src/enum/Signature';
import { jest } from '@jest/globals';

const packer = new Packer();

export function packSuccess(content: Record<string, unknown> = {}): Uint8Array {
    return packer.pack(Signature.SUCCESS, content);
}

export function packFailure(
    content: Record<string, unknown> = { code: 'Neo.ClientError', message: 'Test failure' }
): Uint8Array {
    return packer.pack(Signature.FAILURE, content);
}

export function packIgnored(): Uint8Array {
    return packer.pack(Signature.IGNORED);
}

export function packRecord(data: unknown[]): Uint8Array {
    return packer.pack(Signature.RECORD, data);
}

export class MockConnection implements IConnection {
    private _readQueue: Uint8Array[] = [];

    write = jest.fn<(data: Uint8Array) => void>();
    connect = jest.fn<(host: string, port: number, tls?: boolean) => Promise<void>>().mockResolvedValue(undefined);
    disconnect = jest.fn<() => void>();
    readRaw = jest.fn<() => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array(4));
    read: jest.MockedFunction<() => Promise<Uint8Array>>;

    constructor() {
        const self = this;
        this.read = jest.fn(() => {
            const next = self._readQueue.shift();
            if (next === undefined) {
                return Promise.reject(new Error('MockConnection: no queued responses'));
            }
            return Promise.resolve(next);
        });
    }

    queueResponse(data: Uint8Array): void {
        this._readQueue.push(data);
    }

    queueResponses(...responses: Uint8Array[]): void {
        this._readQueue.push(...responses);
    }
}
