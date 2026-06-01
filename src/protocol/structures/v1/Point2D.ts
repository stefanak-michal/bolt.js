import IStructure from '../IStructure';
import { PackFloat, PackInteger } from '../../../packstream/decorators';

/**
 * @link https://neo4j.com/docs/bolt/current/bolt/structure-semantics/#structure-point2d
 */
export default class Point2D implements IStructure {
    readonly signature = 0x58;

    @PackInteger public readonly srid!: number | bigint;
    @PackFloat public readonly x!: number;
    @PackFloat public readonly y!: number;

    constructor(srid: number | bigint, x: number, y: number) {
        this.srid = srid;
        this.x = x;
        this.y = y;
    }
}
