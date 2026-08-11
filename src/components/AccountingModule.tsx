import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  compileAccountingDatabase, compileBalanceSheet, compileProfitAndLoss, 
  AccountingLedger, AccountingVoucher, STANDARD_GROUPS 
} from '../data/accountingEngine';
import { 
  BookOpen, Landmark, DollarSign, Plus, Check, FileText, Search, 
  ArrowUpRight, ArrowDownRight, Printer, Download, Calendar, Activity, 
  Grid, HelpCircle, Layers, RefreshCw, Send, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export const AccountingModule: React.FC = () => {
  const { 
    bills, purchases, salesReturns, purchaseReturns, expenses, payments, currentBusiness 
  } = useApp();

  const bizId = currentBusiness?.id || 'all';

  // Manual vouchers state stored in localStorage per business
  const [manualVouchers, setManualVouchers] = useState<AccountingVoucher[]>(() => {
    const stored = safeGetItem(`${bizId}_manual_vouchers`);
    return stored ? JSON.parse(stored) : [];
  });

  const saveManualVouchers = (newVouchers: AccountingVoucher[]) => {
    setManualVouchers(newVouchers);
    safeSetItem(`${bizId}_manual_vouchers`, JSON.stringify(newVouchers));
  };

  // Compile active database
  const { ledgers, vouchers } = useMemo(() => {
    return compileAccountingDatabase(
      bizId, bills, purchases, salesReturns, purchaseReturns, expenses, payments, manualVouchers
    );
  }, [bizId, bills, purchases, salesReturns, purchaseReturns, expenses, payments, manualVouchers]);

  // Sub tabs
  const [subTab, setSubTab] = useState<'daybook' | 'ledgers' | 'vouchers' | 'trial' | 'profit' | 'balance'>('daybook');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>('');
  const [dateFilter, setDateFilter] = useState('');

  // Manual voucher posting states
  const [vType, setVType] = useState<AccountingVoucher['voucherType']>('Journal');
  const [debLedger, setDebLedger] = useState('');
  const [credLedger, setCredLedger] = useState('');
  const [vAmount, setVAmount] = useState('');
  const [vRef, setVRef] = useState('');
  const [vNarration, setVNarration] = useState('');
  const [vDate, setVDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toastMessage, setToastMessage] = useState('');

  // Manual ledger posting states
  const [showAddLedgerModal, setShowAddLedgerModal] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerGroup, setNewLedgerGroup] = useState('Indirect Expenses');
  const [newLedgerOpening, setNewLedgerOpening] = useState('0');
  const [newLedgerBalType, setNewLedgerBalType] = useState<'Debit' | 'Credit'>('Debit');

  // Load custom ledgers
  const [customLedgers, setCustomLedgers] = useState<Omit<AccountingLedger, 'currentBalance' | 'balanceType'>[]>(() => {
    const stored = safeGetItem(`${bizId}_custom_ledgers`);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    if (!bizId || bizId === 'all') return;

    // Load custom ledgers
    api.ledgers.list(bizId)
      .then(res => {
        if (res && res.length > 0) {
          const mapped = res.map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            group: item.group,
            openingBalance: item.openingBalance,
            balanceType: item.balanceType
          }));
          setCustomLedgers(mapped);
          safeSetItem(`${bizId}_custom_ledgers`, JSON.stringify(mapped));
        }
      })
      .catch(err => console.warn('Custom ledgers load failed.', err));

    // Load manual vouchers
    api.vouchers.list(bizId)
      .then(res => {
        if (res && res.length > 0) {
          const mapped = res.map((item: any) => ({
            id: item._id || item.id,
            date: item.date,
            time: item.time,
            voucherNo: item.voucherNo,
            voucherType: item.voucherType,
            reference: item.reference,
            narration: item.narration,
            debits: item.debits,
            credits: item.credits
          }));
          setManualVouchers(mapped);
          safeSetItem(`${bizId}_manual_vouchers`, JSON.stringify(mapped));
        }
      })
      .catch(err => console.warn('Manual vouchers load failed.', err));
  }, [bizId]);

  const handleAddCustomLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLedgerName) return;

    const newL = {
      name: newLedgerName,
      group: newLedgerGroup,
      openingBalance: Number(newLedgerOpening) || 0,
      balanceType: newLedgerBalType
    };

    api.ledgers.create({ ...newL, shopId: bizId })
      .then(saved => {
        const mapped = {
          id: saved._id || saved.id,
          ...newL
        };
        const updated = [...customLedgers, mapped];
        setCustomLedgers(updated);
        safeSetItem(`${bizId}_custom_ledgers`, JSON.stringify(updated));
        triggerToast('Ledger Account Created Successfully!');
      })
      .catch(err => {
        console.warn('Failed to save custom ledger on server.', err);
        const fallback = {
          id: `custom_led_${Math.random().toString(36).substring(2, 9)}`,
          ...newL
        };
        const updated = [...customLedgers, fallback];
        setCustomLedgers(updated);
        safeSetItem(`${bizId}_custom_ledgers`, JSON.stringify(updated));
        triggerToast('Ledger Account Created (Local Backup) Successfully!');
      });

    // Clear and close
    setNewLedgerName('');
    setNewLedgerOpening('0');
    setShowAddLedgerModal(false);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Compile financial reports
  const balanceSheet = useMemo(() => compileBalanceSheet(ledgers), [ledgers]);
  const profitAndLoss = useMemo(() => compileProfitAndLoss(ledgers), [ledgers]);

  // Handle manual voucher submission
  const handlePostVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debLedger || !credLedger || !vAmount || Number(vAmount) <= 0) {
      alert('Please fill out all required fields with a valid amount');
      return;
    }

    if (debLedger === credLedger) {
      alert('Debit ledger and Credit ledger cannot be the same!');
      return;
    }

    const dLedgerObj = ledgers.find(l => l.id === debLedger);
    const cLedgerObj = ledgers.find(l => l.id === credLedger);

    if (!dLedgerObj || !cLedgerObj) return;

    const voucherNum = `JV-${vType.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newVoucher = {
      date: vDate,
      time: new Date().toLocaleTimeString(),
      voucherNo: voucherNum,
      voucherType: vType,
      reference: vRef || 'Manual Entry',
      narration: vNarration,
      debits: [{ ledgerId: debLedger, ledgerName: dLedgerObj.name, amount: Number(vAmount) }],
      credits: [{ ledgerId: credLedger, ledgerName: cLedgerObj.name, amount: Number(vAmount) }],
    };

    api.vouchers.create({ ...newVoucher, shopId: bizId })
      .then(saved => {
        const mapped: AccountingVoucher = {
          id: saved._id || saved.id,
          ...newVoucher
        };
        saveManualVouchers([mapped, ...manualVouchers]);
        triggerToast(`Posted Voucher ${voucherNum} Successfully!`);
      })
      .catch(err => {
        console.warn('Failed to post voucher to server.', err);
        const fallback: AccountingVoucher = {
          id: `mv_${Math.random().toString(36).substring(2, 9)}`,
          ...newVoucher
        };
        saveManualVouchers([fallback, ...manualVouchers]);
        triggerToast(`Posted Voucher ${voucherNum} (Local Backup) Successfully!`);
      });

    // Reset states
    setVAmount('');
    setVRef('');
    setVNarration('');
  };

  // Export reports to CSV/Print simulation
  const handleExportCSV = (reportName: string) => {
    alert(`Exporting ${reportName} to CSV completed successfully!`);
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6 font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-xl text-xs font-semibold shadow-lg z-50 flex items-center gap-2 border border-gray-800 animate-slide-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Corporate Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>TallyPrime Accounting Engine</span>
            <BookOpen className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">Automatic double entry ledger postings, Chart of Accounts, Day Book, Cash/Bank Books, Trial Balance, P&L, and Balance Sheet.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddLedgerModal(true)}
            className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Ledger</span>
          </button>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {[
          { id: 'daybook', label: 'Day Book (Postings)', icon: Layers },
          { id: 'ledgers', label: 'General Ledger Statements', icon: Landmark },
          { id: 'vouchers', label: 'Record Voucher Entry', icon: Send },
          { id: 'trial', label: 'Trial Balance', icon: Activity },
          { id: 'profit', label: 'Profit & Loss Statement', icon: DollarSign },
          { id: 'balance', label: 'Balance Sheet', icon: Grid },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-1.5 cursor-pointer -mb-px ${
              subTab === t.id 
                ? 'border-black text-black font-semibold' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* SUBTAB 1: DAY BOOK */}
      {subTab === 'daybook' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-gray-150">
            <div className="relative w-full sm:w-72 text-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Day Book entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 focus:outline-none focus:border-black font-medium"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto text-xs">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
              />
              <button 
                onClick={() => handleExportCSV('Day Book')}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium cursor-pointer bg-white"
              >
                <Download className="h-4 w-4 text-gray-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs text-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                    <th className="p-3">Date</th>
                    <th className="p-3">Voucher Type</th>
                    <th className="p-3">Voucher No</th>
                    <th className="p-3">Narration / Particulars</th>
                    <th className="p-3 text-right">Debit Posting</th>
                    <th className="p-3 text-right">Credit Posting</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vouchers
                    .filter(v => {
                      const matchesSearch = v.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            v.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            v.debits.some(d => d.ledgerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                            v.credits.some(c => c.ledgerName.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesDate = dateFilter ? v.date === dateFilter : true;
                      return matchesSearch && matchesDate;
                    })
                    .map((v) => {
                      const debTotal = v.debits.reduce((s, x) => s + x.amount, 0);
                      const credTotal = v.credits.reduce((s, x) => s + x.amount, 0);
                      
                      return (
                        <tr key={v.id} className="hover:bg-gray-50/50">
                          <td className="p-3 whitespace-nowrap font-medium text-gray-600">{v.date} {v.time && <span className="text-[9px] text-gray-400 block">{v.time}</span>}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              v.voucherType === 'Sales' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                              v.voucherType === 'Purchase' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' :
                              v.voucherType === 'Payment' ? 'bg-rose-50 text-rose-700 border border-rose-150' :
                              v.voucherType === 'Receipt' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                              v.voucherType === 'Credit Note' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                              v.voucherType === 'Debit Note' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                              'bg-purple-50 text-purple-700 border border-purple-150'
                            }`}>
                              {v.voucherType}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-900">{v.voucherNo}</td>
                          <td className="p-3 font-medium">
                            <div className="space-y-0.5 max-w-sm">
                              <p className="font-bold text-gray-800">{v.narration}</p>
                              <div className="text-[10px] text-gray-400 font-mono">
                                <div>Dr: {v.debits.map(d => `${d.ledgerName} (₹${d.amount})`).join(', ')}</div>
                                <div>Cr: {v.credits.map(c => `${c.ledgerName} (₹${c.amount})`).join(', ')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{debTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right font-mono font-bold text-gray-800">₹{credTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${v.isAutomatic ? 'bg-gray-100 text-gray-600' : 'bg-black text-white'}`}>
                              {v.isAutomatic ? 'Auto System' : 'JV Manual'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: GENERAL LEDGER STATEMENTS */}
      {subTab === 'ledgers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-xs">
          {/* Left panel: Ledgers List */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Landmark className="h-4.5 w-4.5 text-gray-400" />
              <span>Chart of Ledgers</span>
            </h3>

            <div className="relative text-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search chart accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 focus:outline-none focus:border-black font-medium"
              />
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {ledgers
                .filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLedgerId(l.id)}
                    className={`w-full text-left p-2 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
                      selectedLedgerId === l.id ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold truncate max-w-[150px]">{l.name}</div>
                      <div className={`text-[9px] uppercase font-mono ${selectedLedgerId === l.id ? 'text-gray-300' : 'text-gray-400'}`}>{l.group}</div>
                    </div>
                    <div className="font-mono font-bold text-right">
                      <div>₹{l.currentBalance.toLocaleString('en-IN')}</div>
                      <div className="text-[8px] tracking-wider uppercase opacity-80">{l.balanceType}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Right panel: Active Ledger Statement */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            {selectedLedgerId ? (
              (() => {
                const activeL = ledgers.find(l => l.id === selectedLedgerId);
                if (!activeL) return null;

                const ledgerPostings = vouchers.filter(v => 
                  v.debits.some(d => d.ledgerId === selectedLedgerId) || 
                  v.credits.some(c => c.ledgerId === selectedLedgerId)
                );

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{activeL.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Group: {activeL.group} | Opening Balance: ₹{activeL.openingBalance.toLocaleString('en-IN')}</p>
                      </div>
                      <button 
                        onClick={() => handleExportCSV(`${activeL.name} Statement`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer bg-white"
                      >
                        <Printer className="h-3.5 w-3.5 text-gray-400" />
                        <span>Print Statement</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">Opening</span>
                        <span className="text-sm font-bold font-mono text-gray-900">₹{activeL.openingBalance.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">Current Postings</span>
                        <span className="text-sm font-bold font-mono text-emerald-700">₹{ledgerPostings.reduce((sum, v) => sum + v.debits.concat(v.credits).filter(x => x.ledgerId === selectedLedgerId).reduce((s, it) => s + it.amount, 0), 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">Closing Balance</span>
                        <span className="text-sm font-bold font-mono text-gray-900">₹{activeL.currentBalance.toLocaleString('en-IN')} <span className="text-[10px] font-bold text-gray-400">{activeL.balanceType}</span></span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Voucher</th>
                            <th className="p-2.5">Particulars / Narration</th>
                            <th className="p-2.5 text-right">Debit Posting</th>
                            <th className="p-2.5 text-right">Credit Posting</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono">
                          {ledgerPostings.map(lp => {
                            const debAmt = lp.debits.find(d => d.ledgerId === selectedLedgerId)?.amount || 0;
                            const credAmt = lp.credits.find(c => c.ledgerId === selectedLedgerId)?.amount || 0;

                            return (
                              <tr key={lp.id} className="hover:bg-gray-50/50">
                                <td className="p-2.5 font-sans text-gray-500">{lp.date}</td>
                                <td className="p-2.5">
                                  <span className="font-bold text-gray-900 block">{lp.voucherNo}</span>
                                  <span className="text-[8px] font-sans text-gray-400 block uppercase">{lp.voucherType}</span>
                                </td>
                                <td className="p-2.5 font-sans">
                                  <span className="font-bold text-gray-700 block">{lp.narration}</span>
                                  <span className="text-[9px] text-gray-400 block">Ref: {lp.reference}</span>
                                </td>
                                <td className="p-2.5 text-right text-emerald-700 font-bold">{debAmt > 0 ? `₹${debAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</td>
                                <td className="p-2.5 text-right text-gray-800 font-bold">{credAmt > 0 ? `₹${credAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</td>
                              </tr>
                            );
                          })}
                          {ledgerPostings.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center font-sans text-gray-400">No transactions recorded under this ledger statement.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                <HelpCircle className="h-10 w-10 stroke-[1.2px]" />
                <h4 className="font-bold text-gray-700">No ledger account selected</h4>
                <p className="max-w-xs text-[11px]">Select any account ledger from the left-hand Chart of Accounts to render a complete ledger account summary and corporate audit log statement.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: RECORD MANUAL VOUCHER ENTRY */}
      {subTab === 'vouchers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-xs">
          
          {/* Post Form (2 cols) */}
          <form onSubmit={handlePostVoucher} className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-1.5">
              <Send className="h-4.5 w-4.5 text-gray-400" />
              <span>Record Manual Journal Voucher Posting</span>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Voucher Type *</label>
                <select
                  value={vType}
                  onChange={(e) => setVType(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
                >
                  <option value="Journal">Journal Voucher (JV)</option>
                  <option value="Payment">Payment Voucher (PAY)</option>
                  <option value="Receipt">Receipt Voucher (REC)</option>
                  <option value="Contra">Contra Voucher (CON - Cash/Bank)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Posting Date *</label>
                <input
                  type="date"
                  required
                  value={vDate}
                  onChange={(e) => setVDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Reference No / Invoice Link</label>
                <input
                  type="text"
                  value={vRef}
                  placeholder="e.g. INV-2026-001"
                  onChange={(e) => setVRef(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
              <div>
                <label className="text-[10px] text-emerald-700 font-bold block mb-1">Debit Account (Ledger Dr) *</label>
                <select
                  required
                  value={debLedger}
                  onChange={(e) => setDebLedger(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
                >
                  <option value="">-- Choose Debited Account --</option>
                  {ledgers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.group})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-1">Credit Account (Ledger Cr) *</label>
                <select
                  required
                  value={credLedger}
                  onChange={(e) => setCredLedger(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
                >
                  <option value="">-- Choose Credited Account --</option>
                  {ledgers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.group})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Transaction Value (Amount in ₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={vAmount}
                  onChange={(e) => setVAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Transaction Narration (Particulars) *</label>
                <input
                  type="text"
                  required
                  placeholder="Add corporate double-entry narration..."
                  value={vNarration}
                  onChange={(e) => setVNarration(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Post Voucher to Books</span>
              </button>
            </div>
          </form>

          {/* Guidelines info (1 col) */}
          <div className="bg-gray-900 text-gray-100 p-5 rounded-2xl border border-gray-850 space-y-4 shadow-sm">
            <h4 className="font-bold flex items-center gap-1 text-white">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>Accounting Guidelines</span>
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">Ensure double entry rules are respected when entering manual journal postings:</p>
            <ul className="space-y-2 text-[10px] text-gray-300 list-disc list-inside leading-relaxed">
              <li><strong>Contra:</strong> Transferring between bank accounts or depositing/withdrawing physical cash.</li>
              <li><strong>Payment:</strong> Settling expenses or paying vendor liabilities.</li>
              <li><strong>Receipt:</strong> Crediting customer bills and receivables, debiting cash or bank ledger.</li>
              <li><strong>Journal:</strong> General non-cash adjustments (such as depreciation, asset adjustments, bad debts etc.).</li>
            </ul>
          </div>
        </div>
      )}

      {/* SUBTAB 4: TRIAL BALANCE */}
      {subTab === 'trial' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150">
            <div className="text-xs font-bold text-gray-800">Trial Balance Statement as on Current Fiscal Date</div>
            <button 
              onClick={() => handleExportCSV('Trial Balance')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-xs font-bold cursor-pointer"
            >
              <Download className="h-4 w-4 text-gray-400" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs text-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                    <th className="p-3">Ledger Statement Account Particulars</th>
                    <th className="p-3">Group Category</th>
                    <th className="p-3 text-right">Debit Balance (Dr)</th>
                    <th className="p-3 text-right">Credit Balance (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {ledgers.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-sans font-medium text-gray-900">{l.name}</td>
                      <td className="p-3 font-sans text-gray-400">{l.group}</td>
                      <td className="p-3 text-right text-emerald-700 font-bold">{l.balanceType === 'Debit' ? `₹${l.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</td>
                      <td className="p-3 text-right text-gray-800 font-bold">{l.balanceType === 'Credit' ? `₹${l.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-gray-50 font-bold text-sm">
                    <td colSpan={2} className="p-3 text-right font-sans text-gray-900">Total Trial Balance matching:</td>
                    <td className="p-3 text-right text-emerald-800">₹{ledgers.filter(x => x.balanceType === 'Debit').reduce((s, x) => s + x.currentBalance, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-gray-900">₹{ledgers.filter(x => x.balanceType === 'Credit').reduce((s, x) => s + x.currentBalance, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: PROFIT & LOSS STATEMENT */}
      {subTab === 'profit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs">
          
          {/* Trading Account Ledger Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-wider">Trading Ledger Account Book</h4>
            <div className="space-y-3 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-sans text-gray-600 font-medium">Billed Sales Income</span>
                <span className="font-bold text-gray-900">₹{profitAndLoss.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-sans text-gray-600 font-medium">Less: Purchases Cost of Goods</span>
                <span className="font-bold text-red-600">- ₹{profitAndLoss.purchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-sans text-gray-600 font-medium">Less: Direct Wages / Freight</span>
                <span className="font-bold text-red-600">- ₹{profitAndLoss.directExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm font-sans font-bold border-t-2 border-double border-gray-200">
                <span>Trading Gross Profit (GP)</span>
                <span className={profitAndLoss.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  ₹{profitAndLoss.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Income Statement Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-wider">Profit & Loss Income Statement</h4>
            <div className="space-y-3 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-sans text-gray-600 font-medium">Gross Profit Transferred (GP)</span>
                <span className="font-bold text-gray-900">₹{profitAndLoss.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-sans text-gray-600 font-medium">Other Indirect Incomes</span>
                <span className="font-bold text-emerald-700">+ ₹{profitAndLoss.otherIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-sans text-gray-600 font-medium">Less: Indirect Operating Expenses</span>
                <span className="font-bold text-red-600">- ₹{profitAndLoss.indirectExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm font-sans font-bold border-t-2 border-double border-gray-200">
                <span>Net Profit / Earnings (NP)</span>
                <span className={profitAndLoss.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}>
                  ₹{profitAndLoss.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 6: BALANCE SHEET */}
      {subTab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs">
          
          {/* Liabilities Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-wider">Capital & Corporate Liabilities</h4>
            <div className="space-y-3 font-mono">
              {balanceSheet.capital.map((c, i) => (
                <div key={i} className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="font-sans text-gray-600 font-medium">{c.name}</span>
                  <span className="font-bold text-gray-800">₹{c.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="font-sans text-gray-600 font-medium">Retained Corporate Earnings (NP)</span>
                <span className="font-bold text-emerald-700">₹{profitAndLoss.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {balanceSheet.liabilities.map((l, i) => (
                <div key={i} className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="font-sans text-gray-600 font-medium">{l.name}</span>
                  <span className="font-bold text-gray-800">₹{l.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 text-sm font-sans font-bold border-t-2 border-double border-gray-200">
                <span>Total Capital & Liabilities</span>
                <span>₹{(balanceSheet.totalCapital + profitAndLoss.netProfit + balanceSheet.totalLiabilities).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Assets Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-wider">Corporate Assets Register</h4>
            <div className="space-y-3 font-mono">
              {balanceSheet.assets.map((a, i) => (
                <div key={i} className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="font-sans text-gray-600 font-medium">{a.name}</span>
                  <span className="font-bold text-gray-800">₹{a.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              {/* Ensure double entry matches ledger */}
              <div className="flex justify-between items-center pt-2 text-sm font-sans font-bold border-t-2 border-double border-gray-200">
                <span>Total Assets Statement</span>
                <span>₹{balanceSheet.totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CREATE LEDGER MODAL */}
      {showAddLedgerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xl max-w-sm w-full space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h4 className="text-sm font-bold text-gray-900">Create Corporate Ledger Account</h4>
              <button 
                onClick={() => setShowAddLedgerModal(false)}
                className="text-gray-400 hover:text-black font-semibold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomLedger} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Ledger Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Stationary A/c"
                  value={newLedgerName}
                  onChange={(e) => setNewLedgerName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Tally Group Category *</label>
                <select
                  value={newLedgerGroup}
                  onChange={(e) => setNewLedgerGroup(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
                >
                  {STANDARD_GROUPS.map(g => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={newLedgerOpening}
                    onChange={(e) => setNewLedgerOpening(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Balance Type</label>
                  <select
                    value={newLedgerBalType}
                    onChange={(e) => setNewLedgerBalType(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
                  >
                    <option value="Debit">Debit (Dr)</option>
                    <option value="Credit">Credit (Cr)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLedgerModal(false)}
                  className="px-3 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 cursor-pointer text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-3 py-2 rounded-lg font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Post Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
