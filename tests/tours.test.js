import { describe, it, expect } from 'vitest';
import { formatStopId, formatStopIdRange } from '../src/lib/tours.js';

describe('formatStopId', () => {
  it('formatiert Tour-Nummern mit Bindestrich', () => {
    expect(formatStopId('186010')).toBe('186-010');
    expect(formatStopId('186005')).toBe('186-005');
    expect(formatStopId('186445')).toBe('186-445');
  });
});

describe('formatStopIdRange', () => {
  it('zeigt Bereich kompakt', () => {
    const stops = [{ id: '186010' }, { id: '186020' }, { id: '186150' }];
    expect(formatStopIdRange(stops)).toBe('186-010 bis 186-150');
  });

  it('einzelner Stopp ohne bis', () => {
    expect(formatStopIdRange([{ id: '186160' }])).toBe('186-160');
  });
});
