import { Bolt } from '../src/Bolt';
import { WebSocketChannel } from '../src/connection/WebSocketChannel';

export const HOST = 'localhost';
export const PORT = 7687;
export const USER = 'neo4j';
export const PASS = 'nothing123';

export async function connect() {
    const conn = new WebSocketChannel();
    const protocol = await Bolt.connect(conn, HOST, PORT);
    const p = protocol as any;

    if (typeof p.logon === 'function') {
        // v5.1+: HELLO without auth, then LOGON
        p.hello();
        const helloResp = await protocol.getResponse();
        if (helloResp.isFailure) throw new Error(`HELLO failed: ${JSON.stringify(helloResp.content)}`);

        p.logon({ scheme: 'basic', principal: USER, credentials: PASS });
        const logonResp = await protocol.getResponse();
        if (logonResp.isFailure) throw new Error(`LOGON failed: ${JSON.stringify(logonResp.content)}`);
    } else {
        // v3/v4/v5.0: HELLO with auth
        p.hello({ auth_token: { scheme: 'basic', principal: USER, credentials: PASS } });
        const helloResp = await protocol.getResponse();
        if (helloResp.isFailure) throw new Error(`HELLO failed: ${JSON.stringify(helloResp.content)}`);
    }

    return { protocol, conn };
}
