import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-datetimezoneid
 */
export default class DateTimeZoneId implements IStructure {
    readonly signature = 0x69;

    constructor(
        public readonly seconds: number | bigint,
        public readonly nanoseconds: number | bigint,
        public readonly tz_id: string
    ) {}
}
