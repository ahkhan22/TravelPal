import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { SAMPLE_EXPENSES, SAMPLE_TRIP } from './data';
import type { Expense, Trip } from './types';

// A tiny in-memory store. It seeds the sample Lahore trip and lets new expenses
// (e.g. a scanned receipt) be added, so the wallet updates live. Persistence and
// real ingestion (email, photos) slot in behind this same interface later.

interface State {
  trips: Trip[];
  expenses: Expense[];
}

type Action = { type: 'ADD_EXPENSE'; expense: Expense };

const initialState: State = {
  trips: [SAMPLE_TRIP],
  expenses: SAMPLE_EXPENSES,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.expense] };
    default:
      return state;
  }
}

interface StoreValue {
  trips: Trip[];
  expenses: Expense[];
  getTrip: (id: string) => Trip | undefined;
  getExpenses: (tripId: string) => Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let nextId = 1;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<StoreValue>(
    () => ({
      trips: state.trips,
      expenses: state.expenses,
      getTrip: (id) => state.trips.find((t) => t.id === id),
      getExpenses: (tripId) => state.expenses.filter((e) => e.tripId === tripId),
      addExpense: (expense) =>
        dispatch({ type: 'ADD_EXPENSE', expense: { ...expense, id: `user-${nextId++}` } }),
    }),
    [state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
