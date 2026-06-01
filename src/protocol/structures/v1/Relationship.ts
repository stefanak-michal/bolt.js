import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-relationship
 */
export default class Relationship implements IStructure {
    readonly signature = 0x52;

    public readonly id!: number | bigint;
    public readonly startNodeId!: number | bigint;
    public readonly endNodeId!: number | bigint;
    public readonly type!: string;
    public readonly properties!: Record<string, unknown>;

    constructor(
        id: number | bigint,
        startNodeId: number | bigint,
        endNodeId: number | bigint,
        type: string,
        properties: Record<string, unknown>
    ) {
        this.id = id;
        this.startNodeId = startNodeId;
        this.endNodeId = endNodeId;
        this.type = type;
        this.properties = properties;
    }
}
