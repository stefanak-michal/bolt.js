import { IConnection } from './connection/IConnection';
import { WebSocketChannel } from './connection/WebSocketChannel';
import { AProtocol } from './protocol/AProtocol';
import { V1 } from './protocol/V1';
import { V3 } from './protocol/V3';
import { V4 } from './protocol/V4';
import { V4_1 } from './protocol/V4_1';
import { V4_3 } from './protocol/V4_3';
import { V4_4 } from './protocol/V4_4';
import { V5 } from './protocol/V5';
import { V5_1 } from './protocol/V5_1';
import { V5_3 } from './protocol/V5_3';
import { V5_4 } from './protocol/V5_4';
import { V6 } from './protocol/V6';

const BOLT_MAGIC = new Uint8Array([0x60, 0x60, 0xb0, 0x17]);

export interface Version {
    major: number;
    minor?: number;
    range?: number;
}

export class Bolt {
    private static encodeVersionProposals(): Uint8Array {
        const proposals = new Uint8Array(16);
        for (let i = 0; i < Math.min(Bolt.versions.length, 4); i++) {
            const { major, minor = 0, range = 0 } = Bolt.versions[i];
            proposals[i * 4 + 3] = major;
            proposals[i * 4 + 2] = minor;
            proposals[i * 4 + 1] = range;
        }
        return proposals;
    }

    static packstreamVersion: number = 1;

    static versions: Version[] = [
        { major: 6 },
        { major: 5, minor: 8, range: 8 },
        { major: 4, minor: 4, range: 4 },
        { major: 3 },
    ];

    static async connect(connection: IConnection, host: string, port: number, encrypted = false): Promise<AProtocol> {
        await connection.connect(host, port, encrypted);

        const versionProposals = Bolt.encodeVersionProposals();

        // Handshake is raw — not chunked
        const handshake = new Uint8Array(BOLT_MAGIC.length + versionProposals.length);
        handshake.set(BOLT_MAGIC, 0);
        handshake.set(versionProposals, BOLT_MAGIC.length);
        connection.write(handshake);

        // Server responds with 4 bytes: [reserved=0, range, minor, major] big-endian
        const response = await connection.readRaw();
        const major = response[3];
        const minor = response[2];

        if (major === 0 && minor === 0) {
            throw new Error('Server does not support any of the proposed Bolt versions');
        }

        // Switch channel to chunked mode after handshake
        if (connection instanceof WebSocketChannel) {
            connection.setHandshakeDone();
        }

        return Bolt.instantiate(connection, major, minor);
    }

    private static instantiate(connection: IConnection, major: number, minor: number): AProtocol {
        if (Bolt.packstreamVersion !== 1) {
            throw new Error(`Unsupported PackStream version: ${Bolt.packstreamVersion}`);
        }
        if (major === 6) return new V6(connection);
        if (major === 5) {
            if (minor >= 4) return new V5_4(connection);
            if (minor >= 3) return new V5_3(connection);
            if (minor >= 1) return new V5_1(connection);
            return new V5(connection);
        }
        if (major === 4) {
            if (minor >= 4) return new V4_4(connection);
            if (minor >= 3) return new V4_3(connection);
            if (minor >= 1) return new V4_1(connection);
            return new V4(connection);
        }
        if (major === 3) return new V3(connection);
        if (major === 1) return new V1(connection);

        throw new Error(`Unsupported Bolt version: ${major}.${minor}`);
    }
}
