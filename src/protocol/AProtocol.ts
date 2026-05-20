import { IConnection } from '../connection/IConnection';
import { IPacker } from '../packstream/IPacker';
import { IUnpacker } from '../packstream/IUnpacker';
import Message from '../enum/Message';
import Signature from '../enum/Signature';
import ServerState from '../enum/ServerState';
import { Response } from './Response';
import { StateTransition } from './transitions/StateTransition';

export abstract class AProtocol {
    protected pipelinedMessages: Message[] = [];

    public abstract serverState: ServerState;
    abstract readonly stateTransitionTable: StateTransition[];

    constructor(
        protected connection: IConnection,
        protected packer: IPacker,
        protected unpacker: IUnpacker
    ) {}

    protected send(message: Message, fields: unknown[]): void {
        const signature = messageSignature(message);
        const packed = this.packer.pack(signature, ...fields);
        this.connection.write(
            new Uint8Array([(packed.length >> 8) & 0xff, packed.length & 0xff, ...packed, 0x00, 0x00])
        );
        this.pipelinedMessages.push(message);
    }

    async getResponse(): Promise<Response> {
        // const message = this.pipelinedMessages.shift();
        // this.pipelinedMessages.
        if (this.pipelinedMessages.length === 0) throw new Error('No pipelined messages to read');
        const message = this.pipelinedMessages[0];

        const raw = await this.connection.read();
        const [sig, fields] = this.unpacker.unpack(raw);
        if (sig !== Signature.RECORD) this.pipelinedMessages.shift();
        const content =
            Array.isArray(fields) && fields.length === 1 && typeof fields[0] === 'object' && fields[0] !== null
                ? (fields[0] as Record<string, unknown>)
                : {};

        const response = new Response(message, sig, content);
        this.updateState(message, sig);
        return response;
    }

    async *getResponses(): AsyncGenerator<Response> {
        while (this.pipelinedMessages.length > 0) {
            yield await this.getResponse();
        }
    }

    private updateState(message: Message, sig: Signature): void {
        const transition = this.stateTransitionTable.find(
            t => t.from === this.serverState && t.message === message && t.response === sig
        );
        if (transition) {
            this.serverState = transition.to;
        }
    }
}

function messageSignature(message: Message): number {
    switch (message) {
        case Message.INIT:
            return 0x01;
        case Message.ACK_FAILURE:
            return 0x0e;
        case Message.RESET:
            return 0x0f;
        case Message.RUN:
            return 0x10;
        case Message.DISCARD_ALL:
            return 0x2f;
        case Message.PULL_ALL:
            return 0x3f;
        case Message.HELLO:
            return 0x01;
        case Message.GOODBYE:
            return 0x02;
        case Message.BEGIN:
            return 0x11;
        case Message.COMMIT:
            return 0x12;
        case Message.ROLLBACK:
            return 0x13;
        case Message.DISCARD:
            return 0x2f;
        case Message.PULL:
            return 0x3f;
        case Message.ROUTE:
            return 0x66;
        case Message.LOGON:
            return 0x6a;
        case Message.LOGOFF:
            return 0x6b;
        case Message.TELEMETRY:
            return 0x54;
        default:
            throw new Error(`Unknown message: ${message}`);
    }
}
