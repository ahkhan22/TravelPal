import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { SAMPLE_EXPENSES, SAMPLE_TRIP } from './data';
import { loadJSON, saveJSON } from './storage';
import type { Expense, Trip } from './types';

// In-memory store with persistence. The sample trip and its seed expenses stay
// code-defined; anything the user adds (e.g. a scanned receipt) is persisted to
// AsyncStorage and merged back on top of the seeds at launch. The rest of the
// app talks only to this interface, so swapping in real ingestion/sync later
// touches nothing above it.

const USER_EXPENSES_KEY = 'travelpal.userExpenses.v1';

interface State {
  trips: Trip[];
  userExpenses: Expense[];
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; userExpenses: Expense[] }
  | { type: 'ADD_EXPENSE'; expense: Expense };

const initialState: State = {
  trips: [SAMPLE_TRIP],
  userExpenses: [],
  hydrated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, userExpenses: action.userExpenses, hydrated: true };
    case 'ADD_EXPENSE':
      return { ...state, userExpenses: [...state.userExpenses, action.expense] };
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
}

const StoreContext = createContext<StoreValue | null>(null);

let idCounter = 0;
function makeId(): string {
  // Time-based so ids stay unique across app restarts (the counter alone resets).
  return `user-${Date.now().toString(36)}-${idCounter++}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted user expenses once on mount.
  useEffect(() => {
    let active = true;
    loadJSON<Expense[]>(USER_EXPENSES_KEY).then((saved) => {
      if (active) dispatch({ type: 'HYDRATE', userExpenses: saved ?? [] });
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist whenever user expenses change (but not before hydration, or we'd
  // clobber the saved data with the empty initial state).
  useEffect(() => {
    if (state.hydrated) saveJSON(USER_EXPENSES_KEY, state.userExpenses);
  }, [state.userExpenses, state.hydrated]);

  const expenses = useMemo(
    () => [...SAMPLE_EXPENSES, ...state.userExpenses],
    [state.userExpenses],
  );

  const value = useMemo<StoreValue>(
    () => ({
      trips: state.trips,
      expenses,
      hydrated: state.hydrated,
      getTrip: (id) => state.trips.find((t) => t.id === id),
      getExpenses: (tripId) => expenses.filter((e) => e.tripId === tripId),
      addExpense: (expense) => dispatch({ type: 'ADD_EXPENSE', expense: { ...expense, id: makeId() } }),
    }),
    [state.trips, state.hydrated, expenses],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
