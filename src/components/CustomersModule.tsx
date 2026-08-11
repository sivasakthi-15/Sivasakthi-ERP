import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Bill, PaymentTransaction, SalesReturn } from '../types';
import { 
  Plus, Search, Edit3, Trash2, Landmark, Check, X, ArrowUpRight, 
  ArrowDownLeft, Sparkles, UserCheck, HelpCircle, Eye, Printer, BookOpen, Clock, FileText, Receipt
} from 'lucide-react';

export const CustomersModule: React.FC = () => {
  const { 
    customers, bills, salesReturns, payments,
    addCustomer, updateCustomer, deleteCustomer, recordCustomerPayment 
  } = useApp();

  const [activeSection, setActiveSection] = useState<'directory' | 'ledger'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [activeSettleContact, setActiveSettleContact] = useState<{ id: string; name: string; outstanding: number } | null>(null);
  
  // Settle form states
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [settleRef, setSettleRef] = useState('');

  // Form Fields State
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('600001');
  const [gstNumber, setGstNumber] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState('20000');
  const [notes, setNotes] = useState('');

  // Info modals for Customer Actions
  const [showSalesHistoryModal, setShowSalesHistoryModal] = useState<Customer | null>(null);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState<Customer | null>(null);

  // Filter customers
  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.mobile || '').includes(searchTerm) ||
    (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setName('');
    setOrganizationName('');
    setMobile('');
    setAddress('');
    setCity('');
    setState('Tamil Nadu');
    setPincode('600001');
    setGstNumber('');
    setEmail('');
    setCreditLimit('50000');
    setNotes('');
    setShowContactModal(true);
  };

  const handleOpenEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setOrganizationName(customer.organizationName || '');
    setMobile(customer.mobile);
    setAddress(customer.address);
    setCity(customer.city);
    setState(customer.state);
    setPincode(customer.pincode);
    setGstNumber(customer.gstNumber || '');
    setEmail(customer.email || '');
    setCreditLimit(customer.creditLimit?.toString() || '50000');
    setNotes(customer.notes || '');
    setShowContactModal(true);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      alert('Customer Name and Mobile are mandatory');
      return;
    }

    const payload = {
      name,
      organizationName,
      mobile,
      address,
      city,
      state,
      pincode,
      gstNumber,
      email,
      creditLimit: parseFloat(creditLimit) || 0,
      notes,
      type: 'retail' as const
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, payload);
    } else {
      addCustomer(payload);
    }
    setShowContactModal(false);
  };

  const handleDeleteCustomer = (id: string) => {
    if (id === 'c_walkin') {
      alert('Walk-in Customer cannot be deleted.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this customer? This will also clear their master ledger record.')) {
      deleteCustomer(id);
    }
  };

  const handleOpenSettle = (customer: Customer) => {
    setActiveSettleContact({ id: customer.id, name: customer.name, outstanding: customer.outstandingAmount || 0 });
    setSettleAmount('');
    setSettleMode('cash');
    setSettleRef('');
    setShowSettleModal(true);
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSettleContact || !settleAmount.trim()) return;

    const amt = parseFloat(settleAmount) || 0;
    if (amt <= 0) {
      alert('Settle amount must be greater than zero.');
      return;
    }

    recordCustomerPayment(activeSettleContact.id, amt, settleMode, settleRef || 'Customer payment receipt');
    setShowSettleModal(false);
  };

  // Helper for Last Purchase info
  const getLastPurchase = (customerId: string) => {
    const custBills = bills.filter(b => b.customerId === customerId && b.status !== 'cancelled');
    if (custBills.length === 0) return null;
    // Sort by date, time
    const sorted = [...custBills].sort((a, b) => new Date(`${b.date}T${b.time || '00:00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00:00'}`).getTime());
    return sorted[0];
  };

  // Compile Chronological Statement of Customer Account
  const ledgerStatement = useMemo(() => {
    if (!selectedCustomerId) return [];

    interface CustomerLedgerEntry {
      id: string;
      date: string;
      time?: string;
      type: 'Sales Invoice' | 'Payment Received' | 'Sales Return (CN)';
      reference: string;
      debit: number;  // Increases what they owe us (Sales Invoice)
      credit: number; // Decreases what they owe us (Receipt or Return)
    }

    const entries: CustomerLedgerEntry[] = [];

    // 1. Gather Sales Invoices (Debit)
    bills
      .filter(b => b.customerId === selectedCustomerId && b.status !== 'cancelled')
      .forEach(b => {
        entries.push({
          id: b.id,
          date: b.date,
          time: b.time,
          type: 'Sales Invoice',
          reference: b.billNumber,
          debit: b.grandTotal,
          credit: 0
        });
      });

    // 2. Gather Payments/Receipts (Credit)
    payments
      .filter(pay => pay.partyId === selectedCustomerId && pay.partyType === 'customer')
      .forEach(pay => {
        entries.push({
          id: pay.id,
          date: pay.date,
          type: 'Payment Received',
          reference: pay.notes || 'Settle Payment Receipt',
          debit: 0,
          credit: pay.amount
        });
      });

    // 3. Gather Sales Returns (Credit)
    salesReturns
      .filter(sr => sr.customerId === selectedCustomerId)
      .forEach(sr => {
        entries.push({
          id: sr.id,
          date: sr.date,
          type: 'Sales Return (CN)',
          reference: sr.returnNumber,
          debit: 0,
          credit: sr.grandTotal
        });
      });

    // Sort chronologically
    entries.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
      return dateA - dateB;
    });

    // Compute Running Balance (Receivable Balance)
    let running = 0;
    return entries.map(entry => {
      running = running + entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: Number(running.toFixed(2))
      };
    });
  }, [selectedCustomerId, bills, payments, salesReturns]);

  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const handlePrintStatement = () => {
    if (!activeCustomer) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = ledgerStatement.map((entry, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${entry.date}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entry.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entry.reference}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #b91c1c;">${entry.debit > 0 ? `₹${(entry.debit ?? 0).toFixed(2)}` : '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #16a34a;">${entry.credit > 0 ? `₹${(entry.credit ?? 0).toFixed(2)}` : '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">₹${(entry.runningBalance ?? 0).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Ledger Statement - ${activeCustomer.name}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 13px; }
            td { font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Customer Statement of Account</div>
            <p>Customer Name: <strong>${activeCustomer.name}</strong></p>
            <p>Mobile: ${activeCustomer.mobile || 'N/A'} | City/Place: ${activeCustomer.city || 'N/A'}</p>
            <p>Address: ${activeCustomer.address || 'N/A'}</p>
            ${activeCustomer.gstNumber ? `<p>GSTIN: <strong>${activeCustomer.gstNumber}</strong></p>` : ''}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 25px; background: #fafafa; padding: 15px; border-radius: 6px;">
            <div>Statement Period: <strong>All Transactions</strong></div>
            <div style="text-align: right; font-size: 16px; font-weight: bold; color: #b91c1c;">
              Net Debit Outstanding: ₹${(activeCustomer.outstandingAmount ?? 0).toFixed(2)}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 100px;">Date</th>
                <th>Voucher Type</th>
                <th>Reference/Voucher No.</th>
                <th style="text-align: right;">Debit (Invoices ₹)</th>
                <th style="text-align: right;">Credit (Receipts/Returns ₹)</th>
                <th style="text-align: right;">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 bg-[#f9fafb] p-6 overflow-y-auto space-y-6 font-sans">
      
      {/* Header and Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('directory')}
              className={`text-lg font-bold tracking-tight px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSection === 'directory' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'
              }`}
            >
              Customer Directory
            </button>
            <button
              onClick={() => setActiveSection('ledger')}
              className={`text-lg font-bold tracking-tight px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSection === 'ledger' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'
              }`}
            >
              Customer Ledger
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 pl-3">
            {activeSection === 'directory' 
              ? 'Manage customer profiles, places, phone numbers, and outstanding credit limits.' 
              : 'Analyze step-by-step invoice transactions, ledger credits, and balance receipts.'}
          </p>
        </div>
        
        {activeSection === 'directory' && (
          <button
            onClick={handleOpenAddCustomer}
            className="flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {activeSection === 'directory' ? (
        <>
          {/* Directory Filter Panel */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search Customer Name, Mobile, City..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-semibold border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-black bg-white"
              />
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="text-xs font-mono text-gray-400">
              {filteredCustomers.length} active customer profiles
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Customer Profile</th>
                    <th className="p-3 w-32">Mobile Phone</th>
                    <th className="p-3">Place / City</th>
                    <th className="p-3 w-36">GSTIN</th>
                    <th className="p-3 w-32 text-right">Credit Limit (₹)</th>
                    <th className="p-3 w-36 text-right">Outstanding (₹)</th>
                    <th className="p-3 text-center w-56">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">No customers found.</td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c, idx) => {
                      const lastP = getLastPurchase(c.id);
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/20">
                          <td className="p-3 text-center font-mono text-gray-400 text-[10px]">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{c.organizationName ? c.organizationName : c.name}</div>
                            {c.organizationName && <div className="text-[10px] text-gray-500 font-medium">Attn: {c.name}</div>}
                            {c.notes && (
                              <div className="text-[10px] text-gray-400 mt-0.5 font-sans truncate max-w-[200px]" title={c.notes}>
                                {c.notes}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono">{c.mobile}</td>
                          <td className="p-3 text-gray-600 truncate max-w-[150px]" title={`${c.address}, ${c.city}`}>
                            <span className="font-bold text-gray-800">{c.city}</span>
                            {c.address && <span className="text-[11px] text-gray-400 block truncate">{c.address}</span>}
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-800 uppercase">{c.gstNumber || '-'}</td>
                          <td className="p-3 text-right font-mono font-bold text-gray-500">
                            ₹{(c.creditLimit ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-mono font-bold ${c.outstandingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            ₹{(c.outstandingAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {/* Receive Payment */}
                              <button
                                onClick={() => handleOpenSettle(c)}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-bold tracking-tight transition-all cursor-pointer border border-emerald-100"
                                title="Record Cash Receipt"
                              >
                                Settle
                              </button>

                              {/* Ledger Redirect */}
                              <button
                                onClick={() => {
                                  setSelectedCustomerId(c.id);
                                  setActiveSection('ledger');
                                }}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 hover:bg-black hover:text-white rounded text-[10px] font-bold tracking-tight transition-all cursor-pointer border border-gray-200"
                                title="Open ledger statement"
                              >
                                Ledger
                              </button>

                              {/* Sales History */}
                              <button
                                onClick={() => setShowSalesHistoryModal(c)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 cursor-pointer"
                                title="Sales Invoices History"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>

                              {/* Last Purchase text popover (rendered inline via tooltip/title or small subtext) */}
                              <button
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 cursor-pointer"
                                title={lastP ? `Last Billed: ${lastP.date} (₹${lastP.grandTotal.toFixed(2)})` : 'No purchase yet'}
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </button>

                              {/* Payments History */}
                              <button
                                onClick={() => setShowPaymentHistoryModal(c)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 cursor-pointer"
                                title="Receipt payment history"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEditCustomer(c)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete */}
                              {c.id !== 'c_walkin' && (
                                <button
                                  onClick={() => handleDeleteCustomer(c.id)}
                                  className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Customer Ledger Statement Section */
        <div className="grid gap-6 md:grid-cols-4">
          
          {/* Left customer list bar */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Select Customer</h3>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 max-h-[70vh] overflow-y-auto">
              {customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`w-full p-3 rounded-lg text-left border flex flex-col justify-between transition ${
                    selectedCustomerId === c.id ? 'border-black bg-neutral-50/70 font-semibold' : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <span className="text-slate-800 text-sm truncate font-bold">{c.name}</span>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span className="font-bold text-gray-700">{c.city || 'No city'}</span>
                    <span className={`font-bold ${c.outstandingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{(c.outstandingAmount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right customer ledger history */}
          <div className="md:col-span-3 space-y-6">
            {activeCustomer ? (
              <div className="space-y-6">
                
                {/* Outstanding and Actions */}
                <div className="grid gap-4 sm:grid-cols-3 bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Client Contact</p>
                    <p className="text-lg font-bold text-slate-850 mt-1">{activeCustomer.organizationName || activeCustomer.name}</p>
                    {activeCustomer.organizationName && <p className="text-[11px] text-slate-600 font-bold uppercase">Attn: {activeCustomer.name}</p>}
                    <p className="text-xs text-slate-500">{activeCustomer.mobile} | {activeCustomer.city || 'No City'}</p>
                    {activeCustomer.gstNumber && <p className="text-[10px] font-mono text-gray-400 font-bold uppercase mt-1">GST: {activeCustomer.gstNumber}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Receivable Outstanding</p>
                    <p className={`text-2xl font-extrabold mt-1 ${activeCustomer.outstandingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{(activeCustomer.outstandingAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-slate-400 italic">Credit Limit: ₹{(activeCustomer.creditLimit ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <button
                      onClick={() => handleOpenSettle(activeCustomer)}
                      disabled={activeCustomer.outstandingAmount <= 0}
                      className="w-full rounded-lg bg-black py-2.5 text-xs font-bold text-white hover:bg-neutral-800 shadow-sm transition disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                    >
                      Receive Settle Payment
                    </button>
                    <button
                      onClick={handlePrintStatement}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print Account Statement
                    </button>
                  </div>
                </div>

                {/* Chronological entries */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Statement of Customer Ledger</h3>
                  
                  {ledgerStatement.length === 0 ? (
                    <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-sm">
                      No transactions recorded in this ledger.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-150">
                            <th className="p-3 text-center w-28">Date</th>
                            <th className="p-3">Transaction Type</th>
                            <th className="p-3">Invoice / Ref No.</th>
                            <th className="p-3 text-right">Debit (Sales ₹)</th>
                            <th className="p-3 text-right">Credit (Receipts ₹)</th>
                            <th className="p-3 text-right w-36">Running Balance (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {ledgerStatement.map((entry, i) => (
                            <tr key={i} className="hover:bg-slate-50/30">
                              <td className="p-3 text-center text-slate-400">{entry.date}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  entry.type === 'Sales Invoice' ? 'bg-red-50 text-red-700' :
                                  entry.type === 'Payment Received' ? 'bg-emerald-50 text-emerald-700' :
                                  'bg-sky-50 text-sky-700'
                                }`}>
                                  {entry.type}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 font-mono truncate max-w-xs">{entry.reference}</td>
                              <td className="p-3 text-right text-red-600">
                                {entry.debit > 0 ? `₹${(entry.debit ?? 0).toFixed(2)}` : '-'}
                              </td>
                              <td className="p-3 text-right text-emerald-600">
                                {entry.credit > 0 ? `₹${(entry.credit ?? 0).toFixed(2)}` : '-'}
                              </td>
                              <td className={`p-3 text-right font-extrabold bg-slate-50/30 ${entry.runningBalance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                ₹{(entry.runningBalance ?? 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-24 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 text-slate-400">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-500">Select a Customer to view their double-entry accounting ledger statement.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 1. Receive/Settle Outstanding Modal */}
      {showSettleModal && activeSettleContact && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="text-sm font-bold text-gray-900">Record Customer Payment Receipt</h3>
              <button onClick={() => setShowSettleModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <form onSubmit={handleSettleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 font-mono text-[11px] text-gray-600">
                <div>Customer Name: <span className="font-bold text-black">{activeSettleContact.name}</span></div>
                <div className="mt-1">
                  Receivable Outstanding: 
                  <span className="font-bold text-red-600 ml-1">₹{(activeSettleContact.outstanding ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Receipt Cash Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-semibold font-mono"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Receipt Mode</label>
                <select
                  value={settleMode}
                  onChange={(e: any) => setSettleMode(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                >
                  <option value="cash">Counter Cash Drawer</option>
                  <option value="upi">UPI instant transfer</option>
                  <option value="card">Card Terminal swipe</option>
                  <option value="bank_transfer">Direct RTGS / NEFT transfer</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Transaction Ref (Optional)</label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                  placeholder="UTR/UPI ref number"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-colors text-center"
              >
                Post Payment Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add / Edit Customer Form Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-150 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150 shrink-0">
              <h3 className="text-sm font-bold text-gray-900">
                {editingCustomer 
                  ? `Edit Profile: ${editingCustomer.name}` 
                  : `Create New Customer Account`}
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-semibold"
                    placeholder="Enter contact person name"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Organization / Panchayat (Optional)</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold text-indigo-700"
                    placeholder="e.g. Village Panchayat Office"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Primary Mobile No *</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                    placeholder="10-digit primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  placeholder="Shop/House address details"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
                    placeholder="e.g. Madurai"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white uppercase font-mono"
                    placeholder="33AAAAA1234XX"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Email Account</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                    placeholder="customer@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Allowed Credit Limit (₹)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono font-bold text-red-600"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Internal Ledger Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white h-16 resize-none"
                  placeholder="Notes about payment cycle or contractor details..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-colors text-center mt-6 shrink-0"
              >
                Save Customer Master Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Sales History Modal */}
      {showSalesHistoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Sales Invoices History</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Customer: <strong className="text-black">{showSalesHistoryModal.name}</strong></p>
              </div>
              <button onClick={() => setShowSalesHistoryModal(null)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 font-bold border-b border-gray-150 text-gray-500 text-[10px]">
                    <th className="p-2 w-28 text-center">Date</th>
                    <th className="p-2">Invoice Number</th>
                    <th className="p-2">Payment Mode</th>
                    <th className="p-2 text-right">Grand Total</th>
                    <th className="p-2 text-right">Paid Amount</th>
                    <th className="p-2 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {bills.filter(b => b.customerId === showSalesHistoryModal.id && b.status !== 'cancelled').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">No invoices recorded yet.</td>
                    </tr>
                  ) : (
                    bills
                      .filter(b => b.customerId === showSalesHistoryModal.id && b.status !== 'cancelled')
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="p-2 text-center text-gray-500 font-mono">{b.date}</td>
                          <td className="p-2 font-mono font-bold text-gray-900">{b.billNumber}</td>
                          <td className="p-2 uppercase font-mono text-[10px]">{b.paymentMode}</td>
                          <td className="p-2 text-right font-mono font-bold">₹{b.grandTotal.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono text-emerald-600 font-semibold">₹{b.paidAmount.toFixed(2)}</td>
                          <td className={`p-2 text-right font-mono font-bold ${b.balanceAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            ₹{b.balanceAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment/Receipt History Modal */}
      {showPaymentHistoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Receipts &amp; Payments History</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Customer: <strong className="text-black">{showPaymentHistoryModal.name}</strong></p>
              </div>
              <button onClick={() => setShowPaymentHistoryModal(null)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 font-bold border-b border-gray-150 text-gray-500 text-[10px]">
                    <th className="p-2 w-28 text-center">Date</th>
                    <th className="p-2">Payment Mode</th>
                    <th className="p-2">Description / Notes</th>
                    <th className="p-2 text-right">Receipt Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {payments.filter(p => p.partyId === showPaymentHistoryModal.id && p.partyType === 'customer').length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">No payment receipts found.</td>
                    </tr>
                  ) : (
                    payments
                      .filter(p => p.partyId === showPaymentHistoryModal.id && p.partyType === 'customer')
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="p-2 text-center text-gray-500 font-mono">{p.date}</td>
                          <td className="p-2 uppercase font-mono text-[10px] font-bold text-emerald-700">{p.paymentMode}</td>
                          <td className="p-2 text-gray-600 font-sans italic">{p.notes}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-600">₹{p.amount.toFixed(2)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
