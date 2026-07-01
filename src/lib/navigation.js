import { findCurrentGroupIndex, isGroupComplete } from './groups.js';

export function findCurrentStopIndex(stops, statuses) {
  const idx = stops.findIndex((s) => statuses[s.id] === undefined);
  return idx === -1 ? stops.length : idx;
}

export function isTourComplete(stops, statuses) {
  return findCurrentStopIndex(stops, statuses) >= stops.length;
}

export function isNavComplete(state, stops, groups) {
  if (state.navMode === 'single') {
    return state.currentStopIndex >= stops.length;
  }
  return state.currentGroupIndex >= groups.length;
}

/** Gibt den aktuell angezeigten Stopp zurück (auch im Gruppenmodus). */
export function getActiveStop(state, stops, groups) {
  if (state.navMode === 'single') {
    return stops[state.currentStopIndex] ?? null;
  }
  const group = groups[state.currentGroupIndex];
  if (!group) return null;
  const open = group.stops.find((s) => state.statuses[s.id] === undefined);
  return open ?? group.stops[0];
}

export function getActiveGroup(state, groups) {
  return groups[state.currentGroupIndex] ?? null;
}

export function syncAutoPosition(state, stops, groups) {
  if (state.selectMode !== 'auto') return state;
  state.currentStopIndex = findCurrentStopIndex(stops, state.statuses);
  state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
  return state;
}

export function getNextGroupIndex(state, groups) {
  return Math.min(state.currentGroupIndex + 1, groups.length);
}

export function getPrevGroupIndex(state) {
  return Math.max(state.currentGroupIndex - 1, 0);
}

export function getNextStopIndex(state, stops) {
  return Math.min(state.currentStopIndex + 1, stops.length);
}

export function getPrevStopIndex(state) {
  return Math.max(state.currentStopIndex - 1, 0);
}

export function groupIndexForStop(stops, groups, stopIndex) {
  const stop = stops[stopIndex];
  if (!stop) return 0;
  const idx = groups.findIndex((g) => g.stops.some((s) => s.id === stop.id));
  return idx === -1 ? 0 : idx;
}

export function isStopInCurrentGroup(state, stops, groups, stopIndex) {
  if (state.navMode === 'single') {
    return state.currentStopIndex === stopIndex;
  }
  const stop = stops[stopIndex];
  const group = groups[state.currentGroupIndex];
  return group?.stops.some((s) => s.id === stop.id) ?? false;
}

export function stopIndexForGroup(stops, group) {
  const first = group?.stops[0];
  if (!first) return 0;
  const idx = stops.findIndex((s) => s.id === first.id);
  return idx === -1 ? 0 : idx;
}

export function isGroupCurrent(state, groupIndex) {
  return state.navMode === 'group' && state.currentGroupIndex === groupIndex;
}

export function countOpenInGroup(group, statuses) {
  return group.stops.filter((s) => statuses[s.id] === undefined).length;
}

export function isGroupFullyDone(group, statuses) {
  return isGroupComplete(group, statuses);
}
