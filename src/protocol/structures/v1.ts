import Node from './v1/Node';
import Relationship from './v1/Relationship';
import UnboundRelationship from './v1/UnboundRelationship';
import Path from './v1/Path';
import BoltDate from './v1/Date';
import Time from './v1/Time';
import LocalTime from './v1/LocalTime';
import LocalDateTime from './v1/LocalDateTime';
import DateTime from './v1/DateTime';
import DateTimeZoneId from './v1/DateTimeZoneId';
import Duration from './v1/Duration';
import Point2D from './v1/Point2D';
import Point3D from './v1/Point3D';
import IStructure from './IStructure';

export const unpackStructureMap = new Map<number, new (...args: any[]) => IStructure>([
    [0x4e, Node],
    [0x52, Relationship],
    [0x72, UnboundRelationship],
    [0x50, Path],
    [0x44, BoltDate],
    [0x54, Time],
    [0x74, LocalTime],
    [0x64, LocalDateTime],
    [0x46, DateTime],
    [0x66, DateTimeZoneId],
    [0x45, Duration],
    [0x58, Point2D],
    [0x59, Point3D],
]);
