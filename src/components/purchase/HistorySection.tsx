// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseBill } from '../../types';
import { Search, Eye, Calendar, Printer, X, FileText, ArrowRight, ShieldCheck, Trash2 } from 'lucide-react';

interface HistorySectionProps {
  onEditPurchase?: (purchase: PurchaseBill) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ onEditPurchase }) => {
  const { 
    purchases, 
    payments, 
    purchaseReturns, 
    supplierCreditNotes, 
    auditLogs,
    deletePurchase
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseBill | null>(null);

  // Date Filtering Helpers
  const dateRanges = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const weekAgoDate = new Date();
    weekAgoDate.setDate(weekAgoDate.getDate() - 7);
    const weekAgo = weekAgoDate.toISOString().split('T')[0];

    const monthAgoDate = new Date();
    monthAgoDate.setDate(monthAgoDate.getDate() - 30);
    const monthAgo = monthAgoDate.toISOString().split('T')[0];

    return { today, yesterday, weekAgo, monthAgo };
  }, []);

  // Filter Booked Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      // 1. General search (Invoice number, reference, supplier name)
      const matchesGeneral = 
        p.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.supplierInvoiceNumber && p.supplierInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Product name filter (does this bill contain this product name?)
      const matchesProduct = !productQuery ? true : p.items.some(it => 
        it.name.toLowerCase().includes(productQuery.toLowerCase())
      );

      // 3. Date shortcuts filter
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = p.date === dateRanges.today;
      } else if (dateFilter === 'yesterday') {
        matchesDate = p.date === dateRanges.yesterday;
      } else if (dateFilter === 'week') {
        matchesDate = p.date >= dateRanges.weekAgo;
      } else if (dateFilter === 'month') {
        matchesDate = p.date >= dateRanges.monthAgo;
      } else if (dateFilter === 'custom') {
        const start = customStartDate ? p.date >= customStartDate : true;
        const end = customEndDate ? p.date <= customEndDate : true;
        matchesDate = start && end;
      }

      return matchesGeneral && matchesProduct && matchesDate;
    });
  }, [purchases, searchQuery, productQuery, dateFilter, customStartDate, customEndDate, dateRanges]);

  // Extract Audit Trails for selected Purchase
  const activeInvoiceAudit = useMemo(() => {
    if (!selectedInvoice) return [];
    // Filter global audit logs that mention this purchase number, supplier invoice number or supplier name
    const pNo = selectedInvoice.purchaseNumber;
    const sNo = selectedInvoice.supplierInvoiceNumber || '';
    const supp = selectedInvoice.supplierName;

    return auditLogs.filter(log => {
      const desc = log.details.toLowerCase();
      return desc.includes(pNo.toLowerCase()) || 
             (sNo && desc.includes(sNo.toLowerCase())) ||
             desc.includes(supp.toLowerCase());
    });
  }, [selectedInvoice, auditLogs]);

  // Associated Returns / Credit notes for selected Purchase
  const activeInvoiceReturns = useMemo(() => {
    if (!selectedInvoice) return [];
    const invNo = selectedInvoice.supplierInvoiceNumber || selectedInvoice.purchaseNumber;
    return purchaseReturns.filter(pr => pr.purchaseInvoiceNumber === invNo || pr.purchaseInvoiceId === selectedInvoice.id);
  }, [selectedInvoice, purchaseReturns]);

  const handlePrintReceipt = (bill: PurchaseBill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = bill.items.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.purchaseRate.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.gstPercent}%</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Inward Invoice - ${bill.purchaseNumber}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .details { display: flex; justify-content: space-between; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 13px; }
            .totals { text-align: right; margin-top: 20px; font-size: 14px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Purchase Inward Bill</div>
              <p>Invoice Ref: <strong>${bill.supplierInvoiceNumber || 'N/A'}</strong></p>
              <p>Booking Date: ${bill.date}</p>
            </div>
            <div style="text-align: right;">
              <h2>Shop Desk ERP</h2>
              <p>System Purchase No: <strong>${bill.purchaseNumber}</strong></p>
              <p>Payment Mode: <strong>${bill.paymentMode}</strong></p>
            </div>
          </div>
          <div class="details">
            <div>
              <h3>Supplier Details:</h3>
              <p><strong>${bill.supplierName}</strong></p>
            </div>
            <div style="text-align: right;">
              <p>Outstanding Settle: <strong>₹${bill.balanceAmount.toFixed(2)}</strong></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">S.No</th>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Cost Rate</th>
                <th style="text-align: center;">GST %</th>
                <th style="text-align: right;">Total (Inc. GST)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
            <div>
              ${bill.notes ? `<p><strong>Notes:</strong> ${bill.notes}</p>` : ''}
            </div>
            <div class="totals">
              <p>Taxable Subtotal: ₹${bill.subtotal.toFixed(2)}</p>
              <p>GST Total: ₹${bill.gstAmount.toFixed(2)}</p>
              ${bill.discountAmount ? `<p>Discount: -₹${bill.discountAmount.toFixed(2)}</p>` : ''}
              ${bill.transportCharges ? `<p>Transport: ₹${bill.transportCharges.toFixed(2)}</p>` : ''}
              ${bill.roundOff ? `<p>Round Off: ₹${bill.roundOff.toFixed(2)}</p>` : ''}
              <p style="font-size: 18px; font-weight: bold;">Grand Total: ₹${bill.grandTotal.toFixed(2)}</p>
              <p style="color: #16a34a; font-weight: bold;">Paid Amount: ₹${bill.paidAmount.toFixed(2)}</p>
            </div>
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
    <div id="history-section-container" className="space-y-6">
      {/* Dynamic Multi-Filter Toolbar */}
      <div id="history-filters-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Search & Filter Inward bills</h3>
        
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice No., Supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product name..."
              value={productQuery}
              onChange={e => setProductQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-1.5 text-xs focus:outline-none"
              />
              <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-1.5 text-xs focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Booked Purchases Table list */}
      <div id="purchases-table-box" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-150">
              <th className="p-3 text-center w-28">Date</th>
              <th className="p-3">Purchase Inward No.</th>
              <th className="p-3">Supplier Invoice Ref</th>
              <th className="p-3">Supplier Name</th>
              <th className="p-3">Payment Mode</th>
              <th className="p-3 text-right">Grand Total (₹)</th>
              <th className="p-3 text-right">Balance Due (₹)</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 font-medium bg-slate-50/50">
                  <FileText className="mx-auto h-12 w-12 text-slate-300 mb-2 animate-pulse" />
                  No booked purchases match current search parameters.
                </td>
              </tr>
            ) : (
              filteredPurchases.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50/30">
                  <td className="p-3 text-center text-slate-500">{bill.date}</td>
                  <td className="p-3 font-mono text-emerald-600">{bill.purchaseNumber}</td>
                  <td className="p-3 font-mono text-slate-500">{bill.supplierInvoiceNumber || 'N/A'}</td>
                  <td className="p-3 text-slate-800">{bill.supplierName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      bill.paymentMode === 'Credit' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {bill.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-900 font-extrabold">₹{bill.grandTotal.toFixed(2)}</td>
                  <td className="p-3 text-right font-extrabold text-rose-600">₹{bill.balanceAmount.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedInvoice(bill)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        title="View Details & Audit Logs"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {onEditPurchase && (
                        <button
                          onClick={() => onEditPurchase(bill)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          title="Edit Purchase"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deletePurchase(bill.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        title="Delete Purchase"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(bill)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        title="Print A4 Bill"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Details & Immutable Audit Drawer Overlay */}
      {selectedInvoice && (
        <div id="invoice-detail-drawer" className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-4">
          <div className="h-full w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Purchase Inward Bill</h3>
                  <span className="text-xs font-mono text-emerald-600">{selectedInvoice.purchaseNumber}</span>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
                {/* Header General Meta */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase">Supplier Name</p>
                    <p className="font-extrabold text-slate-800 mt-1">{selectedInvoice.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase">Supplier Invoice No.</p>
                    <p className="font-mono text-slate-800 font-bold mt-1">{selectedInvoice.supplierInvoiceNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase">Booking Date</p>
                    <p className="font-medium text-slate-700 mt-1">{selectedInvoice.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase">Payment Settlement Mode</p>
                    <span className="inline-block mt-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                      {selectedInvoice.paymentMode}
                    </span>
                  </div>
                </div>

                {/* Line Items Grid */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wider">Product Line Items</h4>
                  <div className="overflow-hidden rounded-lg border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-100">
                          <th className="p-2.5">Product</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Cost (Excl.)</th>
                          <th className="p-2.5 text-center">GST</th>
                          <th className="p-2.5 text-right font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedInvoice.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-semibold text-slate-800">{it.name}</td>
                            <td className="p-2.5 text-center font-bold text-slate-600">{it.quantity} {it.unit}</td>
                            <td className="p-2.5 text-right">₹{it.purchaseRate.toFixed(2)}</td>
                            <td className="p-2.5 text-center">{it.gstPercent}%</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">₹{it.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Associated Returns */}
                {activeInvoiceReturns.length > 0 && (
                  <div className="border border-rose-100 rounded-lg p-3 bg-rose-50/10 space-y-2">
                    <h4 className="text-xs font-bold uppercase text-rose-800 flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Associated Returns Credit Note(s)
                    </h4>
                    {activeInvoiceReturns.map(ret => (
                      <div key={ret.id} className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono font-bold text-rose-600">{ret.returnNumber}</span>
                          <span className="text-slate-500 ml-2">({ret.date})</span>
                        </div>
                        <span className="font-extrabold text-rose-700">₹{ret.grandTotal.toFixed(2)} Credit</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Immutable Audit Trail Logs */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-600 flex items-center gap-1.5 tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Immutable Invoice Audit Trails (Section 14)
                  </h4>
                  {activeInvoiceAudit.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No direct modifications found in audit records.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                      {activeInvoiceAudit.map(log => (
                        <div key={log.id} className="text-[11px] border-l-2 border-slate-300 pl-3 py-1 bg-slate-50/50 rounded-r-lg">
                          <p className="text-slate-500 font-semibold">{log.createdAt} | {log.action}</p>
                          <p className="text-slate-700 mt-0.5">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs space-y-1">
                <div>Subtotal: ₹{selectedInvoice.subtotal.toFixed(2)} | GST: ₹{selectedInvoice.gstAmount.toFixed(2)}</div>
                <div className="text-sm font-extrabold text-slate-900">Grand Total Payable: ₹{selectedInvoice.grandTotal.toFixed(2)}</div>
              </div>
              <button
                onClick={() => handlePrintReceipt(selectedInvoice)}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// help linter with missing icon imports
import { RefreshCw } from 'lucide-react';

