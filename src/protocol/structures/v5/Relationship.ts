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
    public readonly elementId!: string;
    public readonly startNodeElementId!: string;
    public readonly endNodeElementId!: string;

    constructor(
        id: number | bigint,
        startNodeId: number | bigint,
        endNodeId: number | bigint,
        type: string,
        properties: Record<string, unknown>,
        elementId: string,
        startNodeElementId: string,
        endNodeElementId: string
    ) {
        this.id = id;
        this.startNodeId = startNodeId;
        this.endNodeId = endNodeId;
        this.type = type;
        this.properties = properties;
        this.elementId = elementId;
        this.startNodeElementId = startNodeElementId;
        this.endNodeElementId = endNodeElementId;
    }
}
