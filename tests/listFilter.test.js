import { describe, it, expect } from 'vitest';
import { filterStops, matchesSearch, countByFilter } from '../src/lib/listFilter.js';
import { groupStops } from '../src/lib/groups.js';

const stops = [
  { id: '186010', name: 'Engelbrecht', street: 'Feuerwache 8', plz: '27570', city: 'Bremerhaven' },
  { id: '186160', name: 'Aral', street: 'Stresemannstr. 118', plz: '27576', city: 'Bremerhaven' },
];

describe('listFilter', () => {
  it('finds stops by formatted id without dash', () => {
    expect(matchesSearch(stops[0], '186010')).toBe(true);
    expect(matchesSearch(stops[0], '186-010')).toBe(true);
    expect(matchesSearch(stops[0], '010')).toBe(true);
  });

  it('finds stops by street and name', () => {
    expect(matchesSearch(stops[1], 'stresemann')).toBe(true);
    expect(matchesSearch(stops[1], 'aral')).toBe(true);
  });

  it('filters open stops only', () => {
    const groups = groupStops(stops);
    const state = {
      statuses: { '186010': { status: 'delivered' } },
      currentGroupIndex: 1,
    };
    const result = filterStops(stops, state, groups, { statusFilter: 'open' });
    expect(result.map((s) => s.id)).toEqual(['186160']);
  });

  it('counts filters correctly', () => {
    const groups = groupStops(stops);
    const state = {
      statuses: { '186010': { status: 'delivered' }, '186160': { status: 'nothome' } },
      currentGroupIndex: 0,
    };
    expect(countByFilter(stops, state, groups)).toEqual({
      all: 2,
      open: 0,
      delivered: 1,
      nothome: 1,
      current: 1,
    });
  });
});
