import IStructure from '../IStructure';
import { PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-datetime
 */
export default class DateTime implements IStructure {
    readonly signature = 0x49;

    @PackInteger public readonly seconds!: number | bigint;
    @PackInteger public readonly nanoseconds!: number | bigint;
    @PackInteger public readonly tz_offset_seconds!: number | bigint;

    constructor(seconds: number | bigint, nanoseconds: number | bigint, tz_offset_seconds: number | bigint) {
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
        this.tz_offset_seconds = tz_offset_seconds;
    }
}
