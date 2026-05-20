import IStructure from '../../protocol/structures/IStructure';

const TEXT_ENCODER = new TextEncoder();

export class Packer {
    pack(signature: number, ...fields: unknown[]): Uint8Array {
        const parts: Uint8Array[] = [];

        // struct header: size = number of fields
        parts.push(this.packStructHeader(fields.length, signature));
        for (const field of fields) {
            parts.push(this.packValue(field));
        }

        return concat(parts);
    }

    private packValue(value: unknown): Uint8Array {
        if (value === null || value === undefined) return new Uint8Array([0xc0]);
        if (typeof value === 'boolean') return new Uint8Array([value ? 0xc3 : 0xc2]);
        if (typeof value === 'bigint') return this.packInt64(value);
        if (typeof value === 'number') return this.packNumber(value);
        if (typeof value === 'string') return this.packString(value);
        if (value instanceof Uint8Array) return this.packBytes(value);
        if (Array.isArray(value)) return this.packList(value);
        if (value && typeof value === 'object' && 'signature' in value) return this.packStructure(value as IStructure);
        if (typeof value === 'object') return this.packDict(value as Record<string, unknown>);
        throw new Error(`Cannot pack value of type ${typeof value}: ${String(value)}`);
    }

    private packNumber(n: number): Uint8Array {
        if (Number.isInteger(n)) return this.packInt(n);
        // float64
        const buf = new ArrayBuffer(9);
        const view = new DataView(buf);
        view.setUint8(0, 0xc1);
        view.setFloat64(1, n, false);
        return new Uint8Array(buf);
    }

    private packInt(n: number): Uint8Array {
        if (n >= -16 && n <= 127) {
            return new Uint8Array([n & 0xff]); // TINY_INT
        }
        if (n >= -128 && n <= -17) {
            return new Uint8Array([0xc8, n & 0xff]); // INT_8:  -128 to -17
        }
        if (n >= -32768 && n <= 32767) {
            const buf = new ArrayBuffer(3);
            const view = new DataView(buf);
            view.setUint8(0, 0xc9);
            view.setInt16(1, n, false);
            return new Uint8Array(buf); // INT_16: -32768 to -129, +128 to +32767
        }
        if (n >= -2147483648 && n <= 2147483647) {
            const buf = new ArrayBuffer(5);
            const view = new DataView(buf);
            view.setUint8(0, 0xca);
            view.setInt32(1, n, false);
            return new Uint8Array(buf); // INT_32: -2147483648 to -32769, +32768 to +2147483647
        }
        return this.packInt64(BigInt(n)); // INT_64: outside INT_32 range
    }

    private packInt64(n: bigint): Uint8Array {
        const buf = new ArrayBuffer(9);
        const view = new DataView(buf);
        view.setUint8(0, 0xcb);
        view.setBigInt64(1, n, false);
        return new Uint8Array(buf);
    }

    private packString(s: string): Uint8Array {
        const encoded = TEXT_ENCODER.encode(s);
        const len = encoded.length;
        let header: Uint8Array;

        if (len <= 0x0f) {
            header = new Uint8Array([0x80 | len]);
        } else if (len <= 0xff) {
            header = new Uint8Array([0xd0, len]);
        } else if (len <= 0xffff) {
            const buf = new ArrayBuffer(3);
            const view = new DataView(buf);
            view.setUint8(0, 0xd1);
            view.setUint16(1, len, false);
            header = new Uint8Array(buf);
        } else {
            const buf = new ArrayBuffer(5);
            const view = new DataView(buf);
            view.setUint8(0, 0xd2);
            view.setUint32(1, len, false);
            header = new Uint8Array(buf);
        }

        return concat([header, encoded]);
    }

    private packBytes(data: Uint8Array): Uint8Array {
        const len = data.length;
        let header: Uint8Array;

        if (len <= 0xff) {
            header = new Uint8Array([0xcc, len]);
        } else if (len <= 0xffff) {
            const buf = new ArrayBuffer(3);
            const view = new DataView(buf);
            view.setUint8(0, 0xcd);
            view.setUint16(1, len, false);
            header = new Uint8Array(buf);
        } else {
            const buf = new ArrayBuffer(5);
            const view = new DataView(buf);
            view.setUint8(0, 0xce);
            view.setUint32(1, len, false);
            header = new Uint8Array(buf);
        }

        return concat([header, data]);
    }

    private packList(arr: unknown[]): Uint8Array {
        const len = arr.length;
        let header: Uint8Array;

        if (len <= 0x0f) {
            header = new Uint8Array([0x90 | len]);
        } else if (len <= 0xff) {
            header = new Uint8Array([0xd4, len]);
        } else if (len <= 0xffff) {
            const buf = new ArrayBuffer(3);
            const view = new DataView(buf);
            view.setUint8(0, 0xd5);
            view.setUint16(1, len, false);
            header = new Uint8Array(buf);
        } else {
            const buf = new ArrayBuffer(5);
            const view = new DataView(buf);
            view.setUint8(0, 0xd6);
            view.setUint32(1, len, false);
            header = new Uint8Array(buf);
        }

        return concat([header, ...arr.map(v => this.packValue(v))]);
    }

    private packDict(obj: Record<string, unknown>): Uint8Array {
        const entries = Object.entries(obj);
        const len = entries.length;
        let header: Uint8Array;

        if (len <= 0x0f) {
            header = new Uint8Array([0xa0 | len]);
        } else if (len <= 0xff) {
            header = new Uint8Array([0xd8, len]);
        } else if (len <= 0xffff) {
            const buf = new ArrayBuffer(3);
            const view = new DataView(buf);
            view.setUint8(0, 0xd9);
            view.setUint16(1, len, false);
            header = new Uint8Array(buf);
        } else {
            const buf = new ArrayBuffer(5);
            const view = new DataView(buf);
            view.setUint8(0, 0xda);
            view.setUint32(1, len, false);
            header = new Uint8Array(buf);
        }

        const parts: Uint8Array[] = [header];
        for (const [k, v] of entries) {
            parts.push(this.packString(k));
            parts.push(this.packValue(v));
        }
        return concat(parts);
    }

    private packStructure(s: IStructure): Uint8Array {
        return concat([
            this.packStructHeader(Object.keys(s).length - 1, s.signature),
            ...Object.entries(s)
                .filter(v => v[0] !== 'signature')
                .map(v => this.packValue(v[1])),
        ]);
    }

    private packStructHeader(size: number, signature: number): Uint8Array {
        if (size <= 0x0f) {
            return new Uint8Array([0xb0 | size, signature]);
        }
        // max struct size is 15 per PackStream spec, but handle gracefully
        throw new Error(`Structure too large: ${size} fields (max 15)`);
    }
}

function concat(parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        out.set(p, offset);
        offset += p.length;
    }
    return out;
}
