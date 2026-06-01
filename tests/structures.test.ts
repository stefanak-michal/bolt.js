import { jest, expect, test } from '@jest/globals';
import Node from '../src/protocol/structures/v5/Node';
import Relationship from '../src/protocol/structures/v5/Relationship';
import UnboundRelationship from '../src/protocol/structures/v5/UnboundRelationship';
import Path from '../src/protocol/structures/v1/Path';
import BoltDate from '../src/protocol/structures/v1/Date';
import BoltTime from '../src/protocol/structures/v1/Time';
import LocalTime from '../src/protocol/structures/v1/LocalTime';
import LocalDateTime from '../src/protocol/structures/v1/LocalDateTime';
import Duration from '../src/protocol/structures/v1/Duration';
import Point2D from '../src/protocol/structures/v1/Point2D';
import Point3D from '../src/protocol/structures/v1/Point3D';
import DateTime from '../src/protocol/structures/v5/DateTime';
import DateTimeZoneId from '../src/protocol/structures/v5/DateTimeZoneId';
import { connect } from './utils';

jest.setTimeout(15000);

async function runQuery(p: any, query: string, params: Record<string, unknown> = {}): Promise<unknown[][]> {
    p.run(query, params);
    p.pull();
    const runResp = await p.getResponse();
    if (runResp.isFailure) throw new Error(`RUN failed: ${JSON.stringify(runResp.content)}`);
    const records: unknown[][] = [];
    for await (const resp of p.getResponses()) {
        if (resp.isRecord) {
            records.push(resp.content as unknown[]);
        }
    }
    return records;
}

// --- Return-only structures (cannot be passed as query parameters) ---

test('Node is returned as Node instance', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        p.begin();
        const beginResp = await p.getResponse();
        expect(beginResp.isSuccess).toBe(true);

        const records = await runQuery(p, 'CREATE (n:StructTestNode {val: $val}) RETURN n', { val: 42 });
        expect(records.length).toBe(1);
        const node = records[0][0] as Node;
        expect(node).toBeInstanceOf(Node);
        expect(node.labels).toContain('StructTestNode');
        expect(node.properties.val).toBe(42);
        expect(typeof node.elementId).toBe('string');

        p.rollback();
        const rollbackResp = await p.getResponse();
        expect(rollbackResp.isSuccess).toBe(true);
    } finally {
        conn.disconnect();
    }
});

test('Relationship is returned as Relationship instance', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        p.begin();
        const beginResp = await p.getResponse();
        expect(beginResp.isSuccess).toBe(true);

        const records = await runQuery(p, 'CREATE (a:RelTestA)-[r:STRUCT_REL {w: $w}]->(b:RelTestB) RETURN r', {
            w: 99,
        });
        expect(records.length).toBe(1);
        const rel = records[0][0] as Relationship;
        expect(rel).toBeInstanceOf(Relationship);
        expect(rel.type).toBe('STRUCT_REL');
        expect(rel.properties.w).toBe(99);
        expect(typeof rel.elementId).toBe('string');
        expect(typeof rel.startNodeElementId).toBe('string');
        expect(typeof rel.endNodeElementId).toBe('string');

        p.rollback();
        const rollbackResp = await p.getResponse();
        expect(rollbackResp.isSuccess).toBe(true);
    } finally {
        conn.disconnect();
    }
});

test('Path is returned as Path instance with Node and UnboundRelationship', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        p.begin();
        const beginResp = await p.getResponse();
        expect(beginResp.isSuccess).toBe(true);

        const records = await runQuery(p, 'CREATE path=(a:PathTestA)-[:PATH_REL]->(b:PathTestB) RETURN path');
        expect(records.length).toBe(1);
        const path = records[0][0] as Path;
        expect(path).toBeInstanceOf(Path);
        expect(path.nodes.length).toBe(2);
        expect(path.rels.length).toBe(1);
        expect(path.nodes[0]).toBeInstanceOf(Node);
        expect(path.nodes[1]).toBeInstanceOf(Node);
        expect(path.rels[0]).toBeInstanceOf(UnboundRelationship);
        expect(Array.isArray(path.indices)).toBe(true);

        p.rollback();
        const rollbackResp = await p.getResponse();
        expect(rollbackResp.isSuccess).toBe(true);
    } finally {
        conn.disconnect();
    }
});

// --- Roundtrip structures (passed as parameter, returned from query) ---

test('Date roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const date = new BoltDate(19372); // 2023-01-15
        const records = await runQuery(p, 'RETURN $val AS result', { val: date });
        expect(records.length).toBe(1);
        const result = records[0][0] as BoltDate;
        expect(result).toBeInstanceOf(BoltDate);
        expect(Number(result.days)).toBe(Number(date.days));
    } finally {
        conn.disconnect();
    }
});

test('Time roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const time = new BoltTime(45000000000000, 3600); // 12:30:00+01:00
        const records = await runQuery(p, 'RETURN $val AS result', { val: time });
        expect(records.length).toBe(1);
        const result = records[0][0] as BoltTime;
        expect(result).toBeInstanceOf(BoltTime);
        expect(Number(result.nanoseconds)).toBe(Number(time.nanoseconds));
        expect(Number(result.tz_offset_seconds)).toBe(Number(time.tz_offset_seconds));
    } finally {
        conn.disconnect();
    }
});

test('LocalTime roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const lt = new LocalTime(45000000000000); // 12:30:00
        const records = await runQuery(p, 'RETURN $val AS result', { val: lt });
        expect(records.length).toBe(1);
        const result = records[0][0] as LocalTime;
        expect(result).toBeInstanceOf(LocalTime);
        expect(Number(result.nanoseconds)).toBe(Number(lt.nanoseconds));
    } finally {
        conn.disconnect();
    }
});

test('LocalDateTime roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const ldt = new LocalDateTime(1673771400, 500000000); // 2023-01-15T12:30:00.5
        const records = await runQuery(p, 'RETURN $val AS result', { val: ldt });
        expect(records.length).toBe(1);
        const result = records[0][0] as LocalDateTime;
        expect(result).toBeInstanceOf(LocalDateTime);
        expect(Number(result.seconds)).toBe(Number(ldt.seconds));
        expect(Number(result.nanoseconds)).toBe(Number(ldt.nanoseconds));
    } finally {
        conn.disconnect();
    }
});

test('DateTime roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const dt = new DateTime(1673771400, 0, 3600); // 2023-01-15T12:30:00+01:00
        const records = await runQuery(p, 'RETURN $val AS result', { val: dt });
        expect(records.length).toBe(1);
        const result = records[0][0] as DateTime;
        expect(result).toBeInstanceOf(DateTime);
        expect(Number(result.seconds)).toBe(Number(dt.seconds));
        expect(Number(result.nanoseconds)).toBe(Number(dt.nanoseconds));
        expect(Number(result.tz_offset_seconds)).toBe(Number(dt.tz_offset_seconds));
    } finally {
        conn.disconnect();
    }
});

test('DateTimeZoneId roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const dtz = new DateTimeZoneId(1673771400, 0, 'Europe/London');
        const records = await runQuery(p, 'RETURN $val AS result', { val: dtz });
        expect(records.length).toBe(1);
        const result = records[0][0] as DateTimeZoneId;
        expect(result).toBeInstanceOf(DateTimeZoneId);
        expect(Number(result.seconds)).toBe(Number(dtz.seconds));
        expect(Number(result.nanoseconds)).toBe(Number(dtz.nanoseconds));
        expect(result.tz_id).toBe(dtz.tz_id);
    } finally {
        conn.disconnect();
    }
});

test('Duration roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const dur = new Duration(1, 2, 3, 4);
        const records = await runQuery(p, 'RETURN $val AS result', { val: dur });
        expect(records.length).toBe(1);
        const result = records[0][0] as Duration;
        expect(result).toBeInstanceOf(Duration);
        expect(Number(result.months)).toBe(Number(dur.months));
        expect(Number(result.days)).toBe(Number(dur.days));
        expect(Number(result.seconds)).toBe(Number(dur.seconds));
        expect(Number(result.nanoseconds)).toBe(Number(dur.nanoseconds));
    } finally {
        conn.disconnect();
    }
});

test('Point2D roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const pt = new Point2D(4326, 13.405, 52.52); // Berlin approx (WGS84)
        const records = await runQuery(p, 'RETURN $val AS result', { val: pt });
        expect(records.length).toBe(1);
        const result = records[0][0] as Point2D;
        expect(result).toBeInstanceOf(Point2D);
        expect(Number(result.srid)).toBe(Number(pt.srid));
        expect(result.x).toBeCloseTo(pt.x, 4);
        expect(result.y).toBeCloseTo(pt.y, 4);
    } finally {
        conn.disconnect();
    }
});

test('Point3D roundtrip as query parameter', async () => {
    const { protocol, conn } = await connect();
    const p = protocol as any;
    try {
        const pt = new Point3D(4979, 13.405, 52.52, 34.0); // Berlin approx with elevation (WGS84 3D)
        const records = await runQuery(p, 'RETURN $val AS result', { val: pt });
        expect(records.length).toBe(1);
        const result = records[0][0] as Point3D;
        expect(result).toBeInstanceOf(Point3D);
        expect(Number(result.srid)).toBe(Number(pt.srid));
        expect(result.x).toBeCloseTo(pt.x, 4);
        expect(result.y).toBeCloseTo(pt.y, 4);
        expect(result.z).toBeCloseTo(pt.z, 4);
    } finally {
        conn.disconnect();
    }
});
