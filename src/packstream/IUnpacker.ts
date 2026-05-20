import IStructure from '../protocol/structures/IStructure';
import Signature from '../enum/Signature';

export interface IUnpacker {
    structuresMap: Map<number, new (...args: any[]) => IStructure>;
    unpack(data: Uint8Array): [Signature, unknown[]];
}
