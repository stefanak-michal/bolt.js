import { AProtocol } from '../protocol/AProtocol';
import { Response } from '../protocol/Response';
import AuthToken from '../protocol/AuthToken';

export class Client {
    private authenticated = false;

    constructor(private protocol: AProtocol) {}

    async login(auth: AuthToken): Promise<Response | Response[] | void> {
        if (this.authenticated) return;
        this.authenticated = true;

        const proto = this.protocol as any;

        if (typeof proto.logon === 'function') {
            proto.hello();
            const helloResp = await this.protocol.getResponse();
            if (helloResp.isFailure) throw new Error(`HELLO failed: ${JSON.stringify(helloResp.content)}`);
            proto.logon(auth);
            const logonResp = await this.protocol.getResponse();
            if (logonResp.isFailure) throw new Error(`LOGON failed: ${JSON.stringify(logonResp.content)}`);
            return [helloResp, logonResp];
        } else if (typeof proto.hello === 'function') {
            proto.hello({ auth_token: auth });
            const helloResp = await this.protocol.getResponse();
            if (helloResp.isFailure) throw new Error(`HELLO failed: ${JSON.stringify(helloResp.content)}`);
            return helloResp;
        } else if (typeof proto.init === 'function') {
            proto.init(null, auth);
            const initResp = await this.protocol.getResponse();
            if (initResp.isFailure) throw new Error(`INIT failed: ${JSON.stringify(initResp.content)}`);
            return initResp;
        }

        throw new Error('Protocol does not support authentication?');
    }

    async logout(): Promise<Response> {
        const proto = this.protocol as any;
        if (typeof proto.logoff === 'function') {
            proto.logoff();
            const logoffResp = await this.protocol.getResponse();
            if (logoffResp.isFailure) throw new Error(`LOGOFF failed: ${JSON.stringify(logoffResp.content)}`);
            return logoffResp;
        }
        throw new Error('Protocol does not support LOGOFF');
    }

    async query(
        cypher: string,
        parameters: Record<string, unknown> = {},
        extra: Record<string, unknown> = {}
    ): Promise<Record<string, unknown>[]> {
        return collectRecords(this.protocol, cypher, parameters, extra);
    }

    async beginTransaction(extra: object = {}): Promise<Response> {
        const proto = this.protocol as any;
        if (typeof proto.begin !== 'function') {
            throw new Error('Transactions require Bolt v3 or later');
        }

        proto.begin(extra);
        const response = await this.protocol.getResponse();
        if (response.isFailure) {
            await reset(this.protocol, `BEGIN failed: ${JSON.stringify(response.content)}`);
        }

        return response;
    }

    async commit(): Promise<Response> {
        const proto = this.protocol as any;
        if (typeof proto.commit !== 'function') {
            throw new Error('Transactions require Bolt v3 or later');
        }
        proto.commit();
        const response = await this.protocol.getResponse();
        if (response.isFailure) await reset(this.protocol, `COMMIT failed: ${JSON.stringify(response.content)}`);
        return response;
    }

    async rollback(): Promise<Response> {
        const proto = this.protocol as any;
        if (typeof proto.rollback !== 'function') {
            throw new Error('Transactions require Bolt v3 or later');
        }
        proto.rollback();
        const response = await this.protocol.getResponse();
        if (response.isFailure) await reset(this.protocol, `ROLLBACK failed: ${JSON.stringify(response.content)}`);
        return response;
    }
}

async function reset(protocol: AProtocol, message: string): Promise<void> {
    const proto = protocol as any;
    if (typeof proto.reset !== 'function') {
        throw new Error('Protocol does not support RESET');
    }
    proto.reset();
    const response = await protocol.getResponse();
    if (response.isFailure) {
        throw new Error(`RESET failed: ${JSON.stringify(response.content)}\nafter ${message}`);
    }
    throw new Error(message);
}

async function collectRecords(
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
        proto.pull();
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
        await reset(protocol, `RUN failed: ${JSON.stringify(runResponse.content)}`);
    }
    if (Array.isArray(runResponse.content['fields'])) {
        keys = runResponse.content['fields'] as string[];
    }

    // Subsequent responses are RECORDs then final SUCCESS/FAILURE
    for await (const response of protocol.getResponses()) {
        if (response.isRecord) {
            const values = Object.values(response.content);
            const row: Record<string, unknown> = {};
            keys.forEach((key, i) => {
                row[key] = values[i];
            });
            records.push(row);
        } else if (response.isFailure) {
            await reset(protocol, `PULL failed: ${JSON.stringify(response.content)}`);
        }
    }

    return records;
}
