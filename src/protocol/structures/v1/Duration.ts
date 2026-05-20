import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-duration
 */
export default class Duration implements IStructure {
    readonly signature = 0x45;

    constructor(
        public readonly months: number | bigint,
        public readonly days: number | bigint,
        public readonly seconds: number | bigint,
        public readonly nanoseconds: number | bigint
    ) {}
}
