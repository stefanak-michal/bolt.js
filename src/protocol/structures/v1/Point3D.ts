import IStructure from '../IStructure';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-point3d
 */
export default class Point3D implements IStructure {
    readonly signature = 0x59;

    constructor(
        public readonly srid: number | bigint,
        public readonly x: number,
        public readonly y: number,
        public readonly z: number
    ) {}
}
