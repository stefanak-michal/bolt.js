import { AProtocol } from '../protocol/AProtocol';
import { Response } from '../protocol/Response';
import Signature from '../enum/Signature';

export interface TransactionOptions {
    bookmarks?: string[];
    timeout?: number;
    metadata?: Record<string, unknown>;
    mode?: string;
    db?: string;
}

export class Transaction {
    private finished = false;

    constructor(private protocol: AProtocol) {}

    async run(query: string, parameters: Record<string, unknown> = {}): Promise<Record<string, unknown>[]> {
        if (this.finished) throw new Error('Transaction already finished');
        return Client.collectRecords(this.protocol, query, parameters, {});
    }

    async commit(): Promise<Response> {
        this.finished = true;
        (this.protocol as any).commit();
        const response = await this.protocol.getResponse();
        if (response.isFailure) throw new Error(`COMMIT failed: ${JSON.stringify(response.content)}`);
        return response;
    }

    async rollback(): Promise<Response> {
        this.finished = true;
        (this.protocol as any).rollback();
        const response = await this.protocol.getResponse();
        return response;
    }
}

export class Client {
    constructor(private protocol: AProtocol) {}

    async query(
        cypher: string,
        parameters: Record<string, unknown> = {},
        extra: Record<string, unknown> = {}
    ): Promise<Record<string, unknown>[]> {
        return Client.collectRecords(this.protocol, cypher, parameters, extra);
    }

    async beginTransaction(options: TransactionOptions = {}): Promise<Transaction> {
        const proto = this.protocol as any;
        if (typeof proto.begin !== 'function') {
            throw new Error('Transactions require Bolt v3 or later');
        }

        proto.begin({
            bookmarks: options.bookmarks,
            tx_timeout: options.timeout,
            tx_metadata: options.metadata,
            mode: options.mode,
            db: options.db,
        });
        const response = await this.protocol.getResponse();
        if (response.isFailure) {
            throw new Error(`BEGIN failed: ${JSON.stringify(response.content)}`);
        }

        return new Transaction(this.protocol);
    }

    static async collectRecords(
        protocol: AProtocol,
        query: string,
        parameters: Record<string, unknown>,
        extra: Record<string, unknown>
    ): Promise<Record<string, unknown>[]> {
        const proto = protocol as any;

        if (typeof proto.run === 'function') {
            // v3+: run accepts extra metadata
            proto.run(query, parameters, extra);
        } else {
            throw new Error('Protocol does not support RUN');
        }

        if (typeof proto.pull === 'function') {
            proto.pull({ n: -1 });
        } else if (typeof proto.pullAll === 'function') {
            proto.pullAll();
        } else {
            throw new Error('Protocol does not support PULL');
        }

        const records: Record<string, unknown>[] = [];
        let keys: string[] = [];

        // First response is SUCCESS for RUN (contains field names)
        const runResponse = await protocol.getResponse();
        if (runResponse.isFailure) {
            throw new Error(`RUN failed: ${JSON.stringify(runResponse.content)}`);
        }
        if (Array.isArray(runResponse.content['fields'])) {
            keys = runResponse.content['fields'] as string[];
        }

        // Subsequent responses are RECORDs then final SUCCESS/FAILURE
        for await (const response of protocol.getResponses()) {
            if (response.isRecord) {
                const values = (response.content['data'] as unknown[]) ?? Object.values(response.content);
                const row: Record<string, unknown> = {};
                keys.forEach((key, i) => {
                    row[key] = values[i];
                });
                records.push(row);
            } else if (response.isFailure) {
                throw new Error(`PULL failed: ${JSON.stringify(response.content)}`);
            }
        }

        return records;
    }
}
