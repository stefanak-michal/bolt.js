import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-node
 */
export default class Node implements IStructure {
    readonly signature = 0x4e;

    constructor(
        public readonly id: number | bigint,
        public readonly labels: string[],
        public readonly properties: Record<string, unknown>
    ) {}
}
