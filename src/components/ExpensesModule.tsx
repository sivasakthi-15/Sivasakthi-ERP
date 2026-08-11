// @ts-nocheck
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { 
  Plus, Search, Trash2, Calendar, Wallet, Check, X, AlertTriangle, 
  HelpCircle, ClipboardList 
} from 'lucide-react';

export const ExpensesModule: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useApp();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  // Modal Control state
  const [showModal, setShowModal] = useState(false);

  // Form Field states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Tea & Snacks');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [description, setDescription] = useState('');

  // Computed totals
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = catFilter === 'all' || e.category === catFilter;

    return matchesSearch && matchesCat;
  });

  const totalExpenseVal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Expense categories
  const categories = ['Tea & Snacks', 'Electricity Bill', 'Salary / Wages', 'Rent', 'Stationery', 'Freight & Transport', 'Repairs & Maintenance', 'Others'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim() || !description.trim()) {
      alert('Fill in all mandatory parameters');
      return;
    }

    try {
      addExpense({
        amount: parseFloat(amount) || 0,
        category,
        date,
        paymentMode,
        description
      });
      setShowModal(false);
      setAmount('');
      setDescription('');
    } catch (err: any) {
      alert(`Expense creation failed: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 bg-[#f9fafb] p-6 overflow-y-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Expenses Book</h1>
          <p className="text-xs text-gray-500 mt-1">Record day-to-day miscellaneous expenditures to calculate correct net business margin profit lines.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Expense Log</span>
        </button>
      </div>

      {/* KPI Overheads and filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Expense card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4 md:col-span-1">
          <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Filtered Overheads</div>
            <h2 className="text-lg font-black text-gray-800 mt-0.5">₹{(totalExpenseVal ?? 0).toFixed(2)}</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-wrap gap-3 items-center md:col-span-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-black bg-white"
            />
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black bg-white cursor-pointer"
          >
            <option value="all">All Overhead Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense ledger list card */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-32">Date</th>
                <th className="p-3">Expense Category</th>
                <th className="p-3">Description Notes</th>
                <th className="p-3 w-32">Payment Mode</th>
                <th className="p-3 w-32 text-right">Amount Price (₹)</th>
                <th className="p-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">No expense entries logged in this channel yet.</td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-gray-50/20">
                    <td className="p-3 text-center font-mono text-gray-400 text-[10px]">{idx + 1}</td>
                    <td className="p-3 font-mono text-gray-500">{exp.date}</td>
                    <td className="p-3 font-bold text-gray-800">{exp.category}</td>
                    <td className="p-3 text-gray-600 truncate max-w-xs">{exp.description}</td>
                    <td className="p-3 font-mono uppercase text-gray-500">{exp.paymentMode}</td>
                    <td className="p-3 text-right font-mono font-bold text-red-600">
                      ₹{(exp.amount ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal popup Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="text-sm font-bold text-gray-900">Record Miscellaneous Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Expense Value (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Expenditure Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Disbursement Account</label>
                <select
                  value={paymentMode}
                  onChange={(e: any) => setPaymentMode(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                >
                  <option value="cash">Hard cash Drawer</option>
                  <option value="upi">UPI instant transfer</option>
                  <option value="card">Cards terminal settlement</option>
                  <option value="bank_transfer">Direct RTGS / NEFT bank</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Overhead Description Notes *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-semibold"
                  placeholder="e.g. Purchased A4 bundle papers for invoice print"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-colors text-center"
              >
                Book Expense Entry
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

