import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-node
 */
export default class Node implements IStructure {
    readonly signature = 0x4e;

    public readonly id!: number | bigint;
    public readonly labels!: string[];
    public readonly properties!: Record<string, unknown>;
    public readonly elementId!: string;

    constructor(id: number | bigint, labels: string[], properties: Record<string, unknown>, elementId: string) {
        this.id = id;
        this.labels = labels;
        this.properties = properties;
        this.elementId = elementId;
    }
}
