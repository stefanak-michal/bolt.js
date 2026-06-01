import IStructure from '../IStructure';
import { PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-localdatetime
 */
export default class LocalDateTime implements IStructure {
    readonly signature = 0x64;

    @PackInteger public readonly seconds!: number | bigint;
    @PackInteger public readonly nanoseconds!: number | bigint;

    constructor(seconds: number | bigint, nanoseconds: number | bigint) {
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
    }
}
