import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-datetime
 */
export default class DateTime implements IStructure {
    readonly signature = 0x49;

    constructor(
        public readonly seconds: number | bigint,
        public readonly nanoseconds: number | bigint,
        public readonly tz_offset_seconds: number | bigint
    ) {}
}
