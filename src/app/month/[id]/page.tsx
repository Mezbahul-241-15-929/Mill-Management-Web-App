"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Settings,
  Coins,
  Check,
  X,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Wallet,
  BookOpen,
  PieChart,
  UserPlus,
  ArrowDownRight,
  ArrowUpRight,
  ShoppingCart,
} from "lucide-react";
import { MonthSystem, Member, Deposit, MillSheet, ShoppingItem } from "@/types/mill";
import {
  loadMonths,
  saveMonths,
  getMonthById,
  calculateMillMetrics,
  getDatesInRange,
  generateId,
  formatDate,
} from "@/utils/storage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MonthDashboard({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Core system state
  const [month, setMonth] = useState<MonthSystem | null>(null);
  const [activeTab, setActiveTab] = useState<"sheet" | "ledger" | "calculations" | "shopping">("sheet");
  
  // Modals state
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);

  // Add Shopping Item Form States
  const [shoppingName, setShoppingName] = useState("");
  const [shoppingDate, setShoppingDate] = useState("");
  const [shoppingPrice, setShoppingPrice] = useState("");
  const [shoppingNote, setShoppingNote] = useState("");
  const [shoppingError, setShoppingError] = useState("");

  // Add Deposit Form States
  const [depositMemberId, setDepositMemberId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [depositError, setDepositError] = useState("");

  // Settings Form States
  const [settingsName, setSettingsName] = useState("");
  const [settingsStartDate, setSettingsStartDate] = useState("");
  const [settingsEndDate, setSettingsEndDate] = useState("");
  const [settingsMembers, setSettingsMembers] = useState<Member[]>([]);
  const [newMemberNameInput, setNewMemberNameInput] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // Reload month data from localStorage
  const reloadData = () => {
    const data = getMonthById(id);
    if (data) {
      setMonth(data);
      // Initialize settings forms
      setSettingsName(data.name);
      setSettingsStartDate(data.startDate);
      setSettingsEndDate(data.endDate);
      setSettingsMembers(data.members);
    }
  };

  useEffect(() => {
    reloadData();
  }, [id]);

  if (!month) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="glass-card max-w-md p-8 border border-white/5 rounded-2xl bg-[#15151e]/55 shadow-2xl text-white space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mx-auto">
            <X size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Month Sheet Not Found</h3>
          <p className="text-sm text-slate-400">
            The monthly record you are trying to access does not exist or has been deleted.
          </p>
          <Link href="/" className="w-full block">
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all w-full active:scale-95 shadow-lg shadow-indigo-600/20">
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const metrics = calculateMillMetrics(month);
  const dateList = getDatesInRange(month.startDate, month.endDate);
  const totalShopping = month.shoppingItems.reduce((sum, item) => sum + item.price, 0);
  const remainBalance = metrics.totalDeposits - totalShopping;

  // HELPER: Save month system updates to storage and reload
  const saveMonthUpdate = (updatedMonth: MonthSystem) => {
    const allMonths = loadMonths();
    const updatedMonths = allMonths.map((m) => (m.id === month.id ? updatedMonth : m));
    saveMonths(updatedMonths);
    setMonth(updatedMonth);
  };

  // Toggle meal state in sheet
  const handleToggleMeal = (date: string, memberId: string, mealIndex: number) => {
    const updatedSheet = { ...month.millSheet };
    
    // Safety check
    if (!updatedSheet[date]) {
      updatedSheet[date] = {};
    }
    if (!updatedSheet[date][memberId]) {
      updatedSheet[date][memberId] = Array(month.perDayMillCount).fill(false);
    }

    const currentMeals = [...updatedSheet[date][memberId]];
    // Toggle the state
    currentMeals[mealIndex] = !currentMeals[mealIndex];
    updatedSheet[date][memberId] = currentMeals;

    const updatedMonth: MonthSystem = {
      ...month,
      millSheet: updatedSheet,
    };

    saveMonthUpdate(updatedMonth);
  };

  // Set all meals to ON or OFF for a specific date
  const handleBulkToggleDate = (date: string, turnOn: boolean) => {
    const updatedSheet = { ...month.millSheet };
    
    if (!updatedSheet[date]) {
      updatedSheet[date] = {};
    }

    month.members.forEach((m) => {
      updatedSheet[date][m.id] = Array(month.perDayMillCount).fill(turnOn);
    });

    const updatedMonth: MonthSystem = {
      ...month,
      millSheet: updatedSheet,
    };

    saveMonthUpdate(updatedMonth);
  };

  // Deposit handling
  const handleOpenAddDeposit = () => {
    setDepositMemberId(month.members[0]?.id || "");
    setDepositAmount("");
    setDepositDate(formatDate(new Date()));
    setDepositNote("");
    setDepositError("");
    setIsAddDepositOpen(true);
  };

  const handleAddDeposit = () => {
    setDepositError("");
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError("Please enter a valid positive amount.");
      return;
    }
    if (!depositDate) {
      setDepositError("Please pick a deposit date.");
      return;
    }
    if (!depositMemberId) {
      setDepositError("Please select a roommate.");
      return;
    }

    const newDeposit: Deposit = {
      id: generateId(),
      memberId: depositMemberId,
      amount: amt,
      date: depositDate,
      note: depositNote.trim() || "Deposit",
    };

    const updatedMonth: MonthSystem = {
      ...month,
      deposits: [newDeposit, ...month.deposits],
    };

    saveMonthUpdate(updatedMonth);
    setIsAddDepositOpen(false);
  };

  const handleDeleteDeposit = (depId: string) => {
    if (confirm("Are you sure you want to delete this payment entry?")) {
      const updatedMonth: MonthSystem = {
        ...month,
        deposits: month.deposits.filter((d) => d.id !== depId),
      };
      saveMonthUpdate(updatedMonth);
    }
  };

  // Shopping List Actions
  const handleOpenAddShopping = () => {
    setShoppingName("");
    setShoppingDate(formatDate(new Date()));
    setShoppingPrice("");
    setShoppingNote("");
    setShoppingError("");
    setIsAddShoppingOpen(true);
  };

  const handleAddShopping = () => {
    setShoppingError("");
    if (!shoppingName.trim()) {
      setShoppingError("Please enter an item name.");
      return;
    }
    const price = parseFloat(shoppingPrice);
    if (isNaN(price) || price <= 0) {
      setShoppingError("Please enter a valid price.");
      return;
    }
    if (!shoppingDate) {
      setShoppingError("Please pick a date.");
      return;
    }

    const newItem: ShoppingItem = {
      id: generateId(),
      name: shoppingName.trim(),
      date: shoppingDate,
      price,
      note: shoppingNote.trim() || undefined,
    };

    const updatedMonth: MonthSystem = {
      ...month,
      shoppingItems: [newItem, ...(month.shoppingItems || [])],
    };

    saveMonthUpdate(updatedMonth);
    setIsAddShoppingOpen(false);
  };

  const handleDeleteShopping = (itemId: string) => {
    if (confirm("Are you sure you want to delete this shopping item?")) {
      const updatedMonth: MonthSystem = {
        ...month,
        shoppingItems: (month.shoppingItems || []).filter((s) => s.id !== itemId),
      };
      saveMonthUpdate(updatedMonth);
    }
  };

  // Settings Actions
  const handleAddMemberInSettings = () => {
    const name = newMemberNameInput.trim();
    if (!name) return;

    if (settingsMembers.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setSettingsError("Member already exists!");
      return;
    }

    setSettingsMembers([...settingsMembers, { id: generateId(), name }]);
    setNewMemberNameInput("");
    setSettingsError("");
  };

  const handleRemoveMemberInSettings = (memberId: string) => {
    // Alert if they already have meals/deposits
    const hasDeposits = month.deposits.some((d) => d.memberId === memberId);
    let hasMeals = false;
    Object.values(month.millSheet).forEach((day) => {
      if (day[memberId] && day[memberId].some(Boolean)) {
        hasMeals = true;
      }
    });

    if (hasDeposits || hasMeals) {
      if (
        !confirm(
          "This member has logged meals or deposits in this system. Removing them will erase all their historical records in this month. Do you want to proceed?"
        )
      ) {
        return;
      }
    }

    setSettingsMembers(settingsMembers.filter((m) => m.id !== memberId));
  };

  const handleSaveSettings = () => {
    setSettingsError("");

    if (!settingsName.trim()) {
      setSettingsError("Month name cannot be empty.");
      return;
    }
    if (!settingsStartDate || !settingsEndDate) {
      setSettingsError("Please specify both dates.");
      return;
    }
    if (new Date(settingsStartDate) > new Date(settingsEndDate)) {
      setSettingsError("Start date cannot be after end date.");
      return;
    }
    if (settingsMembers.length === 0) {
      setSettingsError("A monthly sheet requires at least 1 member.");
      return;
    }

    // Build/Migrate millsheet
    const updatedDates = getDatesInRange(settingsStartDate, settingsEndDate);
    const updatedMillSheet: MillSheet = {};

    updatedDates.forEach((date) => {
      updatedMillSheet[date] = {};
      settingsMembers.forEach((member) => {
        // If date and member existed previously, carry over their meal flags
        if (month.millSheet[date] && month.millSheet[date][member.id]) {
          let oldStatus = month.millSheet[date][member.id];
          // Ensure correct array length
          if (oldStatus.length < month.perDayMillCount) {
            oldStatus = [...oldStatus, ...Array(month.perDayMillCount - oldStatus.length).fill(false)];
          } else if (oldStatus.length > month.perDayMillCount) {
            oldStatus = oldStatus.slice(0, month.perDayMillCount);
          }
          updatedMillSheet[date][member.id] = oldStatus;
        } else {
          updatedMillSheet[date][member.id] = Array(month.perDayMillCount).fill(false);
        }
      });
    });

    // Clean deposits: Remove deposits from members who were deleted
    const memberIds = new Set(settingsMembers.map((m) => m.id));
    const cleanedDeposits = month.deposits.filter((d) => memberIds.has(d.memberId));

    const updatedMonth: MonthSystem = {
      ...month,
      name: settingsName.trim(),
      startDate: settingsStartDate,
      endDate: settingsEndDate,
      members: settingsMembers,
      deposits: cleanedDeposits,
      millSheet: updatedMillSheet,
    };

    saveMonthUpdate(updatedMonth);
    setIsSettingsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            {month.name}
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Calendar size={13} className="text-indigo-400" />
            <span>
              {new Date(month.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} –{" "}
              {new Date(month.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all text-sm"
            onClick={() => setIsSettingsOpen(true)}
            id="settings-btn"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-indigo-600/25 text-sm"
            onClick={handleOpenAddDeposit}
            id="add-money-btn"
          >
            <Plus size={16} />
            <span>Add Deposit</span>
          </button>
        </div>
      </section>

      {/* Metrics Counters */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="glass-card border border-white/5 rounded-xl p-3 md:p-4 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Coins size={16} className="md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Total Fund</p>
              <h3 className="text-sm md:text-xl font-bold text-white truncate">৳ {metrics.totalDeposits}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card border border-white/5 rounded-xl p-3 md:p-4 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <ShoppingCart size={16} className="md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Total Shopping</p>
              <h3 className="text-sm md:text-xl font-bold text-blue-400 truncate">৳ {totalShopping.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card border border-white/5 rounded-xl p-3 md:p-4 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
              <Wallet size={16} className="md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Remain Balance</p>
              <h3 className={`text-sm md:text-xl font-bold truncate ${remainBalance >= 0 ? 'text-rose-400' : 'text-rose-500'}`}>
                ৳ {remainBalance.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        <div className="glass-card border border-white/5 rounded-xl p-3 md:p-4 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-violet-500/10 text-violet-400 shrink-0">
              <PlusCircle size={16} className="md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Total Meals</p>
              <h3 className="text-sm md:text-xl font-bold text-white truncate">{metrics.totalMills}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card border border-white/5 rounded-xl p-3 md:p-4 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <TrendingUp size={16} className="md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Mill Rate</p>
              <h3 className="text-sm md:text-xl font-bold text-emerald-400 truncate">৳ {metrics.millRate.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Container */}
      <section className="space-y-4">
        {/* Custom Tab Strips */}
        <div className="flex gap-6 border-b border-white/5 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("sheet")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "sheet"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen size={16} />
            <span>Daily Mill Sheet</span>
          </button>
          
          <button
            onClick={() => setActiveTab("ledger")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "ledger"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wallet size={16} />
            <span>Deposits Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("calculations")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "calculations"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <PieChart size={16} />
            <span>Settlements & Calculation</span>
          </button>

          <button
            onClick={() => setActiveTab("shopping")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "shopping"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShoppingCart size={16} />
            <span>Shopping List</span>
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "sheet" && (
          <div className="border border-white/5 bg-[#14141a]/40 shadow-xl rounded-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="overflow-x-auto relative w-full max-h-[600px]">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs uppercase bg-[#181824] text-slate-300 border-b border-white/5 sticky top-0 z-30">
                  <tr>
                    {/* Sticky Date Header */}
                    <th scope="col" className="px-4 py-3.5 font-bold tracking-wider sticky left-0 z-40 bg-[#181824] border-r border-white/5 min-w-[130px]">
                      Date
                    </th>
                    
                    {/* Member headers */}
                    {month.members.map((m) => (
                      <th key={m.id} scope="col" className="px-4 py-3.5 font-bold tracking-wider text-center min-w-[150px] border-r border-white/5">
                        {m.name}
                      </th>
                    ))}

                    {/* Daily Total Header */}
                    <th scope="col" className="px-4 py-3.5 font-bold tracking-wider text-center min-w-[100px]">
                      Total Mill
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dateList.map((date) => {
                    const parsedDate = new Date(date);
                    const dayLabel = parsedDate.toLocaleDateString("en-US", { weekday: "short" });
                    const dateLabel = parsedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
                    
                    // Compute daily row total
                    let dailyTotalMeals = 0;
                    if (month.millSheet[date]) {
                      Object.values(month.millSheet[date]).forEach((status) => {
                        dailyTotalMeals += status.filter(Boolean).length;
                      });
                    }

                    return (
                      <tr key={date} className="hover:bg-white/[0.02] transition-colors">
                        {/* Sticky Date Column */}
                        <td className="px-4 py-3 font-semibold text-slate-200 sticky left-0 z-20 bg-[#0d0d12] border-r border-white/5">
                          <div className="flex flex-col">
                            <span>{dateLabel}</span>
                            <span className="text-[10px] text-slate-500 font-normal uppercase">{dayLabel}</span>
                          </div>
                        </td>

                        {/* Member cells */}
                        {month.members.map((m) => {
                          const mealStatus = month.millSheet[date]?.[m.id] || Array(month.perDayMillCount).fill(false);
                          
                          return (
                            <td key={m.id} className="px-4 py-3 text-center border-r border-white/5">
                              <div className="flex items-center justify-center gap-1.5">
                                {mealStatus.map((status, index) => {
                                  // Labels: B=Breakfast, L=Lunch, D=Dinner (or numeric if 1 meal)
                                  let label = "M";
                                  if (month.perDayMillCount === 2) {
                                    label = index === 0 ? "L" : "D";
                                  } else if (month.perDayMillCount === 3) {
                                    label = index === 0 ? "B" : index === 1 ? "L" : "D";
                                  } else {
                                    label = "ON";
                                  }

                                  return (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => handleToggleMeal(date, m.id, index)}
                                      className={`h-7 px-2 text-[10px] font-extrabold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                        status
                                          ? "bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-600/30 scale-105"
                                          : "bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}

                        {/* Daily Total Cell */}
                        <td className="px-4 py-3 text-center font-bold text-slate-300">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-semibold">{dailyTotalMeals}</span>
                            
                            {/* Bulk controls for that date */}
                            <div className="flex gap-1">
                              <button
                                type="button"
                                title="All meals ON today"
                                onClick={() => handleBulkToggleDate(date, true)}
                                className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                              >
                                <Check size={10} />
                              </button>
                              <button
                                type="button"
                                title="All meals OFF today"
                                onClick={() => handleBulkToggleDate(date, false)}
                                className="p-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary calculations row */}
                  <tr className="bg-[#181824]/50 border-t border-white/10 font-bold sticky bottom-0 z-30">
                    <td className="px-4 py-4 sticky left-0 z-40 bg-[#161622] text-white border-r border-white/5">
                      Total Mill
                    </td>
                    
                    {/* Member totals */}
                    {month.members.map((m) => {
                      const mSummary = metrics.memberSummaries.find((sum) => sum.memberId === m.id);
                      return (
                        <td key={m.id} className="px-4 py-4 text-center text-indigo-300 border-r border-white/5 text-base">
                          {mSummary?.totalMills || 0}
                        </td>
                      );
                    })}

                    {/* Grand Total */}
                    <td className="px-4 py-4 text-center text-white text-base">
                      {metrics.totalMills}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {month.deposits.length === 0 ? (
              <div className="border border-white/5 bg-[#14141a]/40 shadow-xl rounded-2xl p-6">
                <div className="text-center py-12 text-slate-500 space-y-4">
                  <Coins className="mx-auto text-slate-600" size={36} />
                  <div>
                    <h4 className="text-white font-bold text-base">No deposits recorded</h4>
                    <p className="text-xs text-slate-400 mt-1">Add roommate funds to compute your mill rates and settlements.</p>
                  </div>
                  <button
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md text-sm mx-auto"
                    onClick={handleOpenAddDeposit}
                  >
                    <Plus size={16} />
                    <span>Add Initial Deposit</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ── Per-Person Deposit Summary ── */}
                <div className="border border-white/5 bg-[#14141a]/40 shadow-xl rounded-2xl p-6">
                  <h4 className="text-white font-bold text-base flex items-center gap-2 mb-4">
                    <Wallet size={18} className="text-indigo-400" />
                    Per-Person Deposit Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {month.members.map((member) => {
                      const memberDeposits = month.deposits.filter((d) => d.memberId === member.id);
                      const totalPaid = memberDeposits.reduce((acc, d) => acc + d.amount, 0);

                      return (
                        <details
                          key={member.id}
                          className="group border border-white/5 bg-[#191924]/50 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors"
                        >
                          <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-extrabold uppercase shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{member.name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {memberDeposits.length} deposit{memberDeposits.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-emerald-400">৳ {totalPaid.toLocaleString()}</span>
                              <svg
                                className="w-4 h-4 text-slate-500 transition-transform duration-200 group-open:rotate-180"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>

                          {memberDeposits.length > 0 ? (
                            <div className="border-t border-white/5 divide-y divide-white/5">
                              {memberDeposits.map((dep) => (
                                <div key={dep.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02]">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-slate-300">
                                      {new Date(dep.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{dep.note || "Deposit"}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-emerald-400">৳ {dep.amount.toLocaleString()}</span>
                                    <button
                                      className="p-1 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                      onClick={() => handleDeleteDeposit(dep.id)}
                                      title="Delete Deposit"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-3 text-xs text-slate-500 border-t border-white/5">
                              No deposits yet
                            </div>
                          )}
                        </details>
                      );
                    })}
                  </div>

                  {/* Grand Total Bar */}
                  <div className="mt-4 flex items-center justify-between bg-[#12121e] border border-white/5 rounded-xl px-4 py-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected</span>
                    <span className="text-lg font-extrabold text-white">৳ {metrics.totalDeposits.toLocaleString()}</span>
                  </div>
                </div>

                {/* ── Full Deposit History (Chronological) ── */}
                <div className="border border-white/5 bg-[#14141a]/40 shadow-xl rounded-2xl p-6">
                  <h4 className="text-white font-bold text-base flex items-center gap-2 mb-4">
                    <BookOpen size={18} className="text-violet-400" />
                    Full Deposit History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-[#181824]/60 text-slate-400 border-b border-white/5">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Roommate</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {month.deposits.map((dep) => {
                          const member = month.members.find((m) => m.id === dep.memberId);
                          return (
                            <tr key={dep.id} className="hover:bg-white/[0.01]">
                              <td className="px-4 py-3 text-slate-300">
                                {new Date(dep.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                              </td>
                              <td className="px-4 py-3 text-white font-semibold">
                                {member?.name || "Unknown"}
                              </td>
                              <td className="px-4 py-3 text-slate-400">
                                {dep.note || "Deposit"}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-400">
                                ৳ {dep.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  onClick={() => handleDeleteDeposit(dep.id)}
                                  title="Delete Deposit"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "calculations" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Formula explanation panel */}
            <div className="border border-indigo-500/20 bg-indigo-500/5 shadow-md rounded-2xl p-6">
              <h4 className="text-indigo-300 font-bold flex items-center gap-2 mb-2 text-base">
                <HelpCircle size={18} />
                Formula & Mill rate
              </h4>
              <div className="text-sm text-slate-300 space-y-4">
                <p>
                  The total amount paid by all roommates is divided by the total number of meals consumed by everyone. This gives the rate per meal.
                </p>
                <div className="bg-[#12121e] border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-500">Mill Rate Calculation:</span>
                    <div className="text-white font-bold text-sm mt-1">
                      ৳ {metrics.totalDeposits.toLocaleString()} Paid / {metrics.totalMills} Meals = ৳ {metrics.millRate.toFixed(4)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg text-sm font-bold">
                    <span>Current Meal Rate:</span>
                    <span>৳ {metrics.millRate.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settlement table */}
            <div className="border border-white/5 bg-[#14141a]/40 shadow-xl rounded-2xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-[#181824]/60 text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3 text-center">Meals Consumed</th>
                      <th className="px-4 py-3 text-right">Actual Expense</th>
                      <th className="px-4 py-3 text-right">Amount Paid</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-center">Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {metrics.memberSummaries.map((sum) => {
                      const getsBack = sum.balance >= 0;
                      
                      return (
                        <tr key={sum.memberId} className="hover:bg-white/[0.01]">
                          <td className="px-4 py-3.5 text-white font-bold">
                            {sum.name}
                          </td>
                          <td className="px-4 py-3.5 text-center text-slate-300">
                            {sum.totalMills}
                          </td>
                          <td className="px-4 py-3.5 text-right text-slate-400">
                            ৳ {sum.totalCost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-right text-emerald-400">
                            ৳ {sum.totalDeposited}
                          </td>
                          <td className={`px-4 py-3.5 text-right font-extrabold ${getsBack ? "text-emerald-400" : "text-rose-400"}`}>
                            {getsBack ? "+" : ""}৳ {sum.balance.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                              getsBack
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                              {getsBack ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              <span>{getsBack ? "Gets back" : "Needs to pay"}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Summary total footer */}
                    <tr className="bg-[#181824]/40 font-bold border-t border-white/10 text-white">
                      <td className="px-4 py-4 text-white">Total Summary</td>
                      <td className="px-4 py-4 text-center text-indigo-300">{metrics.totalMills}</td>
                      <td className="px-4 py-4 text-right text-slate-300">৳ {metrics.memberSummaries.reduce((acc, s) => acc + s.totalCost, 0).toFixed(2)}</td>
                      <td className="px-4 py-4 text-right text-emerald-400">৳ {metrics.totalDeposits}</td>
                      <td className="px-4 py-4 text-right text-slate-300">
                        ৳ {metrics.memberSummaries.reduce((acc, s) => acc + s.balance, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-slate-500">Net Zero Balance</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Shopping List Tab */}
        {activeTab === "shopping" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header + Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-white font-bold text-base flex items-center gap-2">
                  <ShoppingCart size={18} className="text-amber-400" />
                  Bazar & Shopping List
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Track all purchases, groceries, and bazar expenses for this month.</p>
              </div>
              <button
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-600/25 text-sm active:scale-95"
                onClick={handleOpenAddShopping}
                id="add-shopping-btn"
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>
            </div>

            {(month.shoppingItems || []).length === 0 ? (
              <div className="border border-white/5 bg-[#14141a]/40 shadow-xl rounded-2xl p-6">
                <div className="text-center py-12 text-slate-500 space-y-4">
                  <ShoppingCart className="mx-auto text-slate-600" size={36} />
                  <div>
                    <h4 className="text-white font-bold text-base">No shopping items recorded</h4>
                    <p className="text-xs text-slate-400 mt-1">Start adding your bazar and grocery purchases to keep track of expenses.</p>
                  </div>
                  <button
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md text-sm mx-auto"
                    onClick={handleOpenAddShopping}
                  >
                    <Plus size={16} />
                    <span>Add First Item</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Shopping Items Table */}
                <div className="border border-white/5 bg-[#14141a]/40 shadow-xl rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-[#181824]/60 text-slate-400 border-b border-white/5">
                        <tr>
                          <th className="px-4 py-3 w-10">#</th>
                          <th className="px-4 py-3">Item Name</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Note</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(month.shoppingItems || []).map((item, idx) => (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-slate-500 text-xs font-mono">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                                  <ShoppingCart size={14} />
                                </div>
                                <span className="text-white font-semibold">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-xs">
                              {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                              {item.note || "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-400">
                              ৳ {item.price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                onClick={() => handleDeleteShopping(item.id)}
                                title="Delete Item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total Spent Bar */}
                  <div className="flex items-center justify-between bg-[#181824]/50 border-t border-white/10 px-4 py-3.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Spent</span>
                    <span className="text-lg font-extrabold text-amber-400">
                      ৳ {(month.shoppingItems || []).reduce((acc, s) => acc + s.price, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* MODAL: ADD SHOPPING ITEM */}
      {isAddShoppingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111116] border border-white/5 rounded-2xl shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-amber-400" />
                <h3 className="text-lg font-bold">Add Shopping Item</h3>
              </div>
              <button
                onClick={() => setIsAddShoppingOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-4">
              {shoppingError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-1.5">
                  <X size={14} />
                  <span>{shoppingError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rice, Vegetables, Fish, Oil..."
                  className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500 hover:border-white/20 transition-all"
                  value={shoppingName}
                  onChange={(e) => setShoppingName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Purchase Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500 hover:border-white/20 transition-all cursor-pointer"
                    value={shoppingDate}
                    onChange={(e) => setShoppingDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Price (৳)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500 hover:border-white/20 transition-all"
                    value={shoppingPrice}
                    onChange={(e) => setShoppingPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Note / Details (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Miniket rice 25kg, Weekly vegetables..."
                  className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500 hover:border-white/20 transition-all"
                  value={shoppingNote}
                  onChange={(e) => setShoppingNote(e.target.value)}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2 bg-[#171721]/30">
              <button
                onClick={() => setIsAddShoppingOpen(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-500/25 rounded-xl text-sm cursor-pointer transition-all active:scale-95"
                onClick={handleAddShopping}
                id="confirm-shopping-btn"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD DEPOSIT */}
      {isAddDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111116] border border-white/5 rounded-2xl shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-emerald-400" />
                <h3 className="text-lg font-bold">Add Money Deposit</h3>
              </div>
              <button
                onClick={() => setIsAddDepositOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-4">
              {depositError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-1.5">
                  <X size={14} />
                  <span>{depositError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Select Roommate</label>
                <select
                  className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-colors cursor-pointer"
                  value={depositMemberId}
                  onChange={(e) => setDepositMemberId(e.target.value)}
                >
                  {month.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Amount (BDT / ৳)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Payment Date</label>
                <input
                  type="date"
                  className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all cursor-pointer"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Reference / Bazar details</label>
                <input
                  type="text"
                  placeholder="e.g. Initial Deposit, bazar expense, etc."
                  className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2 bg-[#171721]/30">
              <button
                onClick={() => setIsAddDepositOpen(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 rounded-xl text-sm cursor-pointer transition-all active:scale-95"
                onClick={handleAddDeposit}
                id="confirm-deposit-btn"
              >
                Save Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURATION & SETTINGS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111116] border border-white/5 rounded-2xl shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-indigo-400" />
                <h3 className="text-lg font-bold">Configure Mill System Settings</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-4 max-h-[50vh] overflow-y-auto">
              {settingsError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-1.5">
                  <X size={14} />
                  <span>{settingsError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Month Sheet Name</label>
                <input
                  type="text"
                  className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all cursor-pointer"
                    value={settingsStartDate}
                    onChange={(e) => setSettingsStartDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all cursor-pointer"
                    value={settingsEndDate}
                    onChange={(e) => setSettingsEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Edit Members */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Manage Roommates</p>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new roommate"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all"
                    value={newMemberNameInput}
                    onChange={(e) => setNewMemberNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMemberInSettings();
                      }
                    }}
                  />
                  <button
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    onClick={handleAddMemberInSettings}
                  >
                    <UserPlus size={16} />
                    <span>Add</span>
                  </button>
                </div>

                <div className="divide-y divide-white/5 border border-white/5 rounded-xl bg-white/5 max-h-40 overflow-y-auto p-1">
                  {settingsMembers.map((m) => (
                    <div key={m.id} className="flex justify-between items-center py-2 px-3">
                      <span className="text-sm font-semibold text-white">{m.name}</span>
                      <button
                        className="p-1.5 text-slate-500 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleRemoveMemberInSettings(m.id)}
                        title="Remove roommate"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2 bg-[#171721]/30">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm cursor-pointer transition-all active:scale-95"
                onClick={handleSaveSettings}
                id="confirm-settings-btn"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
