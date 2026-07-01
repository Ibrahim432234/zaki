import { describe, it, expect } from 'vitest';
import { groupStops, findCurrentGroupIndex, isGroupComplete, getStats } from '../src/lib/groups.js';

const sampleStops = [
  { id: '1', name: 'A', street: 'Str 1', plz: '12345', city: 'X' },
  { id: '2', name: 'A', street: 'Str 1', plz: '12345', city: 'X' },
  { id: '3', name: 'B', street: 'Str 2', plz: '12345', city: 'X' },
];

describe('groupStops', () => {
  it('gruppiert aufeinanderfolgende gleiche Adressen', () => {
    const groups = groupStops(sampleStops);
    expect(groups).toHaveLength(2);
    expect(groups[0].stops).toHaveLength(2);
    expect(groups[1].stops).toHaveLength(1);
  });
});

describe('findCurrentGroupIndex', () => {
  it('findet erste unvollständige Gruppe', () => {
    const groups = groupStops(sampleStops);
    const statuses = { 1: { status: 'delivered' } };
    expect(findCurrentGroupIndex(groups, statuses)).toBe(0);
  });

  it('gibt groups.length zurück wenn alles erledigt', () => {
    const groups = groupStops(sampleStops);
    const statuses = {
      1: { status: 'delivered' },
      2: { status: 'delivered' },
      3: { status: 'delivered' },
    };
    expect(findCurrentGroupIndex(groups, statuses)).toBe(2);
  });
});

describe('getStats', () => {
  it('zählt Status korrekt', () => {
    const stats = getStats({
      a: { status: 'delivered' },
      b: { status: 'nothome' },
      c: { status: 'partial' },
    });
    expect(stats.delivered).toBe(1);
    expect(stats.nothome).toBe(1);
    expect(stats.partial).toBe(1);
    expect(stats.total).toBe(3);
  });
});

describe('isGroupComplete', () => {
  it('erkennt vollständige Gruppe', () => {
    const groups = groupStops(sampleStops);
    const statuses = { 1: { status: 'delivered' }, 2: { status: 'delivered' } };
    expect(isGroupComplete(groups[0], statuses)).toBe(true);
  });
});
