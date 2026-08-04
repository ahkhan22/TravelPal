import type { Expense, ExpenseCategory } from './types';

/** Format a USD amount: whole dollars with thousands separators. */
export function usd(amount: number): string {
  const rounded = Math.round(amount);
  return '$' + rounded.toLocaleString('en-US');
}

/** Sum of every expense in the trip, in home currency. */
export function tripTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amountHome, 0);
}

const CATEGORY_ORDER: ExpenseCategory[] = [
  'Flights',
  'Hotel',
  'Shopping',
  'Food',
  'Transport',
  'Activities',
  'Other',
];

export interface CategoryTotal {
  category: ExpenseCategory;
  amount: number;
  share: number; // 0-1 of the largest category
}

/** Totals by category, ordered, with share relative to the biggest category. */
export function categoryTotals(expenses: Expense[]): CategoryTotal[] {
  const map = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amountHome);
  }
  const rows = CATEGORY_ORDER.filter((c) => map.has(c)).map((category) => ({
    category,
    amount: map.get(category) ?? 0,
    share: 0,
  }));
  const max = rows.reduce((m, r) => Math.max(m, r.amount), 0) || 1;
  return rows.map((r) => ({ ...r, share: r.amount / max }));
}

/** On-the-ground spend for one day (excludes trip-wide costs like flights/hotel). */
export function daySpend(expenses: Expense[], dayIndex: number): number {
  return expenses
    .filter((e) => e.dayIndex === dayIndex)
    .reduce((sum, e) => sum + e.amountHome, 0);
}
