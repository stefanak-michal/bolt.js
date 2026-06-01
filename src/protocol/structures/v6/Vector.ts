import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-vector
 */
export default class Vector implements IStructure {
    readonly signature = 0x56;

    public readonly type_marker!: number[];
    public readonly data!: number[];

    constructor(type_marker: number[], data: number[]) {
        this.type_marker = type_marker;
        this.data = data;
    }
}
