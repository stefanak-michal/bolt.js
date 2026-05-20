import { w3cwebsocket as WebSocket } from 'websocket';
import { IConnection } from './IConnection';

const enum DechunkerState {
    AWAITING_CHUNK,
    IN_HEADER,
    IN_CHUNK,
}

class Dechunker {
    private state = DechunkerState.AWAITING_CHUNK;
    private chunkSize = 0;
    private chunkBytesRead = 0;
    private headerByte: number | null = null;
    private messageBuffer: number[] = [];

    onmessage: ((data: Uint8Array) => void) | null = null;

    receive(data: Uint8Array): void {
        let i = 0;
        while (i < data.length) {
            const byte = data[i++];

            switch (this.state) {
                case DechunkerState.AWAITING_CHUNK:
                    this.headerByte = byte;
                    this.state = DechunkerState.IN_HEADER;
                    break;

                case DechunkerState.IN_HEADER:
                    this.chunkSize = (this.headerByte! << 8) | byte;
                    if (this.chunkSize === 0) {
                        // end-of-message
                        if (this.onmessage && this.messageBuffer.length > 0) {
                            this.onmessage(new Uint8Array(this.messageBuffer));
                        }
                        this.messageBuffer = [];
                        this.state = DechunkerState.AWAITING_CHUNK;
                    } else {
                        this.chunkBytesRead = 0;
                        this.state = DechunkerState.IN_CHUNK;
                    }
                    break;

                case DechunkerState.IN_CHUNK:
                    this.messageBuffer.push(byte);
                    this.chunkBytesRead++;
                    if (this.chunkBytesRead === this.chunkSize) {
                        this.state = DechunkerState.AWAITING_CHUNK;
                    }
                    break;
            }
        }
    }
}

export class WebSocketChannel implements IConnection {
    private ws: WebSocket | null = null;
    private dechunker = new Dechunker();
    private messageQueue: Uint8Array[] = [];
    private rawQueue: Uint8Array[] = [];
    private waiters: Array<(data: Uint8Array) => void> = [];
    private rawWaiters: Array<(data: Uint8Array) => void> = [];
    private handshakeDone = false;

    constructor() {
        this.dechunker.onmessage = data => {
            const waiter = this.waiters.shift();
            if (waiter) {
                waiter(data);
            } else {
                this.messageQueue.push(data);
            }
        };
    }

    connect(host: string, port: number, encrypted = false): Promise<void> {
        const scheme = encrypted ? 'wss' : 'ws';
        const url = `${scheme}://${host}:${port}`;

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = () => resolve();
            this.ws.onerror = err => reject(err);
            this.ws.onclose = () => {
                for (const waiter of this.waiters) waiter(new Uint8Array(0));
                for (const waiter of this.rawWaiters) waiter(new Uint8Array(0));
                this.waiters = [];
                this.rawWaiters = [];
            };
            this.ws.onmessage = event => {
                const data =
                    event.data instanceof ArrayBuffer
                        ? new Uint8Array(event.data)
                        : new Uint8Array(Buffer.from(event.data as string, 'binary'));

                if (!this.handshakeDone) {
                    // Handshake response — 4 bytes raw
                    const rawWaiter = this.rawWaiters.shift();
                    if (rawWaiter) {
                        rawWaiter(data);
                    } else {
                        this.rawQueue.push(data);
                    }
                } else {
                    this.dechunker.receive(data);
                }
            };
        });
    }

    write(data: Uint8Array): void {
        if (!this.ws) throw new Error('Not connected');
        this.ws.send(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    }

    readRaw(): Promise<Uint8Array> {
        const queued = this.rawQueue.shift();
        if (queued) return Promise.resolve(queued);
        return new Promise(resolve => this.rawWaiters.push(resolve));
    }

    read(): Promise<Uint8Array> {
        const queued = this.messageQueue.shift();
        if (queued) return Promise.resolve(queued);
        return new Promise(resolve => this.waiters.push(resolve));
    }

    setHandshakeDone(): void {
        this.handshakeDone = true;
    }

    disconnect(): void {
        this.ws?.close();
        this.ws = null;
    }
}
