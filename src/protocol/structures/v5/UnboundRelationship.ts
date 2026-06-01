import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-unbound
 */
export default class UnboundRelationship implements IStructure {
    readonly signature = 0x72;

    public readonly id!: number | bigint;
    public readonly type!: string;
    public readonly properties!: Record<string, unknown>;
    public readonly elementId!: string;

    constructor(id: number | bigint, type: string, properties: Record<string, unknown>, elementId: string) {
        this.id = id;
        this.type = type;
        this.properties = properties;
        this.elementId = elementId;
    }
}
