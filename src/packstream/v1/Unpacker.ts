import IStructure from '../../protocol/structures/IStructure';
import Signature from '../../enum/Signature';

const TEXT_DECODER = new TextDecoder();

export class Unpacker {
    constructor(public structuresMap = new Map<number, new (...args: any[]) => IStructure>()) {}

    unpack(data: Uint8Array): [Signature, unknown[]] {
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        let offset = 0;

        const readByte = (): number => view.getUint8(offset++);
        const readInt8 = (): number => view.getInt8(offset++);
        const readUint8 = (): number => view.getUint8(offset++);
        const readInt16 = (): number => {
            const v = view.getInt16(offset, false);
            offset += 2;
            return v;
        };
        const readUint16 = (): number => {
            const v = view.getUint16(offset, false);
            offset += 2;
            return v;
        };
        const readInt32 = (): number => {
            const v = view.getInt32(offset, false);
            offset += 4;
            return v;
        };
        const readUint32 = (): number => {
            const v = view.getUint32(offset, false);
            offset += 4;
            return v;
        };
        const readInt64 = (): bigint => {
            const v = view.getBigInt64(offset, false);
            offset += 8;
            return v;
        };
        const readFloat64 = (): number => {
            const v = view.getFloat64(offset, false);
            offset += 8;
            return v;
        };
        const readBytes = (n: number): Uint8Array => {
            const v = data.subarray(offset, offset + n);
            offset += n;
            return v;
        };

        const readValue = (): unknown => {
            const marker = readByte();

            // Tiny int: -16..+127
            if (marker >= 0xf0 || marker <= 0x7f) return view.getInt8(offset - 1);

            // Tiny string
            if ((marker & 0xf0) === 0x80) return readString(marker & 0x0f);
            // Tiny list
            if ((marker & 0xf0) === 0x90) return readList(marker & 0x0f);
            // Tiny dict
            if ((marker & 0xf0) === 0xa0) return readDict(marker & 0x0f);
            // Tiny struct
            if ((marker & 0xf0) === 0xb0) return readStruct(marker & 0x0f);

            switch (marker) {
                case 0xc0:
                    return null;
                case 0xc1:
                    return readFloat64();
                case 0xc2:
                    return false;
                case 0xc3:
                    return true;
                case 0xc8:
                    return readInt8();
                case 0xc9:
                    return readInt16();
                case 0xca:
                    return readInt32();
                case 0xcb:
                    return readInt64();
                case 0xcc:
                    return readBytes(readUint8());
                case 0xcd:
                    return readBytes(readUint16());
                case 0xce:
                    return readBytes(readUint32());
                case 0xd0:
                    return readString(readUint8());
                case 0xd1:
                    return readString(readUint16());
                case 0xd2:
                    return readString(readUint32());
                case 0xd4:
                    return readList(readUint8());
                case 0xd5:
                    return readList(readUint16());
                case 0xd6:
                    return readList(readUint32());
                case 0xd8:
                    return readDict(readUint8());
                case 0xd9:
                    return readDict(readUint16());
                case 0xda:
                    return readDict(readUint32());
                default:
                    throw new Error(`Unknown PackStream marker: 0x${marker.toString(16)}`);
            }
        };

        const readString = (len: number): string => TEXT_DECODER.decode(readBytes(len));

        const readList = (len: number): unknown[] => {
            const arr: unknown[] = [];
            for (let i = 0; i < len; i++) arr.push(readValue());
            return arr;
        };

        const readDict = (len: number): Record<string, unknown> => {
            const obj: Record<string, unknown> = {};
            for (let i = 0; i < len; i++) {
                const key = readValue() as string;
                obj[key] = readValue();
            }
            return obj;
        };

        const readStruct = (size: number): IStructure | unknown => {
            const sig = readByte();
            const fields: unknown[] = [];
            for (let i = 0; i < size; i++) fields.push(readValue());

            const structureConstructor = this.structuresMap.get(sig);
            if (structureConstructor) return new structureConstructor(...fields);

            // unknown struct — return raw
            return { signature: sig, fields };
        };

        // First value is the message struct
        const marker = readByte();
        if ((marker & 0xf0) !== 0xb0) {
            throw new Error(`Expected struct marker, got 0x${marker.toString(16)}`);
        }
        const size = marker & 0x0f;
        const messageSig = readByte() as Signature;
        const fields: unknown[] = [];
        for (let i = 0; i < size; i++) fields.push(readValue());

        return [messageSig, fields];
    }
}
