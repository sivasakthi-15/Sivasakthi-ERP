// @ts-nocheck
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bill, BillStatus } from '../types';
import { 
  Search, Calendar, Filter, Printer, Copy, RotateCcw, Trash2, Eye, X, 
  CheckCircle2, AlertCircle, HelpCircle, Edit 
} from 'lucide-react';
import { BillPreview } from './BillPreview';

export const BillHistory: React.FC = () => {
  const { bills, cancelBill, deleteBill, setActiveTab, setEditingBillId } = useApp();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'credit' | 'cancelled'>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Active modal preview state
  const [activePreviewBill, setActivePreviewBill] = useState<Bill | null>(null);

  // Filters calculation
  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerMobile.includes(searchTerm);
    
    const matchesStatus = 
      statusFilter === 'all' || 
      bill.status === statusFilter;

    const matchesDocType = 
      docTypeFilter === 'all' || 
      (bill.docType || 'invoice') === docTypeFilter;

    const matchesDate = !dateFilter || bill.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDocType && matchesDate;
  });

  const handleCancelBill = (billId: string) => {
    const reason = window.prompt('Enter Cancellation Audit Reason:');
    if (reason !== null) {
      if (!reason.trim()) {
        alert('Cancellation reason is required to complete audit transaction reversal.');
        return;
      }
      cancelBill(billId, reason.trim());
    }
  };

  const handleDeleteBill = (billId: string) => {
    if (window.confirm('CRITICAL ACTION: Are you sure you want to delete this invoice? This will wipe the transaction from the ledger entirely.')) {
      deleteBill(billId);
    }
  };

  return (
    <div className="flex-1 bg-[#f9fafb] p-6 overflow-y-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Invoices Ledger</h1>
          <p className="text-xs text-gray-500 mt-1">Audit log of all counter sales, receipts, and client credit records.</p>
        </div>
        <button
          onClick={() => setActiveTab('billing')}
          className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          New Counter Invoice
        </button>
      </div>

      {/* Filter workspace */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search Invoice #, Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-black bg-white"
            />
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Status selector */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Fully Settled (Paid)</option>
              <option value="credit">Pending Debit Ledger (Credit)</option>
              <option value="cancelled">Cancelled Audit Reversed</option>
            </select>
          </div>

          {/* Document Type selector */}
          <div className="relative">
            <select
              value={docTypeFilter}
              onChange={(e: any) => setDocTypeFilter(e.target.value)}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option value="all">All Documents</option>
              <option value="invoice">GST Tax Invoices</option>
              <option value="non_gst">Non-GST Cash Bills</option>
              <option value="quotation">Quotations / Estimates</option>
              <option value="challan">Delivery Challans</option>
              <option value="proforma">Proforma Invoices</option>
              <option value="sales_return">Sales Returns</option>
              <option value="credit_note">Credit Notes</option>
              <option value="debit_note">Debit Notes</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black bg-white cursor-pointer"
            />
          </div>
        </div>

        <div className="text-xs font-mono text-gray-400">
          Showing {filteredBills.length} entries
        </div>
      </div>

      {/* Main Table Ledger */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-10">S No</th>
                <th className="p-3 w-32">Invoice Number</th>
                <th className="p-3 w-28">Date &amp; Time</th>
                <th className="p-3">Customer Profile</th>
                <th className="p-3 w-32 text-center">Document Type</th>
                <th className="p-3 w-28 text-center">Pricing Mode</th>
                <th className="p-3 w-28 text-right">Invoice Amount</th>
                <th className="p-3 w-28 text-center">Status</th>
                <th className="p-3 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                    No matching invoices found in history database.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill, idx) => {
                  const isCancelled = bill.status === 'cancelled';
                  const isCredit = bill.status === 'credit';

                  return (
                    <tr key={bill.id} className="hover:bg-gray-50/50">
                      {/* S No */}
                      <td className="p-3 text-center font-mono text-gray-400 text-[10px]">{idx + 1}</td>

                      {/* Invoice serial */}
                      <td className="p-3 font-mono font-bold text-gray-900">{bill.billNumber}</td>

                      {/* Date */}
                      <td className="p-3 font-mono text-gray-500">
                        <div>{bill.date}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{bill.time}</div>
                      </td>

                      {/* Customer info */}
                      <td className="p-3">
                        <div className="font-bold text-gray-800">{bill.customerName}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Mob: {bill.customerMobile}</div>
                      </td>

                      {/* Doc Type Badge */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          (bill.docType || 'invoice') === 'invoice' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          (bill.docType || 'invoice') === 'non_gst' ? 'bg-gray-50 text-gray-700 border border-gray-150' :
                          (bill.docType || 'invoice') === 'quotation' ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse' :
                          (bill.docType || 'invoice') === 'challan' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          (bill.docType || 'invoice') === 'proforma' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          (bill.docType || 'invoice') === 'sales_return' ? 'bg-red-50 text-red-700 border border-red-100' :
                          (bill.docType || 'invoice') === 'credit_note' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {(bill.docType || 'invoice').replace('_', ' ')}
                        </span>
                      </td>

                      {/* Bill type */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                          bill.billType === 'contractor' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {bill.billType}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="p-3 text-right font-mono font-extrabold text-gray-900">
                        ₹{(bill.grandTotal ?? 0).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCancelled 
                            ? 'bg-red-50 text-red-700 border border-red-150' 
                            : isCredit 
                            ? 'bg-amber-50 text-amber-700 border border-amber-150 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                        }`}>
                          {bill.status}
                        </span>
                        {bill.cancelledReason && (
                          <div className="text-[9px] text-red-500 font-medium mt-1 truncate max-w-[120px]" title={bill.cancelledReason}>
                            Reason: {bill.cancelledReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActivePreviewBill(bill)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black cursor-pointer"
                            title="Preview Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => {
                                setEditingBillId(bill.id);
                                setActiveTab('billing');
                              }}
                              className="p-1.5 hover:bg-indigo-50 rounded text-gray-400 hover:text-indigo-600 cursor-pointer"
                              title="Edit/Update Bill"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {!isCancelled && (
                            <button
                              onClick={() => handleCancelBill(bill.id)}
                              className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 cursor-pointer"
                              title="Cancel &amp; Reverse Stock"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-700 cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Invoice Modal Overlay */}
      {activePreviewBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-150 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150 shrink-0">
              <h3 className="text-sm font-bold text-gray-900">Tax Invoice details ({activePreviewBill.billNumber})</h3>
              <button onClick={() => setActivePreviewBill(null)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <BillPreview bill={activePreviewBill} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

