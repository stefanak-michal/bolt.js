import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-date
 */
export default class BoltDate implements IStructure {
    readonly signature = 0x44;

    constructor(public readonly days: number | bigint) {}
}
