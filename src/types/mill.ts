export interface Member {
  id: string;
  name: string;
}

export interface Deposit {
  id: string;
  memberId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

// Meal status per day per member
// true = ON, false = OFF
// Length matches perDayMillCount (e.g., [true, false] for 2 meals/day)
export type MealStatus = boolean[];

export interface DailyMills {
  [memberId: string]: MealStatus;
}

export interface MillSheet {
  [date: string]: DailyMills;
}

export interface ShoppingItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  price: number;
  note?: string;
}

export interface MonthSystem {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  perDayMillCount: number; // 1, 2, or 3 meals/day
  members: Member[];
  deposits: Deposit[];
  millSheet: MillSheet;
  shoppingItems: ShoppingItem[];
}

export interface MemberSummary {
  memberId: string;
  name: string;
  totalDeposited: number;
  totalMills: number;
  totalCost: number;
  balance: number; // positive = gets back, negative = needs to pay
}

export interface MillCalculationResult {
  totalDeposits: number;
  totalMills: number;
  millRate: number;
  memberSummaries: MemberSummary[];
}
