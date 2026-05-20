import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-vector
 */
export default class Vector implements IStructure {
    readonly signature = 0x56;

    constructor(public readonly data: number[]) {}
}
