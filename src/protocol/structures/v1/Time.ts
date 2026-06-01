import IStructure from '../IStructure';
import { PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-time
 */
export default class BoltTime implements IStructure {
    readonly signature = 0x54;

    @PackInteger public readonly nanoseconds!: number | bigint;
    @PackInteger public readonly tz_offset_seconds!: number | bigint;

    constructor(nanoseconds: number | bigint, tz_offset_seconds: number | bigint) {
        this.nanoseconds = nanoseconds;
        this.tz_offset_seconds = tz_offset_seconds;
    }
}
