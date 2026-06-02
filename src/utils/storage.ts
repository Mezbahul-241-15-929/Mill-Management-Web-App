import { MonthSystem, MillCalculationResult, MemberSummary, Deposit, Member, MillSheet, ShoppingItem } from "@/types/mill";

const STORAGE_KEY = "millmaster_data";

// Helper to generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Generate list of dates between start and end date (inclusive)
export const getDatesInRange = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// Helper to generate Mock Data for demonstration
const generateMockData = (): MonthSystem[] => {
  const today = new Date();
  
  // Create mock month: Current Month
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth(); // 0-indexed
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const monthId1 = generateId();
  const startDate = `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-01`;
  // Get last day of current month
  const lastDay = new Date(currentYear, currentMonthNum + 1, 0).getDate();
  const endDate = `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-${lastDay}`;
  
  const members: Member[] = [
    { id: "m1", name: "Mezbahul Islam" },
    { id: "m2", name: "Tanvir Rahman" },
    { id: "m3", name: "Sajid Hasan" },
    { id: "m4", name: "Al Amin" },
    { id: "m5", name: "Rakibul Islam" }
  ];

  // Initialize deposits
  const deposits: Deposit[] = [
    { id: "d1", memberId: "m1", amount: 3000, date: startDate, note: "Initial Deposit" },
    { id: "d2", memberId: "m2", amount: 3000, date: startDate, note: "Initial Deposit" },
    { id: "d3", memberId: "m3", amount: 2500, date: startDate, note: "Initial Deposit" },
    { id: "d4", memberId: "m4", amount: 3500, date: startDate, note: "Initial Deposit" },
    { id: "d5", memberId: "m5", amount: 2000, date: startDate, note: "Initial Deposit" },
    { id: "d6", memberId: "m1", amount: 1500, date: `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-10`, note: "Bazar Expense Refund" },
    { id: "d7", memberId: "m3", amount: 1000, date: `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-12`, note: "Mid-month Deposit" },
  ];

  // Mill sheet: 2 meals per day (Lunch and Dinner)
  const millSheet: MillSheet = {};
  const dateList = getDatesInRange(startDate, endDate);
  
  // Populate meals for the past days (up to today or 15 days, whichever is less)
  const limitDays = Math.min(dateList.length, 15);
  for (let i = 0; i < limitDays; i++) {
    const d = dateList[i];
    millSheet[d] = {};
    members.forEach((m) => {
      // Randomize meal patterns: mostly eating, sometimes skipping
      // Mezbahul (m1): Eaten almost all
      const meal1 = Math.random() > 0.1; 
      const meal2 = Math.random() > 0.15;
      // Tanvir (m2): Eaten some
      const meal3 = Math.random() > 0.3;
      const meal4 = Math.random() > 0.2;
      
      if (m.id === "m1") millSheet[d][m.id] = [meal1, meal2];
      else if (m.id === "m2") millSheet[d][m.id] = [meal3, meal4];
      else if (m.id === "m3") millSheet[d][m.id] = [Math.random() > 0.2, Math.random() > 0.25];
      else if (m.id === "m4") millSheet[d][m.id] = [Math.random() > 0.15, Math.random() > 0.1];
      else millSheet[d][m.id] = [Math.random() > 0.4, Math.random() > 0.3];
    });
  }

  // Prefill future days as OFF
  for (let i = limitDays; i < dateList.length; i++) {
    const d = dateList[i];
    millSheet[d] = {};
    members.forEach((m) => {
      millSheet[d][m.id] = [false, false];
    });
  }

  // Sample shopping items
  const shoppingItems: ShoppingItem[] = [
    { id: "s1", name: "Rice (25kg)", date: startDate, price: 1800, note: "Miniket rice" },
    { id: "s2", name: "Cooking Oil (5L)", date: startDate, price: 850, note: "Soybean oil" },
    { id: "s3", name: "Vegetables", date: `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-03`, price: 350, note: "Weekly vegetables" },
    { id: "s4", name: "Fish & Meat", date: `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-05`, price: 1200, note: "Chicken + Rui fish" },
    { id: "s5", name: "Spices & Essentials", date: `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-07`, price: 450, note: "Salt, turmeric, chili, onion, garlic" },
  ];

  const mockMonth1: MonthSystem = {
    id: monthId1,
    name: `${monthNames[currentMonthNum]} ${currentYear}`,
    startDate,
    endDate,
    perDayMillCount: 2, // Lunch & Dinner
    members,
    deposits,
    millSheet,
    shoppingItems
  };

  return [mockMonth1];
};

// Load months from localStorage
export const loadMonths = (): MonthSystem[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const mock = generateMockData();
    saveMonths(mock);
    return mock;
  }
  try {
    const parsed = JSON.parse(stored) as MonthSystem[];
    // Backward compatibility: ensure shoppingItems exists on older data
    return parsed.map((m) => ({
      ...m,
      shoppingItems: m.shoppingItems || [],
    }));
  } catch (e) {
    console.error("Error parsing stored mill data", e);
    return [];
  }
};

// Save months to localStorage
export const saveMonths = (months: MonthSystem[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(months));
};

// Retrieve a single month by ID
export const getMonthById = (id: string): MonthSystem | undefined => {
  const months = loadMonths();
  return months.find((m) => m.id === id);
};

// Calculate and return all summary metrics for a month
export const calculateMillMetrics = (month: MonthSystem): MillCalculationResult => {
  const totalDeposits = month.deposits.reduce((acc, dep) => acc + dep.amount, 0);
  
  // Calculate total mills consumed
  let totalMills = 0;
  const memberMills: { [memberId: string]: number } = {};
  
  // Initialize member mills count
  month.members.forEach((m) => {
    memberMills[m.id] = 0;
  });

  // Sum meals eaten in the millsheet
  Object.values(month.millSheet).forEach((daily) => {
    Object.entries(daily).forEach(([memberId, mealStatus]) => {
      if (memberMills[memberId] !== undefined && Array.isArray(mealStatus)) {
        // Count number of true values (meals eaten)
        const mealsEaten = mealStatus.filter(Boolean).length;
        memberMills[memberId] += mealsEaten;
        totalMills += mealsEaten;
      }
    });
  });

  // Calculate mill rate
  const millRate = totalMills > 0 ? totalDeposits / totalMills : 0;

  // Compile individual member summaries
  const memberSummaries: MemberSummary[] = month.members.map((m) => {
    // Total deposited by this member
    const totalDeposited = month.deposits
      .filter((dep) => dep.memberId === m.id)
      .reduce((acc, dep) => acc + dep.amount, 0);

    const mills = memberMills[m.id] || 0;
    const totalCost = Math.round(mills * millRate * 100) / 100; // round to 2 decimals
    const balance = Math.round((totalDeposited - totalCost) * 100) / 100;

    return {
      memberId: m.id,
      name: m.name,
      totalDeposited,
      totalMills: mills,
      totalCost,
      balance
    };
  });

  return {
    totalDeposits,
    totalMills,
    millRate,
    memberSummaries
  };
};
