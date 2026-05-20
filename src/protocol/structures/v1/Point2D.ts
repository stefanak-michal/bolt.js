import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-point2d
 */
export default class Point2D implements IStructure {
    readonly signature = 0x58;

    constructor(
        public readonly srid: number | bigint,
        public readonly x: number,
        public readonly y: number
    ) {}
}
