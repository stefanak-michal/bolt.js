import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-unbound
 */
export default class UnboundRelationship implements IStructure {
    readonly signature = 0x72;

    constructor(
        public readonly id: number | bigint,
        public readonly type: string,
        public readonly properties: Record<string, unknown>,
        public readonly elementId: string
    ) {}
}
