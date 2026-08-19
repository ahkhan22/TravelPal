import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { SAMPLE_EXPENSES, SAMPLE_TRIP } from './data';
import { loadJSON, saveJSON } from './storage';
import type { DayMeal, DayPlace, Expense, Photo, Trip, UserMeal, UserPlace } from './types';

// In-memory store with persistence. The sample trip and its seed content stay
// code-defined; anything the user adds (scanned receipts, imported photos, and
// meals/places they log) is persisted to AsyncStorage and merged back on top of
// the seeds at launch. The rest of the app talks only to this interface, so
// swapping in real ingestion or sync later touches nothing above it.

const EXPENSES_KEY = 'travelpal.userExpenses.v1';
const PHOTOS_KEY = 'travelpal.userPhotos.v1';
const MEALS_KEY = 'travelpal.userMeals.v1';
const PLACES_KEY = 'travelpal.userPlaces.v1';

interface State {
  trips: Trip[];
  userExpenses: Expense[];
  userPhotos: Photo[];
  userMeals: UserMeal[];
  userPlaces: UserPlace[];
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; userExpenses: Expense[]; userPhotos: Photo[]; userMeals: UserMeal[]; userPlaces: UserPlace[] }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'ADD_PHOTOS'; photos: Photo[] }
  | { type: 'UPDATE_PHOTO'; id: string; patch: Partial<Photo> }
  | { type: 'DELETE_PHOTO'; id: string }
  | { type: 'ADD_MEAL'; meal: UserMeal }
  | { type: 'DELETE_MEAL'; id: string }
  | { type: 'ADD_PLACE'; place: UserPlace }
  | { type: 'DELETE_PLACE'; id: string };

const initialState: State = {
  trips: [SAMPLE_TRIP],
  userExpenses: [],
  userPhotos: [],
  userMeals: [],
  userPlaces: [],
  hydrated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        userExpenses: action.userExpenses,
        userPhotos: action.userPhotos,
        userMeals: action.userMeals,
        userPlaces: action.userPlaces,
        hydrated: true,
      };
    case 'ADD_EXPENSE':
      return { ...state, userExpenses: [...state.userExpenses, action.expense] };
    case 'ADD_PHOTOS':
      return { ...state, userPhotos: [...state.userPhotos, ...action.photos] };
    case 'UPDATE_PHOTO':
      return { ...state, userPhotos: state.userPhotos.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) };
    case 'DELETE_PHOTO':
      return { ...state, userPhotos: state.userPhotos.filter((p) => p.id !== action.id) };
    case 'ADD_MEAL':
      return { ...state, userMeals: [...state.userMeals, action.meal] };
    case 'DELETE_MEAL':
      return { ...state, userMeals: state.userMeals.filter((m) => m.id !== action.id) };
    case 'ADD_PLACE':
      return { ...state, userPlaces: [...state.userPlaces, action.place] };
    case 'DELETE_PLACE':
      return { ...state, userPlaces: state.userPlaces.filter((p) => p.id !== action.id) };
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
  getAllPhotos: () => Photo[];
  getPhoto: (id: string) => Photo | undefined;
  addPhotos: (photos: Omit<Photo, 'id'>[]) => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  deletePhoto: (id: string) => void;
  getMeals: (tripId: string, dayIndex: number) => DayMeal[];
  getPlaces: (tripId: string, dayIndex: number) => DayPlace[];
  addMeal: (meal: Omit<UserMeal, 'id'>) => void;
  deleteMeal: (id: string) => void;
  addPlace: (place: Omit<UserPlace, 'id'>) => void;
  deletePlace: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let idCounter = 0;
function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${idCounter++}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadJSON<Expense[]>(EXPENSES_KEY),
      loadJSON<Photo[]>(PHOTOS_KEY),
      loadJSON<UserMeal[]>(MEALS_KEY),
      loadJSON<UserPlace[]>(PLACES_KEY),
    ]).then(([expenses, photos, meals, places]) => {
      if (active)
        dispatch({
          type: 'HYDRATE',
          userExpenses: expenses ?? [],
          userPhotos: photos ?? [],
          userMeals: meals ?? [],
          userPlaces: places ?? [],
        });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (state.hydrated) saveJSON(EXPENSES_KEY, state.userExpenses);
  }, [state.userExpenses, state.hydrated]);
  useEffect(() => {
    if (state.hydrated) saveJSON(PHOTOS_KEY, state.userPhotos);
  }, [state.userPhotos, state.hydrated]);
  useEffect(() => {
    if (state.hydrated) saveJSON(MEALS_KEY, state.userMeals);
  }, [state.userMeals, state.hydrated]);
  useEffect(() => {
    if (state.hydrated) saveJSON(PLACES_KEY, state.userPlaces);
  }, [state.userPlaces, state.hydrated]);

  const expenses = useMemo(() => [...SAMPLE_EXPENSES, ...state.userExpenses], [state.userExpenses]);

  const value = useMemo<StoreValue>(() => {
    const trips = state.trips;
    const findDay = (tripId: string, dayIndex: number) =>
      trips.find((t) => t.id === tripId)?.days.find((d) => d.index === dayIndex);

    return {
      trips,
      expenses,
      hydrated: state.hydrated,
      getTrip: (id) => trips.find((t) => t.id === id),
      getExpenses: (tripId) => expenses.filter((e) => e.tripId === tripId),
      addExpense: (expense) => dispatch({ type: 'ADD_EXPENSE', expense: { ...expense, id: makeId('exp') } }),
      getPhotos: (tripId) => state.userPhotos.filter((p) => p.tripId === tripId),
      getAllPhotos: () => state.userPhotos,
      getPhoto: (id) => state.userPhotos.find((p) => p.id === id),
      addPhotos: (photos) => dispatch({ type: 'ADD_PHOTOS', photos: photos.map((p) => ({ ...p, id: makeId('pho') })) }),
      updatePhoto: (id, patch) => dispatch({ type: 'UPDATE_PHOTO', id, patch }),
      deletePhoto: (id) => dispatch({ type: 'DELETE_PHOTO', id }),
      getMeals: (tripId, dayIndex) => {
        const seed: DayMeal[] = (findDay(tripId, dayIndex)?.meals ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          location: m.location,
          dish: m.dish,
          rating: m.rating,
          receipt: m.receipt,
          editable: false,
        }));
        const user: DayMeal[] = state.userMeals
          .filter((m) => m.tripId === tripId && m.dayIndex === dayIndex)
          .map((m) => ({ id: m.id, name: m.name, location: m.location, dish: m.dish, rating: m.rating, editable: true }));
        return [...seed, ...user];
      },
      getPlaces: (tripId, dayIndex) => {
        const seed: DayPlace[] = (findDay(tripId, dayIndex)?.places ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          note: p.note,
          gradient: p.gradient,
          editable: false,
        }));
        const user: DayPlace[] = state.userPlaces
          .filter((p) => p.tripId === tripId && p.dayIndex === dayIndex)
          .map((p) => ({ id: p.id, name: p.name, note: p.note, editable: true }));
        return [...seed, ...user];
      },
      addMeal: (meal) => dispatch({ type: 'ADD_MEAL', meal: { ...meal, id: makeId('meal') } }),
      deleteMeal: (id) => dispatch({ type: 'DELETE_MEAL', id }),
      addPlace: (place) => dispatch({ type: 'ADD_PLACE', place: { ...place, id: makeId('place') } }),
      deletePlace: (id) => dispatch({ type: 'DELETE_PLACE', id }),
    };
  }, [state, expenses]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
