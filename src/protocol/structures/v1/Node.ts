import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-node
 */
export default class Node implements IStructure {
    readonly signature = 0x4e;

    public readonly id!: number | bigint;
    public readonly labels!: string[];
    public readonly properties!: Record<string, unknown>;

    constructor(id: number | bigint, labels: string[], properties: Record<string, unknown>) {
        this.id = id;
        this.labels = labels;
        this.properties = properties;
    }
}
