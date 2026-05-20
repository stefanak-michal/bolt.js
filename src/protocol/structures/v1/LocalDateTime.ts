import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-localdatetime
 */
export default class LocalDateTime implements IStructure {
    readonly signature = 0x64;

    constructor(
        public readonly seconds: number | bigint,
        public readonly nanoseconds: number | bigint
    ) {}
}
