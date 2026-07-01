import { findCurrentGroupIndex } from './groups.js';
import {
  findCurrentStopIndex,
  groupIndexForStop,
  stopIndexForGroup,
} from './navigation.js';

const STORAGE_PREFIX = 'zaki_v2_';

function storageKey(tourId) {
  return `${STORAGE_PREFIX}${tourId}`;
}

export function createInitialState(tourId) {
  return {
    tourId,
    statuses: {},
    notes: {},
    startTime: Date.now(),
    currentGroupIndex: 0,
    currentStopIndex: 0,
    navMode: localStorage.getItem('zaki_nav_mode') || 'group',
    selectMode: localStorage.getItem('zaki_select_mode') || 'auto',
    navProvider: localStorage.getItem('zaki_nav_provider') || 'google',
    autoNav: localStorage.getItem('zaki_auto_nav') === 'true',
    undoStack: [],
    showNotes: {},
  };
}

export function loadState(tourId, groups, stops) {
  try {
    const raw = localStorage.getItem(storageKey(tourId));
    if (!raw) return createInitialState(tourId);

    const parsed = JSON.parse(raw);
    const state = {
      ...createInitialState(tourId),
      ...parsed,
      undoStack: [],
      showNotes: {},
    };

    if (state.selectMode === 'auto') {
      state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
      state.currentStopIndex = findCurrentStopIndex(stops, state.statuses);
    } else {
      state.currentGroupIndex = Math.min(state.currentGroupIndex ?? 0, groups.length);
      state.currentStopIndex = Math.min(state.currentStopIndex ?? 0, stops.length);
    }

    return state;
  } catch {
    return createInitialState(tourId);
  }
}

export function saveState(state) {
  const { undoStack, showNotes, ...persisted } = state;
  localStorage.setItem(storageKey(state.tourId), JSON.stringify(persisted));
}

function pushUndo(state, snapshot) {
  state.undoStack.push(snapshot);
  if (state.undoStack.length > 20) state.undoStack.shift();
}

function snapshot(state) {
  return {
    statuses: structuredClone(state.statuses),
    notes: structuredClone(state.notes),
    currentGroupIndex: state.currentGroupIndex,
    currentStopIndex: state.currentStopIndex,
  };
}

function advanceIfAuto(state, stops, groups) {
  if (state.selectMode !== 'auto') return;
  state.currentStopIndex = findCurrentStopIndex(stops, state.statuses);
  state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
}

export function setStopStatus(state, stopId, status, groups, stops) {
  pushUndo(state, snapshot(state));

  state.statuses[stopId] = {
    status,
    timestamp: Date.now(),
  };

  advanceIfAuto(state, stops, groups);
  saveState(state);
  return state;
}

export function setGroupStatus(state, group, status, groups, stops) {
  pushUndo(state, snapshot(state));

  const now = Date.now();
  for (const stop of group.stops) {
    state.statuses[stop.id] = { status, timestamp: now };
  }

  advanceIfAuto(state, stops, groups);
  saveState(state);
  return state;
}

export function setNote(state, stopId, note) {
  state.notes[stopId] = note;
  saveState(state);
  return state;
}

export function undo(state, groups, stops) {
  const prev = state.undoStack.pop();
  if (!prev) return false;

  state.statuses = prev.statuses;
  state.notes = prev.notes;
  state.currentGroupIndex = prev.currentGroupIndex;
  state.currentStopIndex = prev.currentStopIndex;

  if (state.selectMode === 'auto') {
    advanceIfAuto(state, stops, groups);
  }

  saveState(state);
  return true;
}

export function jumpToGroup(state, groupIndex, stops, groups) {
  state.currentGroupIndex = Math.max(0, Math.min(groupIndex, groups.length - 1));
  state.currentStopIndex = stopIndexForGroup(stops, groups[state.currentGroupIndex]);
  saveState(state);
  return state;
}

export function jumpToStop(state, stopIndex, stops, groups) {
  state.currentStopIndex = Math.max(0, Math.min(stopIndex, stops.length - 1));
  state.currentGroupIndex = groupIndexForStop(stops, groups, state.currentStopIndex);
  saveState(state);
  return state;
}

export function stepNav(state, direction, stops, groups) {
  if (state.navMode === 'single') {
    const next =
      direction === 'next'
        ? Math.min(state.currentStopIndex + 1, stops.length - 1)
        : Math.max(state.currentStopIndex - 1, 0);
    return jumpToStop(state, next, stops, groups);
  }

  const next =
    direction === 'next'
      ? Math.min(state.currentGroupIndex + 1, groups.length - 1)
      : Math.max(state.currentGroupIndex - 1, 0);
  return jumpToGroup(state, next, stops, groups);
}

export function resetTour(state) {
  const tourId = state.tourId;
  const navProvider = state.navProvider;
  const autoNav = state.autoNav;
  localStorage.removeItem(storageKey(tourId));
  const fresh = createInitialState(tourId);
  fresh.navProvider = navProvider;
  fresh.autoNav = autoNav;
  return fresh;
}

export function setSetting(state, key, value) {
  state[key] = value;
  if (key === 'navProvider') localStorage.setItem('zaki_nav_provider', value);
  if (key === 'autoNav') localStorage.setItem('zaki_auto_nav', String(value));
  if (key === 'navMode') localStorage.setItem('zaki_nav_mode', value);
  if (key === 'selectMode') localStorage.setItem('zaki_select_mode', value);
  saveState(state);
  return state;
}

export function exportState(state) {
  return JSON.stringify(
    {
      tourId: state.tourId,
      statuses: state.statuses,
      notes: state.notes,
      startTime: state.startTime,
      exportedAt: Date.now(),
    },
    null,
    2
  );
}

export function importState(tourId, json, groups, stops) {
  const data = JSON.parse(json);
  const state = createInitialState(tourId);
  state.statuses = data.statuses || {};
  state.notes = data.notes || {};
  state.startTime = data.startTime || Date.now();
  state.navMode = data.navMode || state.navMode;
  state.selectMode = data.selectMode || state.selectMode;

  if (state.selectMode === 'auto') {
    state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
    state.currentStopIndex = findCurrentStopIndex(stops, state.statuses);
  }

  saveState(state);
  return state;
}
