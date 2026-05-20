import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-localtime
 */
export default class LocalTime implements IStructure {
    readonly signature = 0x74;

    constructor(public readonly nanoseconds: number | bigint) {}
}
