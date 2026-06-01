import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-unsupported-type
 */
export default class UnsupportedType implements IStructure {
    readonly signature = 0x3f;

    public readonly name!: string;
    public readonly minimum_protocol_major!: number;
    public readonly minimum_protocol_minor!: number;
    public readonly extra!: Record<string, unknown>;

    constructor(
        name: string,
        minimum_protocol_major: number,
        minimum_protocol_minor: number,
        extra: Record<string, unknown>
    ) {
        this.name = name;
        this.minimum_protocol_major = minimum_protocol_major;
        this.minimum_protocol_minor = minimum_protocol_minor;
        this.extra = extra;
    }
}
