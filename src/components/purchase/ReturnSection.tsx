// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseBill, PurchaseReturn, SupplierCreditNote } from '../../types';
import { Search, Eye, RefreshCw, X, AlertTriangle, Printer, ArrowLeftRight, Check, FileText } from 'lucide-react';

export const ReturnSection: React.FC = () => {
  const { 
    purchases, 
    purchaseReturns, 
    supplierCreditNotes, 
    products, 
    createPurchaseReturn 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseBill | null>(null);
  const [selectedReturnDoc, setSelectedReturnDoc] = useState<PurchaseReturn | null>(null);
  const [selectedCreditNote, setSelectedCreditNote] = useState<SupplierCreditNote | null>(null);
  const [isCreatingReturn, setIsCreatingReturn] = useState(false);

  // Return Form States
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('Damaged Goods');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search active booked invoices
  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return [];
    return purchases.filter(p => {
      return p.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (p.supplierInvoiceNumber && p.supplierInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
             p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    }).slice(0, 5); // limit to top 5 results for sleek dropdown listing
  }, [purchases, searchQuery]);

  const handleSelectInvoice = (inv: PurchaseBill) => {
    setSelectedInvoice(inv);
    setIsCreatingReturn(true);
    setSearchQuery('');
    setFormError('');
    setSuccessMsg('');

    // Initialize return quantities
    const qtys: Record<string, number> = {};
    inv.items.forEach(item => {
      // Find out how many were already returned
      const returnedAlready = purchaseReturns
        .filter(pr => pr.purchaseInvoiceId === inv.id)
        .flatMap(pr => pr.items)
        .filter(it => it.productId === item.productId)
        .reduce((sum, it) => sum + it.quantity, 0);

      const availableToReturn = Math.max(0, item.quantity - returnedAlready);
      qtys[item.productId] = 0; // default to 0 for selection
    });
    setReturnQtys(qtys);
  };

  const handleSaveReturn = () => {
    if (!selectedInvoice) return;
    setFormError('');

    const itemsToReturn: {
      productId: string;
      name: string;
      quantity: number;
      unit: string;
      purchaseRate: number;
      total: number;
    }[] = [];

    let hasZeroReturns = true;

    for (const item of selectedInvoice.items) {
      const rQty = returnQtys[item.productId] || 0;
      if (rQty < 0) {
        setFormError('Return quantity cannot be negative');
        return;
      }

      // Calculate already returned
      const returnedAlready = purchaseReturns
        .filter(pr => pr.purchaseInvoiceId === selectedInvoice.id)
        .flatMap(pr => pr.items)
        .filter(it => it.productId === item.productId)
        .reduce((sum, it) => sum + it.quantity, 0);

      const maxAvailable = item.quantity - returnedAlready;

      if (rQty > maxAvailable) {
        setFormError(`Cannot return more than purchased available quantity (${maxAvailable} ${item.unit} left for ${item.name})`);
        return;
      }

      if (rQty > 0) {
        hasZeroReturns = false;
        itemsToReturn.push({
          productId: item.productId,
          name: item.name,
          quantity: rQty,
          unit: item.unit,
          purchaseRate: item.purchaseRate,
          total: rQty * item.purchaseRate
        });
      }
    }

    if (hasZeroReturns) {
      setFormError('Please enter return quantity for at least one product row');
      return;
    }

    const subtotal = itemsToReturn.reduce((sum, item) => sum + item.total, 0);
    // Since return decreases outstanding, it represents direct return credit value:
    const grandTotal = subtotal; 

    // Create the return note
    createPurchaseReturn({
      purchaseInvoiceId: selectedInvoice.id,
      purchaseInvoiceNumber: selectedInvoice.supplierInvoiceNumber || selectedInvoice.purchaseNumber,
      supplierId: selectedInvoice.supplierId,
      supplierName: selectedInvoice.supplierName,
      date: new Date().toISOString().split('T')[0],
      items: itemsToReturn,
      subtotal,
      grandTotal,
      reason,
      notes
    });

    setSuccessMsg(`Return processed successfully for Invoice ${selectedInvoice.supplierInvoiceNumber || selectedInvoice.purchaseNumber}`);
    setIsCreatingReturn(false);
    setSelectedInvoice(null);
    setReturnQtys({});
  };

  const handlePrintReturn = (doc: PurchaseReturn) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = doc.items.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.purchaseRate.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Return Note - ${doc.returnNumber}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .details { display: flex; justify-content: space-between; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
            .totals { text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Purchase Return Note</div>
              <p>Return Number: <strong>${doc.returnNumber}</strong></p>
              <p>Return Date: ${doc.date}</p>
            </div>
            <div style="text-align: right;">
              <h2>Shop Desk ERP</h2>
              <p>Orig. Invoice Ref: <strong>${doc.purchaseInvoiceNumber}</strong></p>
            </div>
          </div>
          <div class="details">
            <div>
              <h3>Returned To Supplier:</h3>
              <p><strong>${doc.supplierName}</strong></p>
            </div>
            <div style="text-align: right;">
              <p>Reason: <strong style="text-transform: uppercase;">${doc.reason}</strong></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">S.No</th>
                <th>Item Details</th>
                <th style="text-align: center;">Returned Qty</th>
                <th style="text-align: right;">Purchased Rate</th>
                <th style="text-align: right;">Return Credit Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div class="totals">
            <p style="font-size: 18px;">Return Credit Value: ₹${doc.grandTotal.toFixed(2)}</p>
          </div>
          ${doc.notes ? `<div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;"><p><strong>Return Notes:</strong> ${doc.notes}</p></div>` : ''}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintCreditNote = (cn: SupplierCreditNote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = cn.items.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.rate.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Supplier Credit Note - ${cn.creditNoteNumber}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #16a34a; }
            .details { display: flex; justify-content: space-between; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
            .totals { text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Supplier Credit Note</div>
              <p>CN Number: <strong>${cn.creditNoteNumber}</strong></p>
              <p>Issue Date: ${cn.date}</p>
            </div>
            <div style="text-align: right;">
              <h2>Shop Desk ERP</h2>
              <p>Return Note Ref: <strong>${cn.purchaseReturnNumber}</strong></p>
              <p>Invoice Ref: <strong>${cn.invoiceReference}</strong></p>
            </div>
          </div>
          <div class="details">
            <div>
              <h3>Supplier Details:</h3>
              <p><strong>${cn.supplierName}</strong></p>
            </div>
            <div style="text-align: right;">
              <p>CN Status: <strong style="color: #16a34a;">POSTED & BALANCED</strong></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">S.No</th>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Credit Rate</th>
                <th style="text-align: right;">Credit Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div class="totals">
            <p style="font-size: 18px; color: #16a34a;">Credited Balance: ₹${cn.amount.toFixed(2)}</p>
          </div>
          <div style="margin-top: 35px; border-top: 1px solid #ddd; padding-top: 10px;">
            <p><strong>Reason for Credit:</strong> ${cn.reason}</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">This Credit Note has been automatically generated as legal posting against Purchase Return Note ${cn.purchaseReturnNumber} and debited from the supplier's running outstanding ledger account.</p>
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
    <div id="return-section-container" className="space-y-6">
      {/* Alert Notices */}
      {successMsg && (
        <div id="return-success-alert" className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />
            {successMsg}
          </span>
        </div>
      )}

      {formError && (
        <div id="return-error-alert" className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm font-medium text-rose-850 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          {formError}
        </div>
      )}

      {/* Main Panel splits: Left column is search-raise return form, Right Column is historic return ledger list */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Search / Return creation block */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Process Purchase Return</h3>
          
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Search Purchase Invoices</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="search-purchase-return-input"
                  type="text"
                  placeholder="Enter Invoice No., PO, Supplier..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Autocomplete suggestion drop-list */}
              {searchQuery && filteredInvoices.length > 0 && (
                <div id="invoice-suggestions-box" className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 overflow-hidden divide-y divide-slate-100">
                  {filteredInvoices.map(inv => (
                    <button
                      key={inv.id}
                      onClick={() => handleSelectInvoice(inv)}
                      className="w-full p-3 text-left hover:bg-slate-50 text-xs flex flex-col items-start gap-1 transition"
                    >
                      <span className="font-mono font-bold text-slate-800">{inv.supplierInvoiceNumber || inv.purchaseNumber}</span>
                      <span className="font-semibold text-slate-600">{inv.supplierName} ({inv.date})</span>
                      <span className="text-slate-400">Grand Total: ₹{inv.grandTotal} | Balance: ₹{inv.balanceAmount}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isCreatingReturn && selectedInvoice ? (
              /* Create Return Sub-form */
              <div id="active-return-form" className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded">
                    Returning: {selectedInvoice.supplierInvoiceNumber || selectedInvoice.purchaseNumber}
                  </span>
                  <button
                    onClick={() => {
                      setIsCreatingReturn(false);
                      setSelectedInvoice(null);
                    }}
                    className="p-1 rounded text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Items to Return list checkboxes / qty fields */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Enter Return Quantities</h4>
                  {selectedInvoice.items.map(item => {
                    const returnedAlready = purchaseReturns
                      .filter(pr => pr.purchaseInvoiceId === selectedInvoice.id)
                      .flatMap(pr => pr.items)
                      .filter(it => it.productId === item.productId)
                      .reduce((sum, it) => sum + it.quantity, 0);

                    const maxAvailable = Math.max(0, item.quantity - returnedAlready);

                    return (
                      <div key={item.productId} className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                        <span className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5" title={item.name}>
                          <span>{item.name}</span>
                          <span className="text-[10px] text-emerald-600 font-bold font-mono shrink-0">(Stock: {products.find(p => p.id === item.productId)?.stock ?? 0})</span>
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Bought: {item.quantity} (Returned: {returnedAlready})</span>
                          <div className="flex items-center gap-1.5">
                            <span>Return Qty:</span>
                            <input
                              type="number"
                              placeholder={`max ${maxAvailable}`}
                              value={returnQtys[item.productId] || ''}
                              disabled={maxAvailable <= 0}
                              onChange={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setReturnQtys({ ...returnQtys, [item.productId]: val });
                              }}
                              className="w-16 rounded border border-slate-200 p-1 text-center font-bold text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Return Reason</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  >
                    <option value="Damaged Goods">Damaged Goods</option>
                    <option value="Expired Shelf Life">Expired Shelf Life</option>
                    <option value="Excess / Unrequested Stock">Excess / Unrequested Stock</option>
                    <option value="Incorrect Specification">Incorrect Specification</option>
                    <option value="Product Defective / Recalled">Product Defective / Recalled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Return Note / Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Provide details on physical stock returns..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  />
                </div>

                <button
                  onClick={handleSaveReturn}
                  className="w-full rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Post Purchase Return
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                To start, search for an Invoice above and select it.
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Historical List of Returns & Credit Notes */}
        <div className="md:col-span-2 space-y-6">
          {/* Section: Purchase Return Notes list */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Purchase Return Notes ({purchaseReturns.length})</h3>
            {purchaseReturns.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                No purchase returns logged yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {purchaseReturns.map(ret => (
                  <div key={ret.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 rounded">
                          {ret.returnNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">{ret.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-850 text-sm mb-1">{ret.supplierName}</h4>
                      <p className="text-[10px] text-slate-500">Invoice Ref: <span className="font-mono text-slate-700">{ret.purchaseInvoiceNumber}</span></p>
                      <p className="text-[10px] text-slate-500 mt-1">Reason: <span className="font-semibold text-rose-700">{ret.reason}</span></p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">₹{ret.grandTotal.toFixed(2)}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedReturnDoc(ret)}
                          className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-[10px] px-2 flex items-center gap-1 font-semibold"
                        >
                          <Eye className="h-3 w-3" />
                          Details
                        </button>
                        <button
                          onClick={() => handlePrintReturn(ret)}
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

          {/* Section: Supplier Credit Notes list */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Supplier Credit Notes ({supplierCreditNotes.length})</h3>
            {supplierCreditNotes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                No credit notes generated.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {supplierCreditNotes.map(cn => (
                  <div key={cn.id} className="p-4 rounded-xl border border-emerald-100 bg-white shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 rounded">
                          {cn.creditNoteNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">{cn.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-850 text-sm mb-1">{cn.supplierName}</h4>
                      <p className="text-[10px] text-slate-500">Return Ref: <span className="font-mono text-slate-700">{cn.purchaseReturnNumber}</span></p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 rounded">₹{(cn.amount ?? 0).toFixed(2)}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedCreditNote(cn)}
                          className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-[10px] px-2 flex items-center gap-1 font-semibold"
                        >
                          <Eye className="h-3 w-3" />
                          CN Details
                        </button>
                        <button
                          onClick={() => handlePrintCreditNote(cn)}
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
        </div>
      </div>

      {/* Return Doc Detail Modal */}
      {selectedReturnDoc && (
        <div id="return-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Purchase Return Note</h3>
                <span className="text-xs font-mono text-rose-600">{selectedReturnDoc.returnNumber}</span>
              </div>
              <button onClick={() => setSelectedReturnDoc(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg text-[11px]">
                <div>Supplier: <span className="font-bold text-slate-800">{selectedReturnDoc.supplierName}</span></div>
                <div>Date: <span className="font-semibold text-slate-700">{selectedReturnDoc.date}</span></div>
                <div>Invoice Reference: <span className="font-mono text-slate-700">{selectedReturnDoc.purchaseInvoiceNumber}</span></div>
                <div>Reason: <span className="font-semibold text-rose-700">{selectedReturnDoc.reason}</span></div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 border-b border-slate-150">
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReturnDoc.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 font-semibold text-slate-700">{it.name}</td>
                      <td className="p-2 text-center font-bold text-slate-600">{it.quantity} {it.unit}</td>
                      <td className="p-2 text-right">₹{(it.purchaseRate ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-slate-900">₹{(it.total ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-800">Total Credit: ₹{(selectedReturnDoc.grandTotal ?? 0).toFixed(2)}</span>
              <button
                onClick={() => handlePrintReturn(selectedReturnDoc)}
                className="rounded-lg bg-slate-850 text-white px-3 py-1.5 text-xs font-bold hover:bg-slate-750 flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Detail Modal */}
      {selectedCreditNote && (
        <div id="creditnote-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 flex items-center justify-between border-b border-emerald-100">
              <div>
                <h3 className="font-bold text-emerald-900 text-base">Supplier Credit Note</h3>
                <span className="text-xs font-mono text-emerald-700">{selectedCreditNote.creditNoteNumber}</span>
              </div>
              <button onClick={() => setSelectedCreditNote(null)} className="p-1 text-emerald-400 hover:bg-emerald-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/30 p-3 rounded-lg text-[11px] border border-emerald-100">
                <div>Supplier: <span className="font-bold text-slate-800">{selectedCreditNote.supplierName}</span></div>
                <div>Issue Date: <span className="font-semibold text-slate-700">{selectedCreditNote.date}</span></div>
                <div>Return Ref: <span className="font-mono text-slate-700">{selectedCreditNote.purchaseReturnNumber}</span></div>
                <div>Invoice Reference: <span className="font-mono text-slate-700">{selectedCreditNote.invoiceReference}</span></div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 border-b border-slate-150">
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCreditNote.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 font-semibold text-slate-700">{it.name}</td>
                      <td className="p-2 text-center font-bold text-slate-600">{it.quantity} {it.unit}</td>
                      <td className="p-2 text-right">₹{(it.rate ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">₹{(it.total ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] text-slate-400 italic">
                Credit Reason: {selectedCreditNote.reason}
              </div>
            </div>
            <div className="bg-emerald-50/50 p-4 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-sm font-extrabold text-emerald-800">CN Total Amount: ₹{(selectedCreditNote.amount ?? 0).toFixed(2)}</span>
              <button
                onClick={() => handlePrintCreditNote(selectedCreditNote)}
                className="rounded-lg bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold hover:bg-emerald-800 flex items-center gap-1 animate-pulse"
              >
                <Printer className="h-3.5 w-3.5" />
                Print CN Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

