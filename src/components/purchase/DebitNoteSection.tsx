import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SupplierDebitNote } from '../../types';
import { Plus, Search, Trash2, Eye, Printer, X, Save, AlertTriangle, Check, BookOpen } from 'lucide-react';

export const DebitNoteSection: React.FC = () => {
  const { 
    suppliers, 
    supplierDebitNotes, 
    createSupplierDebitNote 
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedDN, setSelectedDN] = useState<SupplierDebitNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [supplierId, setSupplierId] = useState('');
  const [invoiceReference, setInvoiceReference] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('Rate Difference');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveDN = () => {
    setFormError('');
    setSuccessMsg('');

    if (!supplierId) {
      setFormError('Please select a supplier');
      return;
    }
    if (amount <= 0) {
      setFormError('Debit amount must be greater than 0');
      return;
    }
    if (!invoiceReference.trim()) {
      setFormError('Please enter referenced invoice number');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId)!;

    createSupplierDebitNote({
      supplierId,
      supplierName: supplier.name,
      date: new Date().toISOString().split('T')[0],
      amount,
      invoiceReference: invoiceReference.trim(),
      reason,
      notes
    });

    setSuccessMsg(`Successfully generated Supplier Debit Note for supplier ${supplier.name}`);
    setIsCreating(false);

    // Reset Forms
    setSupplierId('');
    setInvoiceReference('');
    setAmount(0);
    setNotes('');
  };

  const filteredDNs = useMemo(() => {
    return supplierDebitNotes.filter(dn => {
      return dn.debitNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
             dn.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             dn.invoiceReference.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [supplierDebitNotes, searchQuery]);

  const handlePrintDebitNote = (dn: SupplierDebitNote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Supplier Debit Note - ${dn.debitNoteNumber}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #b91c1c; }
            .details { display: flex; justify-content: space-between; margin: 20px 0; }
            .summary-box { border: 1px solid #ddd; padding: 15px; margin-top: 20px; background-color: #fef2f2; border-radius: 8px; }
            .amount { font-size: 20px; font-weight: bold; color: #b91c1c; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Supplier Debit Note</div>
              <p>Debit Note No: <strong>${dn.debitNoteNumber}</strong></p>
              <p>Issue Date: ${dn.date}</p>
            </div>
            <div style="text-align: right;">
              <h2>Shop Desk ERP</h2>
              <p>Invoice Reference: <strong>${dn.invoiceReference}</strong></p>
            </div>
          </div>
          <div class="details">
            <div>
              <h3>Debited Account:</h3>
              <p><strong>${dn.supplierName}</strong></p>
            </div>
            <div style="text-align: right;">
              <p>Status: <strong style="color: #b91c1c;">ACCOUNT DEBITED</strong></p>
            </div>
          </div>
          <div class="summary-box">
            <h3 style="margin-top: 0; color: #991b1b;">Debit Transaction Details:</h3>
            <p>Reason for Debit: <strong>${dn.reason}</strong></p>
            <p>Debit Value: <span class="amount">₹${(dn.amount ?? 0).toFixed(2)}</span></p>
            ${dn.notes ? `<p><strong>Audit Notes:</strong> ${dn.notes}</p>` : ''}
          </div>
          <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 11px; color: #666;">
            <p>Important: This Debit Note is an official accounting ledger voucher issued to reduce outstanding liabilities towards the supplier. This transaction has been registered and updated on the supplier's chronological statement of account.</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="debit-note-container" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Supplier Debit Notes (DN)</h2>
          <p className="text-xs text-slate-500">Manually issue Debit Notes to deduct cost differences, claims or rebates from supplier accounts.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isCreating ? 'Cancel Note' : 'Create Debit Note'}
        </button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="h-5 w-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {isCreating ? (
        /* Create Debit Note Form */
        <div id="debit-note-creator-card" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-xl mx-auto">
          <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Issue Debit Note Voucher
          </h3>

          {formError && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5" />
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Select Supplier</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(supp => (
                  <option key={supp.id} value={supp.id}>{supp.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Referenced Invoice No.</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2345"
                  value={invoiceReference}
                  onChange={e => setInvoiceReference(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Debit Amount (₹)</label>
                <input
                  type="number"
                  placeholder="₹ Amount"
                  value={amount === 0 ? '' : amount}
                  onChange={e => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Reason for Debit Note</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              >
                <option value="Rate Difference">Rate Difference (Price Overcharged)</option>
                <option value="Discount Received After Booking">Discount / Rebate Claim</option>
                <option value="Shortage/Damaged Stock Unresolved">Shortage or Unreturned Damaged Stock</option>
                <option value="Surcharge Settle Dispute">Tax / Surcharge Dispute</option>
                <option value="Other Financial Adjustments">Other Financial Adjustments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Internal Remarks</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Include complete details on dispute resolutions..."
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>

            <button
              onClick={handleSaveDN}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              Save & Apply Debit Note
            </button>
          </div>
        </div>
      ) : (
        /* Debit Note vouchers history list */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search DN, Supplier or Reference Invoice..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {filteredDNs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm font-semibold">
              No Supplier Debit Notes logged.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {filteredDNs.map(dn => (
                <div key={dn.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 rounded">
                        {dn.debitNoteNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">{dn.date}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{dn.supplierName}</h4>
                    <p className="text-[10px] text-slate-500">Invoice Ref: <span className="font-mono text-slate-700">{dn.invoiceReference}</span></p>
                    <p className="text-[10px] text-slate-500 mt-1">Reason: <span className="font-semibold text-slate-700">{dn.reason}</span></p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-rose-600">₹{(dn.amount ?? 0).toFixed(2)}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedDN(dn)}
                        className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-[10px] px-2 flex items-center gap-1 font-semibold"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </button>
                      <button
                        onClick={() => handlePrintDebitNote(dn)}
                        className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DN Details Modal overlay */}
      {selectedDN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col justify-between">
            <div className="bg-rose-50 px-6 py-4 flex items-center justify-between border-b border-rose-100">
              <div>
                <h3 className="font-bold text-rose-900 text-base">Supplier Debit Note</h3>
                <span className="text-xs font-mono text-rose-600">{selectedDN.debitNoteNumber}</span>
              </div>
              <button onClick={() => setSelectedDN(null)} className="p-1 text-rose-400 hover:bg-rose-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2 rounded-lg bg-rose-50/20 border border-rose-100 p-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold uppercase">Supplier:</span>
                  <span className="font-bold text-slate-800">{selectedDN.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold uppercase">Debit Date:</span>
                  <span className="font-semibold text-slate-700">{selectedDN.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold uppercase">Invoice Ref:</span>
                  <span className="font-mono text-slate-700">{selectedDN.invoiceReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold uppercase">Debit Reason:</span>
                  <span className="font-bold text-rose-700">{selectedDN.reason}</span>
                </div>
              </div>

              {selectedDN.notes && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Dispute Remarks:</p>
                  <p className="p-2.5 bg-slate-50 border border-slate-100 rounded text-slate-600 italic">
                    {selectedDN.notes}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-rose-50/50 p-4 border-t border-rose-100 flex items-center justify-between">
              <span className="text-base font-extrabold text-rose-700">Debit Value: ₹{(selectedDN.amount ?? 0).toFixed(2)}</span>
              <button
                onClick={() => handlePrintDebitNote(selectedDN)}
                className="rounded-lg bg-rose-700 text-white px-3 py-1.5 text-xs font-bold hover:bg-rose-800 flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
