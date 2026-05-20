import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-time
 */
export default class BoltTime implements IStructure {
    readonly signature = 0x54;

    constructor(
        public readonly nanoseconds: number | bigint,
        public readonly tz_offset_seconds: number | bigint
    ) {}
}
