import { findCurrentGroupIndex } from './groups.js';

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
    navProvider: localStorage.getItem('zaki_nav_provider') || 'google',
    autoNav: localStorage.getItem('zaki_auto_nav') !== 'false',
    undoStack: [],
    showNotes: {},
  };
}

export function loadState(tourId, groups) {
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
    state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
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
  };
}

export function setStopStatus(state, stopId, status, groups) {
  pushUndo(state, snapshot(state));

  state.statuses[stopId] = {
    status,
    timestamp: Date.now(),
  };

  state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
  saveState(state);
  return state;
}

export function setGroupStatus(state, group, status, groups) {
  pushUndo(state, snapshot(state));

  const now = Date.now();
  for (const stop of group.stops) {
    state.statuses[stop.id] = { status, timestamp: now };
  }

  state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
  saveState(state);
  return state;
}

export function setNote(state, stopId, note) {
  state.notes[stopId] = note;
  saveState(state);
  return state;
}

export function undo(state, groups) {
  const prev = state.undoStack.pop();
  if (!prev) return false;

  state.statuses = prev.statuses;
  state.notes = prev.notes;
  state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
  saveState(state);
  return true;
}

export function jumpToGroup(state, groupIndex) {
  state.currentGroupIndex = groupIndex;
  saveState(state);
  return state;
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

export function importState(tourId, json, groups) {
  const data = JSON.parse(json);
  const state = createInitialState(tourId);
  state.statuses = data.statuses || {};
  state.notes = data.notes || {};
  state.startTime = data.startTime || Date.now();
  state.currentGroupIndex = findCurrentGroupIndex(groups, state.statuses);
  saveState(state);
  return state;
}
