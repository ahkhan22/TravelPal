import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { SAMPLE_EXPENSES, SAMPLE_TRIP } from './data';
import { loadJSON, saveJSON } from './storage';
import type { Expense, Photo, Trip } from './types';

// In-memory store with persistence. The sample trip and its seed expenses stay
// code-defined; anything the user adds (scanned receipts, imported photos) is
// persisted to AsyncStorage and merged back on top of the seeds at launch. The
// rest of the app talks only to this interface, so swapping in real ingestion or
// sync later touches nothing above it.

const EXPENSES_KEY = 'travelpal.userExpenses.v1';
const PHOTOS_KEY = 'travelpal.userPhotos.v1';

interface State {
  trips: Trip[];
  userExpenses: Expense[];
  userPhotos: Photo[];
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; userExpenses: Expense[]; userPhotos: Photo[] }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'ADD_PHOTOS'; photos: Photo[] }
  | { type: 'UPDATE_PHOTO'; id: string; patch: Partial<Photo> }
  | { type: 'DELETE_PHOTO'; id: string };

const initialState: State = {
  trips: [SAMPLE_TRIP],
  userExpenses: [],
  userPhotos: [],
  hydrated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, userExpenses: action.userExpenses, userPhotos: action.userPhotos, hydrated: true };
    case 'ADD_EXPENSE':
      return { ...state, userExpenses: [...state.userExpenses, action.expense] };
    case 'ADD_PHOTOS':
      return { ...state, userPhotos: [...state.userPhotos, ...action.photos] };
    case 'UPDATE_PHOTO':
      return {
        ...state,
        userPhotos: state.userPhotos.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    case 'DELETE_PHOTO':
      return { ...state, userPhotos: state.userPhotos.filter((p) => p.id !== action.id) };
    default:
      return state;
  }
}

interface StoreValue {
  trips: Trip[];
  expenses: Expense[];
  hydrated: boolean;
  getTrip: (id: string) => Trip | undefined;
  getExpenses: (tripId: string) => Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  getPhotos: (tripId: string) => Photo[];
  getPhoto: (id: string) => Photo | undefined;
  addPhotos: (photos: Omit<Photo, 'id'>[]) => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  deletePhoto: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let idCounter = 0;
function makeId(prefix: string): string {
  // Time-based so ids stay unique across app restarts (the counter alone resets).
  return `${prefix}-${Date.now().toString(36)}-${idCounter++}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted data once on mount.
  useEffect(() => {
    let active = true;
    Promise.all([loadJSON<Expense[]>(EXPENSES_KEY), loadJSON<Photo[]>(PHOTOS_KEY)]).then(
      ([expenses, photos]) => {
        if (active) dispatch({ type: 'HYDRATE', userExpenses: expenses ?? [], userPhotos: photos ?? [] });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  // Persist on change (never before hydration, or we'd clobber saved data).
  useEffect(() => {
    if (state.hydrated) saveJSON(EXPENSES_KEY, state.userExpenses);
  }, [state.userExpenses, state.hydrated]);
  useEffect(() => {
    if (state.hydrated) saveJSON(PHOTOS_KEY, state.userPhotos);
  }, [state.userPhotos, state.hydrated]);

  const expenses = useMemo(() => [...SAMPLE_EXPENSES, ...state.userExpenses], [state.userExpenses]);

  const value = useMemo<StoreValue>(
    () => ({
      trips: state.trips,
      expenses,
      hydrated: state.hydrated,
      getTrip: (id) => state.trips.find((t) => t.id === id),
      getExpenses: (tripId) => expenses.filter((e) => e.tripId === tripId),
      addExpense: (expense) => dispatch({ type: 'ADD_EXPENSE', expense: { ...expense, id: makeId('exp') } }),
      getPhotos: (tripId) => state.userPhotos.filter((p) => p.tripId === tripId),
      getPhoto: (id) => state.userPhotos.find((p) => p.id === id),
      addPhotos: (photos) =>
        dispatch({ type: 'ADD_PHOTOS', photos: photos.map((p) => ({ ...p, id: makeId('pho') })) }),
      updatePhoto: (id, patch) => dispatch({ type: 'UPDATE_PHOTO', id, patch }),
      deletePhoto: (id) => dispatch({ type: 'DELETE_PHOTO', id }),
    }),
    [state.trips, state.hydrated, state.userPhotos, expenses],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
