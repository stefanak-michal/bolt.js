import IStructure from '../IStructure';
import { PackFloat, PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-point3d
 */
export default class Point3D implements IStructure {
    readonly signature = 0x59;

    @PackInteger public readonly srid!: number | bigint;
    @PackFloat public readonly x!: number;
    @PackFloat public readonly y!: number;
    @PackFloat public readonly z!: number;

    constructor(srid: number | bigint, x: number, y: number, z: number) {
        this.srid = srid;
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
