"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  UtensilsCrossed,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  X,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { MonthSystem, Member } from "@/types/mill";
import { loadMonths, saveMonths, generateId, calculateMillMetrics, getDatesInRange } from "@/utils/storage";

export default function Dashboard() {
  const [months, setMonths] = useState<MonthSystem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for creating a new month
  const [newMonthName, setNewMonthName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [perDayMillCount, setPerDayMillCount] = useState<string>("2");
  const [memberNameInput, setMemberNameInput] = useState("");
  const [formMembers, setFormMembers] = useState<Member[]>([]);
  const [formError, setFormError] = useState("");

  // Load months on mount
  useEffect(() => {
    setMonths(loadMonths());
  }, []);

  // Update default dates based on current month when modal opens
  const handleOpenCreateModal = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    // Set default month name
    setNewMonthName(`${monthNames[currentMonthNum]} ${currentYear}`);
    
    // Set default date range for the current month
    const startStr = `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(currentYear, currentMonthNum + 1, 0).getDate();
    const endStr = `${currentYear}-${String(currentMonthNum + 1).padStart(2, "0")}-${lastDay}`;
    
    setStartDate(startStr);
    setEndDate(endStr);
    
    // Reset other fields
    setFormMembers([
      { id: generateId(), name: "Member 1" },
      { id: generateId(), name: "Member 2" }
    ]);
    setMemberNameInput("");
    setPerDayMillCount("2");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleAddMember = () => {
    const trimmed = memberNameInput.trim();
    if (!trimmed) return;
    
    // Check for duplicates
    if (formMembers.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setFormError("Member name already exists!");
      return;
    }

    setFormMembers([...formMembers, { id: generateId(), name: trimmed }]);
    setMemberNameInput("");
    setFormError("");
  };

  const handleRemoveMember = (id: string) => {
    setFormMembers(formMembers.filter((m) => m.id !== id));
  };

  const handleCreateMonth = () => {
    setFormError("");

    if (!newMonthName.trim()) {
      setFormError("Please enter a month name.");
      return;
    }
    if (!startDate || !endDate) {
      setFormError("Please select both start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError("Start date cannot be after end date.");
      return;
    }
    if (formMembers.length < 1) {
      setFormError("Please add at least 1 member.");
      return;
    }
    if (formMembers.some(m => !m.name.trim())) {
      setFormError("All member names must be filled out.");
      return;
    }

    const newMonthId = generateId();
    const dates = getDatesInRange(startDate, endDate);
    const count = parseInt(perDayMillCount, 10);

    // Build the blank sheet
    const millSheet: MonthSystem["millSheet"] = {};
    dates.forEach((d) => {
      millSheet[d] = {};
      formMembers.forEach((member) => {
        // initialize as false array of size count
        millSheet[d][member.id] = Array(count).fill(false);
      });
    });

    const newMonth: MonthSystem = {
      id: newMonthId,
      name: newMonthName.trim(),
      startDate,
      endDate,
      perDayMillCount: count,
      members: formMembers,
      deposits: [],
      millSheet,
      shoppingItems: []
    };

    const updatedMonths = [newMonth, ...months];
    setMonths(updatedMonths);
    saveMonths(updatedMonths);
    setIsCreateModalOpen(false);
  };

  const handleDeleteMonth = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Stop navigation click
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this month? All data will be lost forever.")) {
      const updated = months.filter((m) => m.id !== id);
      setMonths(updated);
      saveMonths(updated);
    }
  };

  // Calculations for general stats
  const totalMonths = months.length;
  
  // Total members across all sheets
  const totalUniqueMembers = React.useMemo(() => {
    const allNames = new Set<string>();
    months.forEach((m) => m.members.forEach((mem) => allNames.add(mem.name)));
    return allNames.size;
  }, [months]);

  // Aggregate deposits and meals
  const aggregateStats = React.useMemo(() => {
    let totalDeposited = 0;
    let totalMeals = 0;
    let totalShopping = 0;

    months.forEach((m) => {
      const metrics = calculateMillMetrics(m);
      totalDeposited += metrics.totalDeposits;
      totalMeals += metrics.totalMills;
      totalShopping += m.shoppingItems.reduce((sum, item) => sum + item.price, 0);
    });

    return { totalDeposited, totalMeals, totalShopping };
  }, [months]);

  // Calculate remaining balance
  const remainBalance = aggregateStats.totalDeposited - aggregateStats.totalShopping;

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-8 border border-white/5 shadow-2xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <UtensilsCrossed size={180} className="text-indigo-400" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-semibold mb-2">
              <Sparkles size={12} />
              <span>Smart Hostel Tracker</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-white">
              Mill Management Dashboard
            </h1>
            <p className="text-base text-slate-400 max-w-xl">
              Track daily meals, manage roommate payments, and compute exact mill rates and balance distributions instantly.
            </p>
          </div>

          <button
            className="px-6 py-3 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-95 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            onClick={handleOpenCreateModal}
            id="create-new-month-btn"
          >
            <Plus size={18} />
            <span>Create New Month</span>
          </button>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="glass-card shadow-md border border-white/5 rounded-2xl p-5 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Months</p>
              <h3 className="text-2xl font-bold text-white">{totalMonths}</h3>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card shadow-md border border-white/5 rounded-2xl p-5 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Roommates</p>
              <h3 className="text-2xl font-bold text-white">{totalUniqueMembers}</h3>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card shadow-md border border-white/5 rounded-2xl p-5 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fund Deposited</p>
              <h3 className="text-2xl font-bold text-emerald-400">৳ {aggregateStats.totalDeposited.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card shadow-md border border-white/5 rounded-2xl p-5 bg-[#191924]/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <UtensilsCrossed size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Meals Tracked</p>
              <h3 className="text-2xl font-bold text-white">{aggregateStats.totalMeals}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Month Card List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-400" />
            Monthly Records
          </h2>
          <span className="text-xs text-slate-500">{months.length} records found</span>
        </div>

        {months.length === 0 ? (
          <div className="border border-dashed border-white/10 bg-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4 text-slate-400">
              <Calendar size={28} />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">No monthly records found</h4>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              Create a new month meal management card to start tracking mills and expenses for your mess.
            </p>
            <button
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
              onClick={handleOpenCreateModal}
            >
              <Plus size={16} />
              <span>Create Month Card</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {months.map((month) => {
              const metrics = calculateMillMetrics(month);
              const formattedStartDate = new Date(month.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const formattedEndDate = new Date(month.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const monthTotalShopping = month.shoppingItems.reduce((sum, item) => sum + item.price, 0);
              const monthRemainBalance = metrics.totalDeposits - monthTotalShopping;
              
              return (
                <Link key={month.id} href={`/month/${month.id}`} className="group block">
                  <div className="glass-card h-full flex flex-col justify-between border border-white/5 rounded-2xl bg-[#15151e]/55 group-hover:border-indigo-500/30 overflow-hidden relative shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    {/* Visual glowing bar at the top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="flex flex-col items-start gap-1 p-5">
                      <div className="flex justify-between items-start w-full">
                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {month.name}
                        </h3>
                        <button
                          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer min-w-0"
                          onClick={(e) => handleDeleteMonth(month.id, e)}
                          title="Delete Month"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Calendar size={13} className="text-indigo-400" />
                        <span>{formattedStartDate} – {formattedEndDate}</span>
                      </div>
                    </div>

                    <div className="px-5 py-2 text-sm text-slate-400 space-y-4">
                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <p className="text-slate-500 mb-0.5">Members</p>
                          <p className="font-semibold text-white flex items-center gap-1">
                            <Users size={12} className="text-indigo-400" />
                            {month.members.length} Active
                          </p>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <p className="text-slate-500 mb-0.5">Meals per Day</p>
                          <p className="font-semibold text-white flex items-center gap-1">
                            <UtensilsCrossed size={12} className="text-indigo-400" />
                            {month.perDayMillCount === 1 ? "Daily" : month.perDayMillCount === 2 ? "Lunch, Dinner" : "3 Meals"}
                          </p>
                        </div>
                      </div>

                      {/* Financial info */}
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <div className="flex justify-between text-xs">
                          <span>Total Deposited</span>
                          <span className="font-semibold text-white">৳ {metrics.totalDeposits}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Total Meals Consumed</span>
                          <span className="font-semibold text-white">{metrics.totalMills}</span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span>Mill Rate</span>
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            ৳ {metrics.millRate.toFixed(2)}/meal
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 mt-4 border-t border-white/5 bg-[#14141d]/20">
                      {/* Shopping and Balance Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <ShoppingCart size={12} />
                            Total Shopping
                          </span>
                          <span className="font-semibold text-blue-400">৳ {monthTotalShopping}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Wallet size={12} />
                            Remain Balance
                          </span>
                          <span className={`font-semibold ${monthRemainBalance >= 0 ? 'text-rose-400' : 'text-rose-500'}`}>
                            ৳ {monthRemainBalance}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end items-center text-xs text-indigo-400 font-semibold group-hover:text-indigo-300">
                        <span>View Meal Dashboard</span>
                        <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Create New Month Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111116] border border-white/5 rounded-2xl shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-400" size={20} />
                <h3 className="text-lg font-bold">Create New Month System</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-sm animate-pulse">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Month Name</label>
                  <input
                    type="text"
                    placeholder="e.g. June 2026"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all"
                    value={newMonthName}
                    onChange={(e) => setNewMonthName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all cursor-pointer"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all cursor-pointer"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Meals Tracker Configuration</label>
                <select
                  className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-colors cursor-pointer"
                  value={perDayMillCount}
                  onChange={(e) => setPerDayMillCount(e.target.value)}
                >
                  <option value="1">1 Meal per Day (Daily toggle)</option>
                  <option value="2">2 Meals per Day (Lunch, Dinner)</option>
                  <option value="3">3 Meals per Day (Breakfast, Lunch, Dinner)</option>
                </select>
              </div>

              {/* Add Member Subsection */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold text-slate-300">Roommates / Members</p>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter member name"
                    className="w-full bg-[#171721] text-white border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 hover:border-white/20 transition-all"
                    value={memberNameInput}
                    onChange={(e) => setMemberNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                  />
                  <button 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    onClick={handleAddMember}
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </div>

                {/* Members list display as chips */}
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-white/5 rounded-xl bg-white/5">
                  {formMembers.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 px-1">No members added yet. Add at least 1 member.</p>
                  ) : (
                    formMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        <span>{m.name}</span>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2 bg-[#171721]/30">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2.5 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 rounded-xl text-sm cursor-pointer transition-all active:scale-95"
                onClick={handleCreateMonth}
                id="confirm-create-month-btn"
              >
                Create Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
