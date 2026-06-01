import IStructure from '../IStructure';
import { PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-duration
 */
export default class Duration implements IStructure {
    readonly signature = 0x45;

    @PackInteger public readonly months!: number | bigint;
    @PackInteger public readonly days!: number | bigint;
    @PackInteger public readonly seconds!: number | bigint;
    @PackInteger public readonly nanoseconds!: number | bigint;

    constructor(
        months: number | bigint,
        days: number | bigint,
        seconds: number | bigint,
        nanoseconds: number | bigint
    ) {
        this.months = months;
        this.days = days;
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
    }
}
