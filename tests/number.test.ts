import { expect, test, describe, beforeEach } from '@jest/globals';
import { Packer } from '../src/packstream/v1/Packer';
import { Float, Integer } from '../src/packstream/types';

// pack(sig, field) => [struct_header(2 bytes), ...field_bytes]
function packField(packer: Packer, value: unknown): Uint8Array {
    return packer.pack(0x01, value).slice(2);
}

describe('Packer output markers', () => {
    let packer: Packer;

    beforeEach(() => {
        packer = new Packer();
    });

    describe('Float wrapper', () => {
        test('new Float(5) emits 0xC1 float marker for integer-valued input', () => {
            const bytes = packField(packer, new Float(5));
            expect(bytes[0]).toBe(0xc1);
            expect(bytes.length).toBe(9);
        });

        test('new Float(3.14) emits 0xC1 float marker', () => {
            const bytes = packField(packer, new Float(3.14));
            expect(bytes[0]).toBe(0xc1);
            expect(bytes.length).toBe(9);
        });

        test('plain integer 5 emits TINY_INT, not float', () => {
            const bytes = packField(packer, 5);
            expect(bytes[0]).not.toBe(0xc1);
            expect(bytes.length).toBe(1);
        });
    });

    describe('Integer wrapper', () => {
        test('new Integer(5) emits TINY_INT byte', () => {
            const bytes = packField(packer, new Integer(5));
            expect(bytes[0]).toBe(5);
            expect(bytes.length).toBe(1);
        });

        test('new Integer(5.9) truncates fractional part to 5', () => {
            const bytes = packField(packer, new Integer(5.9));
            expect(bytes[0]).toBe(5);
            expect(bytes.length).toBe(1);
        });

        test('new Integer(-20) emits INT_8 marker 0xC8', () => {
            const bytes = packField(packer, new Integer(-20));
            expect(bytes[0]).toBe(0xc8);
        });
    });
});
