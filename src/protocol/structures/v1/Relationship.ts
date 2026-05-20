import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-relationship
 */
export default class Relationship implements IStructure {
    readonly signature = 0x52;

    constructor(
        public readonly id: number | bigint,
        public readonly startNodeId: number | bigint,
        public readonly endNodeId: number | bigint,
        public readonly type: string,
        public readonly properties: Record<string, unknown>
    ) {}
}
