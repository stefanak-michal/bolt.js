import IStructure from '../IStructure';
import { PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-localtime
 */
export default class LocalTime implements IStructure {
    readonly signature = 0x74;

    @PackInteger public readonly nanoseconds!: number | bigint;

    constructor(nanoseconds: number | bigint) {
        this.nanoseconds = nanoseconds;
    }
}
