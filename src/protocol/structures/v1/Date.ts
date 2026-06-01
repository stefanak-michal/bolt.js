import IStructure from '../IStructure';
import { PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-date
 */
export default class BoltDate implements IStructure {
    readonly signature = 0x44;

    @PackInteger public readonly days!: number | bigint;

    constructor(days: number | bigint) {
        this.days = days;
    }
}
