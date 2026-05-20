export interface IPacker {
    pack(signature: number, ...fields: unknown[]): Uint8Array;
}
