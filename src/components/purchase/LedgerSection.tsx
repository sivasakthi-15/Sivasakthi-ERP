import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import { Search, Eye, Landmark, CreditCard, DollarSign, Printer, X, Save, AlertTriangle, Check, BookOpen } from 'lucide-react';

export const LedgerSection: React.FC = () => {
  const { 
    suppliers, 
    purchases, 
    purchaseReturns, 
    supplierDebitNotes, 
    payments, 
    recordSupplierPayment 
  } = useApp();

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);

  // Payment Form States
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Supplier helper
  const activeSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId);
  }, [selectedSupplierId, suppliers]);

  // Compile Chronological Statement of Account
  const ledgerStatement = useMemo(() => {
    if (!selectedSupplierId) return [];

    interface LedgerEntry {
      id: string;
      date: string;
      type: 'Purchase Invoice' | 'Payment Out' | 'Purchase Return (CN)' | 'Debit Note';
      reference: string;
      debit: number;  // Increases what we owe (increases liability)
      credit: number; // Decreases what we owe (decreases liability)
    }

    const entries: LedgerEntry[] = [];

    // 1. Gather Purchases (We owe them MORE: DEBIT)
    purchases
      .filter(p => p.supplierId === selectedSupplierId)
      .forEach(p => {
        entries.push({
          id: p.id,
          date: p.date,
          type: 'Purchase Invoice',
          reference: p.supplierInvoiceNumber || p.purchaseNumber,
          debit: p.grandTotal,
          credit: 0
        });
      });

    // 2. Gather Payments (We owe them LESS: CREDIT)
    payments
      .filter(pay => pay.partyId === selectedSupplierId && pay.partyType === 'supplier')
      .forEach(pay => {
        entries.push({
          id: pay.id,
          date: pay.date,
          type: 'Payment Out',
          reference: pay.notes || 'Settle Payment',
          debit: 0,
          credit: pay.amount
        });
      });

    // 3. Gather Returns / Credit Notes (We owe them LESS: CREDIT)
    purchaseReturns
      .filter(ret => ret.supplierId === selectedSupplierId)
      .forEach(ret => {
        entries.push({
          id: ret.id,
          date: ret.date,
          type: 'Purchase Return (CN)',
          reference: ret.returnNumber,
          debit: 0,
          credit: ret.grandTotal
        });
      });

    // 4. Gather Debit Notes (We owe them LESS: CREDIT)
    supplierDebitNotes
      .filter(dn => dn.supplierId === selectedSupplierId)
      .forEach(dn => {
        entries.push({
          id: dn.id,
          date: dn.date,
          type: 'Debit Note',
          reference: dn.debitNoteNumber,
          debit: 0,
          credit: dn.amount
        });
      });

    // Sort chronologically by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute Running Balance (Liability running balance)
    let running = 0;
    const finalStatement = entries.map(entry => {
      // Debit increases liability, Credit decreases liability
      running = running + entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: Number(running.toFixed(2))
      };
    });

    return finalStatement;
  }, [selectedSupplierId, purchases, payments, purchaseReturns, supplierDebitNotes]);

  // Handle Recording Payment
  const handleRecordPayment = () => {
    setFormError('');
    setSuccessMsg('');

    if (!selectedSupplierId || !activeSupplier) return;
    if (payAmount <= 0) {
      setFormError('Payment amount must be greater than zero');
      return;
    }
    if (payAmount > activeSupplier.outstandingAmount) {
      setFormError(`Cannot pay more than current outstanding balance (₹${(activeSupplier.outstandingAmount ?? 0).toFixed(2)})`);
      return;
    }

    const payNotes = `${paymentMode} payout to Supplier. Ref: ${paymentRef}. Notes: ${notes}`;

    recordSupplierPayment(selectedSupplierId, payAmount, paymentMode, payNotes);

    setSuccessMsg(`Recorded payment of ₹{(payAmount ?? 0).toFixed(2)} to ${activeSupplier.name}`);
    setShowPayModal(false);
    setPayAmount(0);
    setPaymentRef('');
    setNotes('');
  };

  // Print Statement Helper
  const handlePrintStatement = () => {
    if (!activeSupplier) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = ledgerStatement.map((entry, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${entry.date}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entry.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entry.reference}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${entry.debit > 0 ? `₹${(entry.debit ?? 0).toFixed(2)}` : '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; color: #16a34a;">${entry.credit > 0 ? `₹${(entry.credit ?? 0).toFixed(2)}` : '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">₹${(entry.runningBalance ?? 0).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Statement of Account - ${activeSupplier.name}</title>
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
            <div class="title">Statement of Account</div>
            <p>Party Name: <strong>${activeSupplier.name}</strong></p>
            <p>Mobile: ${activeSupplier.mobile || 'N/A'} | City: ${activeSupplier.city || 'N/A'}</p>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 25px; background: #fafafa; padding: 15px; border-radius: 6px;">
            <div>Statement Period: <strong>All Transactions</strong></div>
            <div style="text-align: right; font-size: 16px; font-weight: bold; color: #b91c1c;">
              Final Outstanding Due: ₹${(activeSupplier.outstandingAmount ?? 0).toFixed(2)}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 100px;">Date</th>
                <th>Voucher Type</th>
                <th>Voucher Number/Ref</th>
                <th style="text-align: right;">Debit (Purchases ₹)</th>
                <th style="text-align: right;">Credit (Settled ₹)</th>
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
    <div id="ledger-section-container" className="space-y-6">
      {/* Alert Banner */}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="h-5 w-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        {/* Left Column: Supplier Selector widget */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Select Supplier Accounts</h3>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 max-h-[70vh] overflow-y-auto">
            {suppliers.map(supp => (
              <button
                key={supp.id}
                onClick={() => setSelectedSupplierId(supp.id)}
                className={`w-full p-3 rounded-lg text-left border flex flex-col justify-between transition ${
                  selectedSupplierId === supp.id ? 'border-emerald-500 bg-emerald-50/40 font-semibold' : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <span className="text-slate-800 text-sm truncate font-bold">{supp.name}</span>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>{supp.city || 'No City'}</span>
                  <span className={`font-bold ${supp.outstandingAmount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    ₹{(supp.outstandingAmount ?? 0).toFixed(2)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Columns: Ledger Statement & Payments */}
        <div className="md:col-span-3 space-y-6">
          {activeSupplier ? (
            /* Active Ledger Panel */
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid gap-4 sm:grid-cols-3 bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Supplier Name</p>
                  <p className="text-lg font-bold text-slate-850 mt-1">{activeSupplier.name}</p>
                  <p className="text-xs text-slate-500">{activeSupplier.mobile || 'No Mobile'} | {activeSupplier.city || 'No City'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Current Ledger Outstanding</p>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">₹{(activeSupplier.outstandingAmount ?? 0).toFixed(2)}</p>
                  <span className="text-[10px] text-slate-400 italic">Net liability outstanding</span>
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <button
                    onClick={() => setShowPayModal(true)}
                    disabled={activeSupplier.outstandingAmount <= 0}
                    className="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    Pay Off Balance
                  </button>
                  <button
                    onClick={handlePrintStatement}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Statement
                  </button>
                </div>
              </div>

              {/* Statement List table */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Statement of Ledger Account (Chronological)</h3>
                
                {ledgerStatement.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-sm">
                    No transactions found in this ledger account.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-150">
                          <th className="p-3 text-center w-28">Date</th>
                          <th className="p-3">Voucher Type</th>
                          <th className="p-3">Ref/Voucher No.</th>
                          <th className="p-3 text-right">Debit (Purchases ₹)</th>
                          <th className="p-3 text-right">Credit (Settled ₹)</th>
                          <th className="p-3 text-right w-36">Running Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {ledgerStatement.map((entry, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="p-3 text-center text-slate-400">{entry.date}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                entry.type === 'Purchase Invoice' ? 'bg-slate-100 text-slate-700' :
                                entry.type === 'Payment Out' ? 'bg-emerald-50 text-emerald-700' :
                                entry.type === 'Debit Note' ? 'bg-rose-50 text-rose-750' :
                                'bg-sky-50 text-sky-700'
                              }`}>
                                {entry.type}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-mono truncate max-w-xs">{entry.reference}</td>
                            <td className="p-3 text-right text-slate-700">
                              {entry.debit > 0 ? `₹${(entry.debit ?? 0).toFixed(2)}` : '-'}
                            </td>
                            <td className="p-3 text-right text-emerald-600">
                              {entry.credit > 0 ? `₹${(entry.credit ?? 0).toFixed(2)}` : '-'}
                            </td>
                            <td className="p-3 text-right font-extrabold text-slate-900 bg-slate-50/30">
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
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-2 animate-bounce" />
              <p className="font-semibold text-slate-500">Select a Supplier ledger to view statement, transaction records and post settlements.</p>
            </div>
          )}
        </div>
      </div>

      {/* Record payment modal */}
      {showPayModal && activeSupplier && (
        <div id="ledger-pay-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col justify-between">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Post Settle Payment</h3>
                <span className="text-xs font-semibold text-emerald-600">Supplier: {activeSupplier.name}</span>
              </div>
              <button onClick={() => setShowPayModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="rounded-lg bg-rose-50 p-2 text-rose-700 flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  {formError}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-center justify-between font-semibold">
                <span className="text-amber-800">Remaining Balance:</span>
                <span className="text-amber-900 font-bold">₹{(activeSupplier.outstandingAmount ?? 0).toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  placeholder="₹ Settle Amount"
                  value={payAmount === 0 ? '' : payAmount}
                  onChange={e => setPayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-extrabold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Debit/Credit Card</option>
                    <option value="Bank">Bank Transfer (NEFT)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Ref UTR/Cheque No.</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-9923"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Internal Note</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add details on bank transactions..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100">
              <button
                onClick={handleRecordPayment}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
              >
                Post Payment Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
