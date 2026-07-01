import { describe, it, expect } from 'vitest';
import { findCurrentStopIndex, groupIndexForStop, stopIndexForGroup } from '../src/lib/navigation.js';
import { groupStops } from '../src/lib/groups.js';

const sampleStops = [
  { id: '1', name: 'A', street: 'Str 1', plz: '12345', city: 'X', type: 'T' },
  { id: '2', name: 'A', street: 'Str 1', plz: '12345', city: 'X', type: 'T' },
  { id: '3', name: 'B', street: 'Str 2', plz: '12345', city: 'X', type: 'T' },
];

describe('findCurrentStopIndex', () => {
  it('findet ersten offenen Stopp', () => {
    expect(findCurrentStopIndex(sampleStops, { 1: { status: 'delivered' } })).toBe(1);
  });

  it('gibt length zurück wenn alle erledigt', () => {
    expect(
      findCurrentStopIndex(sampleStops, {
        1: { status: 'delivered' },
        2: { status: 'delivered' },
        3: { status: 'delivered' },
      })
    ).toBe(3);
  });
});

describe('groupIndexForStop', () => {
  const groups = groupStops(sampleStops);

  it('mappt Stopp auf Gruppe', () => {
    expect(groupIndexForStop(sampleStops, groups, 2)).toBe(1);
  });
});

describe('stopIndexForGroup', () => {
  const groups = groupStops(sampleStops);

  it('mappt Gruppe auf ersten Stopp', () => {
    expect(stopIndexForGroup(sampleStops, groups[1])).toBe(2);
  });
});
