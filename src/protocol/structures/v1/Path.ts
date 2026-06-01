import IStructure from '../IStructure';
import Node from './Node';
import UnboundRelationship from './UnboundRelationship';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-path
 */
export default class Path implements IStructure {
    readonly signature = 0x50;

    public readonly nodes!: Node[];
    public readonly rels!: UnboundRelationship[];
    public readonly indices!: number[];

    constructor(nodes: Node[], rels: UnboundRelationship[], indices: number[]) {
        this.nodes = nodes;
        this.rels = rels;
        this.indices = indices;
    }
}
