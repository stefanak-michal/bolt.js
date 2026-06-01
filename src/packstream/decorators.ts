const packTypes = new WeakMap<object, Record<string, 'float' | 'integer'>>();

export function PackFloat(target: object, key: string): void {
    if (!packTypes.has(target)) packTypes.set(target, {});
    packTypes.get(target)![key] = 'float';
}

export function PackInteger(target: object, key: string): void {
    if (!packTypes.has(target)) packTypes.set(target, {});
    packTypes.get(target)![key] = 'integer';
}

export function getFieldPackType(instance: object, field: string): 'float' | 'integer' | undefined {
    return packTypes.get(Object.getPrototypeOf(instance) as object)?.[field];
}
