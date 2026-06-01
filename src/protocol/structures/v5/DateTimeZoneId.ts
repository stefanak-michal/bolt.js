import IStructure from '../IStructure';
import { PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-datetimezoneid
 */
export default class DateTimeZoneId implements IStructure {
    readonly signature = 0x69;

    @PackInteger public readonly seconds!: number | bigint;
    @PackInteger public readonly nanoseconds!: number | bigint;
    public readonly tz_id!: string;

    constructor(seconds: number | bigint, nanoseconds: number | bigint, tz_id: string) {
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
        this.tz_id = tz_id;
    }
}
