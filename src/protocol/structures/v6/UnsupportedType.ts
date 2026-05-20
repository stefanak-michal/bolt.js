import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-unsupported-type
 */
export default class UnsupportedType implements IStructure {
    readonly signature = 0x3f;

    constructor(
        public readonly name: string,
        public readonly minimum_protocol_major: number,
        public readonly minimum_protocol_minor: number,
        public readonly extra: Record<string, unknown>
    ) {}
}
