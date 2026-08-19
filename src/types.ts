// Core data model for TravelPal.
// A Trip is organized around Days. Each Day owns the meals, places, photos and
// expenses that happened that day. Expenses roll up into the Trip wallet.

export type ExpenseCategory =
  | 'Flights'
  | 'Hotel'
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Activities'
  | 'Other';

export type ExpenseSource = 'scan' | 'email' | 'card' | 'manual';

export interface Expense {
  id: string;
  tripId: string;
  /** Day index this expense belongs to, or null for trip-wide costs (flights, hotel). */
  dayIndex: number | null;
  label: string;
  category: ExpenseCategory;
  /** Amount in the traveller's home currency (USD in the sample data). */
  amountHome: number;
  /** Optional original amount as printed on the receipt. */
  local?: { amount: number; currency: string };
  source: ExpenseSource;
  merchant?: string;
  /** ISO date string. */
  date?: string;
  /** Local file URI of the captured receipt photo, if any. */
  receiptPhotoUri?: string;
}

export interface ReceiptLine {
  label: string;
  price: string;
}

export interface Receipt {
  items: ReceiptLine[];
  total: string;
  usd: string;
  source: ExpenseSource;
}

export interface Meal {
  id: string;
  name: string;
  location: string;
  /** Short description; may contain **bold** markers for emphasis. */
  dish: string;
  rating: number; // 0-5
  gradient: number;
  receipt: Receipt;
}

export interface Place {
  id: string;
  name: string;
  note: string;
  gradient: number;
  favorite?: boolean;
}

export interface Hero {
  caption: string;
  gradient: number;
  favorite?: boolean;
}

export interface Day {
  index: number;
  dateLabel: string;
  title: string;
  heroes: Hero[];
  meals: Meal[];
  places: Place[];
  gallery: string[];
  photoCount: number;
}

// A user-imported photo, attached to a day and optionally tagged to a meal or
// place. Tagging is exclusive: a photo belongs to at most one meal or one place.
export interface Photo {
  id: string;
  tripId: string;
  dayIndex: number;
  uri: string;
  caption?: string;
  mealId?: string;
  placeId?: string;
  favorite?: boolean;
  /** Highlighted on this day's recap card and in the PDF. Max 2 per day. */
  featured?: boolean;
  /** The single cover photo for the whole trip. At most one per trip. */
  cover?: boolean;
  /** Freeform, cross-trip tags (e.g. "Outfit", "Sunset") for browsing/search. */
  labels?: string[];
}

// User-created day events, persisted in the store (the seed trip's meals/places
// live on the Trip object; these are what the user adds on top).
export interface UserMeal {
  id: string;
  tripId: string;
  dayIndex: number;
  name: string;
  location?: string;
  dish?: string;
  rating?: number;
}

export interface UserPlace {
  id: string;
  tripId: string;
  dayIndex: number;
  name: string;
  note?: string;
}

// Merged display shapes (seed + user) returned by the store selectors.
export interface DayMeal {
  id: string;
  name: string;
  location?: string;
  dish?: string;
  rating?: number;
  receipt?: Receipt;
  editable: boolean;
}

export interface DayPlace {
  id: string;
  name: string;
  note?: string;
  gradient?: number;
  editable: boolean;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  subtitle: string;
  route: string;
  coverGradient: number;
  homeCurrency: string;
  photosKept: number;
  days: Day[];
}
