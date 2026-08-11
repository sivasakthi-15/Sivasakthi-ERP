// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Bill, Product, SalesReturn } from '../types';
import { 
  Search, ArrowLeft, RefreshCw, Printer, Trash2, ArrowUpRight, ArrowDownLeft, 
  FileText, CheckCircle2, AlertCircle, ShoppingBag, Plus, Sparkles, Receipt, 
  Calendar, Info, Landmark, Check, X, ChevronRight, Filter, AlertTriangle
} from 'lucide-react';

export const SalesReturnModule: React.FC = () => {
  const { 
    bills, products, salesReturns, createSalesReturn, currentBusiness, businessDetails 
  } = useApp();

  // Navigation and Tab States
  // 'search' | 'create_return' | 'return_history' | 'view_receipt'
  const [moduleMode, setModuleMode] = useState<'search' | 'create_return' | 'return_history' | 'view_receipt'>('search');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Selected invoice for creating return
  const [activeBill, setActiveBill] = useState<Bill | null>(null);
  
  // Return items state: map of product ID to return quantity
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('Customer Request');
  const [customReason, setCustomReason] = useState('');
  const [refundMode, setRefundMode] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit_adjustment' | 'no_refund'>('cash');

  // Exchange items state: list of { product: Product, quantity: number, rate: number }
  const [exchangeItems, setExchangeItems] = useState<{ product: Product; quantity: number; rate: number }[]>([]);
  const [exchangeSearchQuery, setExchangeSearchQuery] = useState('');

  // Currently viewed past return
  const [viewedReturn, setViewedReturn] = useState<SalesReturn | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Print format for return receipt
  const [printTemplate, setPrintTemplate] = useState<'a4' | 'thermal'>('a4');

  // Return standard reasons
  const STANDARD_REASONS = [
    'Customer Request',
    'Damaged Product',
    'Defective Item',
    'Wrong Item Delivered',
    'Expired Stock',
    'Price Difference Correction',
    'Other'
  ];

  // Helper: check if date falls in quick ranges
  const isDateInFilter = (dateStr: string) => {
    if (selectedDateFilter === 'all') return true;
    const itemDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (selectedDateFilter === 'today') {
      const todayStr = today.toISOString().split('T')[0];
      return dateStr === todayStr;
    }
    if (selectedDateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return dateStr === yesterdayStr;
    }
    if (selectedDateFilter === 'this_week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return itemDate >= startOfWeek;
    }
    if (selectedDateFilter === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return itemDate >= startOfMonth;
    }
    if (selectedDateFilter === 'custom') {
      if (!customStartDate) return true;
      const start = new Date(customStartDate);
      start.setHours(0,0,0,0);
      const end = customEndDate ? new Date(customEndDate) : new Date();
      end.setHours(23,59,59,999);
      return itemDate >= start && itemDate <= end;
    }
    return true;
  };

  // 1. FILTERED INVOICES FOR SEARCH
  const searchedBills = useMemo(() => {
    // Only search active/saved invoice documents
    return bills.filter(bill => {
      if (bill.status === 'cancelled') return false;
      
      // Match business context
      if (currentBusiness && bill.shopId !== currentBusiness.id) return false;

      // Filter by date
      if (!isDateInFilter(bill.date)) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesNo = bill.billNumber.toLowerCase().includes(query);
        const matchesCust = bill.customerName.toLowerCase().includes(query);
        const matchesMobile = bill.customerMobile.toLowerCase().includes(query);
        const matchesDate = bill.date.includes(query);
        return matchesNo || matchesCust || matchesMobile || matchesDate;
      }

      return true;
    });
  }, [bills, currentBusiness, searchTerm, selectedDateFilter, customStartDate, customEndDate]);

  // 2. FILTERED PAST RETURNS FOR HISTORY
  const filteredPastReturns = useMemo(() => {
    return salesReturns.filter(sr => {
      if (currentBusiness && sr.shopId !== currentBusiness.id) return false;

      if (historySearchTerm.trim() !== '') {
        const query = historySearchTerm.toLowerCase();
        return (
          sr.returnNumber.toLowerCase().includes(query) ||
          sr.originalBillNumber.toLowerCase().includes(query) ||
          sr.customerName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [salesReturns, currentBusiness, historySearchTerm]);

  // 3. RETRIEVE PAST RETURN QUANTITIES FOR ACTIVE INVOICE
  const previousReturnQuantitiesForActiveBill = useMemo(() => {
    if (!activeBill) return {};
    const qtys: Record<string, number> = {};
    
    // Find all returns linked to this bill
    const linkedReturns = salesReturns.filter(
      sr => sr.originalBillId === activeBill.id
    );

    linkedReturns.forEach(sr => {
      sr.items.forEach(item => {
        qtys[item.productId] = (qtys[item.productId] || 0) + item.quantity;
      });
    });

    return qtys;
  }, [activeBill, salesReturns]);

  // Handle invoice click to open return form
  const handleSelectBillForReturn = (bill: Bill) => {
    setActiveBill(bill);
    setReturnReason('Customer Request');
    setCustomReason('');
    setRefundMode(bill.customerId === 'c_walkin' ? 'cash' : 'credit_adjustment');
    setExchangeItems([]);
    setExchangeSearchQuery('');
    
    // Initialize return quantities to 0
    const initialQtys: Record<string, number> = {};
    bill.items.forEach(item => {
      initialQtys[item.productId] = 0;
    });
    setReturnQuantities(initialQtys);
    setModuleMode('create_return');
  };

  // Adjust return quantity for an item
  const handleAdjustReturnQty = (productId: string, delta: number, maxAllowed: number) => {
    setReturnQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(maxAllowed, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  // Add Product to Exchange List
  const handleAddExchangeProduct = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Warning: ${product.name} is currently out of stock!`);
    }
    
    // Check if already in list
    const exists = exchangeItems.find(item => item.product.id === product.id);
    if (exists) {
      setExchangeItems(prev => prev.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setExchangeItems(prev => [...prev, { product, quantity: 1, rate: product.sellingPrice }]);
    }
    setExchangeSearchQuery('');
  };

  // Remove Product from Exchange List
  const handleRemoveExchangeProduct = (productId: string) => {
    setExchangeItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Adjust Exchange Product Quantity
  const handleAdjustExchangeQty = (productId: string, delta: number) => {
    setExchangeItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Calculation Block for the active return process
  const returnTotals = useMemo(() => {
    if (!activeBill) return { subtotal: 0, cgst: 0, sgst: 0, total: 0 };
    
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let total = 0;

    activeBill.items.forEach(item => {
      const retQty = returnQuantities[item.productId] || 0;
      if (retQty > 0) {
        // Calculate proportional totals
        const itemRatio = retQty / item.quantity;
        subtotal += item.taxableValue * itemRatio;
        cgst += item.cgst * itemRatio;
        sgst += item.sgst * itemRatio;
        total += item.total * itemRatio;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      total: Math.round(total)
    };
  }, [activeBill, returnQuantities]);

  // Exchange calculations
  const exchangeTotals = useMemo(() => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let total = 0;

    exchangeItems.forEach(item => {
      const isContractor = activeBill?.billType === 'contractor';
      const rate = item.rate;
      const qty = item.quantity;
      const gstPercent = item.product.gstPercent;

      let itemTotal = 0;
      let itemTaxable = 0;
      let itemTax = 0;

      if (isContractor) {
        // Exclusive
        itemTaxable = rate * qty;
        itemTax = itemTaxable * (gstPercent / 100);
        itemTotal = itemTaxable + itemTax;
      } else {
        // Inclusive
        itemTotal = rate * qty;
        itemTaxable = itemTotal / (1 + gstPercent / 100);
        itemTax = itemTotal - itemTaxable;
      }

      subtotal += itemTaxable;
      cgst += itemTax / 2;
      sgst += itemTax / 2;
      total += itemTotal;
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      total: Math.round(total)
    };
  }, [exchangeItems, activeBill]);

  const differenceAmount = exchangeTotals.total - returnTotals.total;

  // Filtered product suggestions for exchange search
  const exchangeProductSuggestions = useMemo(() => {
    if (!exchangeSearchQuery.trim()) return [];
    const query = exchangeSearchQuery.toLowerCase();
    return products.filter(
      p => p.isActive !== false &&
      (p.name.toLowerCase().includes(query) || p.productCode.toLowerCase().includes(query))
    ).slice(0, 5);
  }, [products, exchangeSearchQuery]);

  // Process Sales Return Submit
  const handleProcessSalesReturn = () => {
    if (!activeBill) return;

    // Build the array of returned items
    const returnedItems = activeBill.items.map(item => {
      const qty = returnQuantities[item.productId] || 0;
      if (qty <= 0) return null;

      // Calculate proportional taxable value
      const ratio = qty / item.quantity;
      return {
        productId: item.productId,
        name: item.name,
        quantity: qty,
        unit: item.unit,
        rate: item.rate,
        gstPercent: item.gstPercent,
        taxableValue: Math.round(item.taxableValue * ratio * 100) / 100,
        total: Math.round(item.total * ratio)
      };
    }).filter(Boolean) as any[];

    if (returnedItems.length === 0) {
      alert('Error: Please select at least one item to return.');
      return;
    }

    // Build exchange items
    const formattedExchangeItems = exchangeItems.map(item => {
      const isContractor = activeBill.billType === 'contractor';
      const rate = item.rate;
      const qty = item.quantity;
      const gstPercent = item.product.gstPercent;

      let itemTotal = 0;
      let itemTaxable = 0;

      if (isContractor) {
        itemTaxable = rate * qty;
        itemTotal = itemTaxable * (1 + gstPercent / 100);
      } else {
        itemTotal = rate * qty;
        itemTaxable = itemTotal / (1 + gstPercent / 100);
      }

      return {
        productId: item.product.id,
        name: item.product.name,
        quantity: qty,
        unit: item.product.unit,
        rate,
        gstPercent,
        taxableValue: Math.round(itemTaxable * 100) / 100,
        total: Math.round(itemTotal)
      };
    });

    const finalReason = returnReason === 'Other' ? (customReason || 'Other reason') : returnReason;

    // Create the payload
    const returnPayload = {
      originalBillId: activeBill.id,
      originalBillNumber: activeBill.billNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      customerId: activeBill.customerId,
      customerName: activeBill.customerName,
      items: returnedItems,
      grandTotal: returnTotals.total,
      reason: finalReason,
      
      exchangeItems: formattedExchangeItems.length > 0 ? formattedExchangeItems : undefined,
      exchangeTotal: formattedExchangeItems.length > 0 ? exchangeTotals.total : undefined,
      differenceAmount: differenceAmount,
      refundMode: refundMode,
      refundAmount: differenceAmount < 0 ? Math.abs(differenceAmount) : 0,
      user: 'Administrator'
    };

    // Trigger state changes in Context
    createSalesReturn(returnPayload);

    // Select the new return for viewing immediately in the Receipt format
    // Retrieve the newly added return (it will be at index 0 of list since we unshift)
    // To be safe, construct it here with the projected receipt number
    const tempSrNumber = `SR-${(salesReturns.filter(sr => sr.shopId === currentBusiness?.id).length + 1).toString().padStart(6, '0')}`;
    const pastReturnObject: SalesReturn = {
      ...returnPayload,
      id: 'sr_temp',
      shopId: currentBusiness?.id || 'all',
      returnNumber: tempSrNumber,
      creditNoteNumber: refundMode === 'credit_adjustment' ? `CN-${(salesReturns.filter(sr => sr.shopId === currentBusiness?.id && sr.refundMode === 'credit_adjustment').length + 1).toString().padStart(6, '0')}` : undefined,
      creditNoteAmount: refundMode === 'credit_adjustment' ? Math.max(0, -differenceAmount) : undefined
    };

    setViewedReturn(pastReturnObject);
    setModuleMode('view_receipt');
  };

  const handlePrint = () => {
    if (printTemplate === 'thermal') {
      const element = document.getElementById('thermal-print-element');
      if (!element) { alert('Print content not found.'); return; }
      const printWindow = window.open('', '_blank', 'width=350,height=600');
      if (!printWindow) { alert('Unable to open print window.'); return; }
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map((s) => s.outerHTML).join('');
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <base href="${window.location.href}" />
            <title>Thermal Receipt</title>
            ${styles}
            <style>
              @page { margin: 0; size: 80mm auto; }
              body { margin: 0; padding: 0; width: 80mm; min-width: 80mm; overflow: visible; font-family: monospace; background: white !important; }
              #thermal-print-element { width: 100% !important; margin: 0 !important; max-width: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
            </style>
          </head>
          <body></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.document.body.appendChild(element.cloneNode(true));
      const print = async () => {
        await printWindow.document.fonts?.ready;
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
      if (printWindow.document.readyState === 'complete') { void print(); }
      else { printWindow.addEventListener('load', () => void print(), { once: true }); }
    } else {
      const element = document.getElementById('a4-print-element');
      if (!element) { alert('Print content not found.'); return; }
      const printWindow = window.open('', '_blank', 'width=900,height=1200');
      if (!printWindow) { alert('Unable to open print window.'); return; }
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((s) => s.outerHTML).join('');
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <base href="${window.location.href}" />
            <title>Invoice</title>
              ${styles}
              <style>
                @page { size: A4 portrait; margin: 10mm; }
                body { margin: 0; padding: 0; background: white !important; }
                #a4-print-element { width: 100% !important; max-width: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
              </style>
            </head>
          <body></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.document.body.appendChild(element.cloneNode(true));
      const print = async () => {
        const links = Array.from(printWindow.document.querySelectorAll('link[rel="stylesheet"]'));
        await Promise.all(links.map((link: any) => {
          if (link.sheet) return Promise.resolve();
          return new Promise(resolve => { link.onload = resolve; link.onerror = resolve; });
        }));
        await printWindow.document.fonts?.ready;
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
      if (printWindow.document.readyState === 'complete') { void print(); }
      else { printWindow.addEventListener('load', () => void print(), { once: true }); }
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto p-4 md:p-6 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-500" />
            Post-Sales Returns & Credit Notes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Search sales invoices, manage itemized returns or product exchanges, and issue refunds or credit adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setModuleMode('search');
              setActiveBill(null);
            }}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-150 flex items-center justify-center gap-2 ${
              moduleMode === 'search' || moduleMode === 'create_return'
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Search className="w-4 h-4" />
            New Return
          </button>
          <button
            onClick={() => {
              setModuleMode('return_history');
            }}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-150 flex items-center justify-center gap-2 ${
              moduleMode === 'return_history'
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Return Registry ({salesReturns.filter(sr => sr.shopId === currentBusiness?.id).length})
          </button>
        </div>
      </div>

      {/* ----------------- MODE: SEARCH INVOICES ----------------- */}
      {moduleMode === 'search' && (
        <div className="space-y-6">
          {/* Quick Filter Sidebar + Search Bar Layout */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice by number, customer name, mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Date Filters */}
              <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl">
                {(['all', 'today', 'yesterday', 'this_week', 'this_month', 'custom'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedDateFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all duration-150 ${
                      selectedDateFilter === filter
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {filter === 'this_week' ? 'This Week' : filter === 'this_month' ? 'This Month' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs if 'custom' is selected */}
            {selectedDateFilter === 'custom' && (
              <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setSelectedDateFilter('all');
                  }}
                  className="text-xs text-red-500 hover:underline ml-auto"
                >
                  Clear dates
                </button>
              </div>
            )}
          </div>

          {/* Invoices List Results */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-150 bg-gray-50/50 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                Invoice Documents Found ({searchedBills.length})
              </span>
              <span className="text-xs text-gray-400">Click on an invoice to start return process</span>
            </div>

            {searchedBills.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No invoice documents found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search query, clearing date filters, or choosing a different date range.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-150">
                {searchedBills.map((bill) => {
                  // Calculate returned count
                  const linkedSrs = salesReturns.filter(sr => sr.originalBillId === bill.id);
                  const returnSum = linkedSrs.reduce((acc, curr) => acc + curr.items.reduce((sum, item) => sum + item.quantity, 0), 0);

                  return (
                    <div
                      key={bill.id}
                      onClick={() => handleSelectBillForReturn(bill)}
                      className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                      id={`invoice-item-${bill.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-black group-hover:text-blue-600 transition-colors">
                            {bill.billNumber}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                            bill.billType === 'contractor' 
                              ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {bill.billType === 'contractor' ? 'Contractor' : 'Retail'}
                          </span>
                          {returnSum > 0 && (
                            <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-medium">
                              Partially Returned
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{bill.customerName}</span>
                          <span>•</span>
                          <span>{bill.customerMobile}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {bill.date}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">
                            ₹{bill.grandTotal.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-gray-400 capitalize">
                            Mode: {bill.paymentMode}
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-gray-100 group-hover:bg-black group-hover:text-white rounded-full flex items-center justify-center text-gray-400 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- MODE: CREATE SALES RETURN FORM ----------------- */}
      {moduleMode === 'create_return' && activeBill && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Original Invoice items details & Return quantities selection */}
          <div className="lg:col-span-8 space-y-6">
            <button
              onClick={() => {
                setModuleMode('search');
                setActiveBill(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </button>

            {/* Bill Info Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Linked Invoice
                  </span>
                  <h2 className="text-lg font-extrabold text-gray-900 font-mono">
                    {activeBill.billNumber}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Billed on {activeBill.date} {activeBill.time || ''}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Customer Details
                  </span>
                  <p className="text-sm font-bold text-gray-900">{activeBill.customerName}</p>
                  <p className="text-xs text-gray-500">{activeBill.customerMobile}</p>
                </div>
              </div>
            </div>

            {/* Itemized Selection Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-150 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-gray-500" />
                  Select Return Quantities
                </h3>
              </div>
              <div className="overflow-x-auto" id="return-registry-print">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-wider border-b border-gray-150">
                      <th className="p-4">Product Name</th>
                      <th className="p-4 text-center">Billed Qty</th>
                      <th className="p-4 text-center">Prev Ret</th>
                      <th className="p-4 text-center">Max Eligible</th>
                      <th className="p-4 text-right">Rate (₹)</th>
                      <th className="p-4 text-center w-36">Return Qty</th>
                      <th className="p-4 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-xs">
                    {activeBill.items.map((item) => {
                      const prevRet = previousReturnQuantitiesForActiveBill[item.productId] || 0;
                      const maxAllowed = Math.max(0, item.quantity - prevRet);
                      const currentRetQty = returnQuantities[item.productId] || 0;
                      const proportionalTotal = Math.round((currentRetQty / item.quantity) * item.total);

                      return (
                        <tr key={item.productId} className={`hover:bg-gray-50/50 ${currentRetQty > 0 ? 'bg-amber-50/20' : ''}`}>
                          <td className="p-4 font-medium text-gray-900">
                            <div>{item.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">Code: {item.hsnCode || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-center font-mono text-gray-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-4 text-center font-mono">
                            {prevRet > 0 ? (
                              <span className="text-red-500 font-medium">
                                {prevRet} {item.unit}
                              </span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-mono font-semibold text-gray-900">
                            {maxAllowed} {item.unit}
                          </td>
                          <td className="p-4 text-right font-mono text-gray-700">
                            ₹{(item.rate ?? 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            {maxAllowed <= 0 ? (
                              <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                                Fully Returned
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustReturnQty(item.productId, -1, maxAllowed)}
                                  className="w-7 h-7 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 flex items-center justify-center font-extrabold text-gray-600 select-none shadow-sm"
                                  disabled={currentRetQty <= 0}
                                >
                                  -
                                </button>
                                <span className="w-8 font-bold font-mono text-center text-sm">
                                  {currentRetQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustReturnQty(item.productId, 1, maxAllowed)}
                                  className="w-7 h-7 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 flex items-center justify-center font-extrabold text-gray-600 select-none shadow-sm"
                                  disabled={currentRetQty >= maxAllowed}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-gray-900">
                            ₹{proportionalTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Exchange Block */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-150 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Product Exchange (Optional)
                </h3>
                <span className="text-xs text-gray-400">Add replacement / new items taken by customer</span>
              </div>
              <div className="p-5 space-y-4">
                {/* Search Bar for Exchange */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search replacement products from Master Catalogue..."
                    value={exchangeSearchQuery}
                    onChange={(e) => setExchangeSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                  />
                  {exchangeSearchQuery && (
                    <button 
                      onClick={() => setExchangeSearchQuery('')} 
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Dropdown Suggestions */}
                  {exchangeProductSuggestions.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-100 overflow-hidden">
                      {exchangeProductSuggestions.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleAddExchangeProduct(prod)}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="text-xs font-semibold text-gray-900">
                              {prod.name} <span className={`text-[10px] font-bold ${prod.stock <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>(Stock: {prod.stock})</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              Code: {prod.productCode} • Stock: {prod.stock} {prod.unit}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">₹{prod.sellingPrice}</span>
                            <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-md font-medium">Add</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exchange Items Table List */}
                {exchangeItems.length > 0 ? (
                  <div className="border border-gray-150 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100/50 text-gray-500 font-bold text-[10px] uppercase border-b border-gray-150">
                          <th className="p-3">Product</th>
                          <th className="p-3 text-center">In-Stock</th>
                          <th className="p-3 text-center w-28">Quantity</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {exchangeItems.map((item) => {
                          const isContractor = activeBill.billType === 'contractor';
                          const itemVal = item.rate * item.quantity;
                          
                          return (
                            <tr key={item.product.id} className="hover:bg-gray-50/30">
                              <td className="p-3 font-medium text-gray-900">
                                <div>{item.product.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{item.product.productCode}</div>
                              </td>
                              <td className="p-3 text-center font-mono text-gray-500">
                                {item.product.stock} {item.product.unit}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustExchangeQty(item.product.id, -1)}
                                    className="w-6 h-6 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold font-mono w-6 text-center">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustExchangeQty(item.product.id, 1)}
                                    className="w-6 h-6 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono">
                                <input
                                  type="number"
                                  value={item.rate}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setExchangeItems(prev => prev.map(ei => ei.product.id === item.product.id ? { ...ei, rate: val } : ei));
                                  }}
                                  className="w-20 text-right font-mono bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5"
                                />
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-gray-900">
                                ₹{itemVal.toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExchangeProduct(item.product.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                    No exchange products selected. If the customer is choosing other products instead, add them here.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Return summary, reason, refund mode & finalize trigger */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Status / Warning */}
            {returnTotals.total === 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-xs text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Select Return Quantities First</h4>
                  <p className="mt-0.5 leading-relaxed text-amber-700">
                    To enable return operations, increase the return quantity of at least one item in the list.
                  </p>
                </div>
              </div>
            )}

            {/* Return Reason Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Return Reasons & Details
              </h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Return Cause *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  >
                    {STANDARD_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {returnReason === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Specify Custom Reason *
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Input brief description..."
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Refund / Payment Settlement Block */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Refund / Settlement Options
              </h3>

              <div className="space-y-3 text-xs">
                {/* Difference Amount block */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-150 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase">
                    <span>Net Settlement</span>
                    <span>Status</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className={`text-lg font-extrabold ${differenceAmount < 0 ? 'text-red-600' : differenceAmount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      ₹{Math.abs(differenceAmount).toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      differenceAmount < 0 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : differenceAmount > 0 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {differenceAmount < 0 ? 'Refund Due to Cust' : differenceAmount > 0 ? 'Customer Pays Extra' : 'Even Swap'}
                    </span>
                  </div>
                </div>

                {/* Refund Mode Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {differenceAmount < 0 ? 'Refund Settlement Mode *' : differenceAmount > 0 ? 'Collect Remaining Difference Via *' : 'Settlement Mode *'}
                  </label>
                  
                  {differenceAmount === 0 ? (
                    <div className="p-3 bg-gray-50 rounded-xl text-gray-500 italic text-center text-xs">
                      No monetary settlement is required for an even product exchange.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'cash', name: 'Cash Counter' },
                        { id: 'upi', name: 'UPI Digital' },
                        { id: 'card', name: 'POS Card' },
                        { id: 'bank_transfer', name: 'Bank Wire' },
                        { id: 'credit_adjustment', name: 'Credit Ledger', disabled: activeBill.customerId === 'c_walkin' },
                        { id: 'no_refund', name: 'No Refund (Swap)' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          disabled={mode.disabled}
                          onClick={() => setRefundMode(mode.id as any)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex flex-col justify-between transition-all ${
                            mode.disabled
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                              : refundMode === mode.id
                                ? 'bg-black text-white border-black shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span>{mode.name}</span>
                          {mode.id === 'credit_adjustment' && (
                            <span className="text-[9px] mt-1 font-normal opacity-70">
                              Adjust Outstanding
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Business Explanation Notes */}
                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl flex gap-2 text-[11px] text-blue-800 leading-relaxed">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    {refundMode === 'credit_adjustment' ? (
                      <p>
                        <strong>Ledger Rules:</strong> This adjusts the client outstanding ledger immediately by ₹{Math.abs(differenceAmount).toLocaleString('en-IN')}. A Credit Note record will track the settlement.
                      </p>
                    ) : refundMode === 'no_refund' ? (
                      <p>
                        No direct refund given. Perfect for direct replacement scenarios. Stock levels synchronize automatically.
                      </p>
                    ) : (
                      <p>
                        <strong>Direct settlement:</strong> Cash/UPI/Bank accounts are updated directly. Ledger outstanding remains untouched unless custom invoices require otherwise.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations and Process Trigger */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Financial Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Gross Goods Returned</span>
                  <span className="font-mono">₹{returnTotals.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Proportional GST returned</span>
                  <span className="font-mono">₹{(returnTotals.cgst + returnTotals.sgst).toFixed(2)}</span>
                </div>
                {exchangeItems.length > 0 && (
                  <>
                    <div className="flex justify-between text-gray-500 border-t border-dashed border-gray-150 pt-2">
                      <span>Gross Exchange Goods</span>
                      <span className="font-mono">₹{exchangeTotals.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Proportional Exchange GST</span>
                      <span className="font-mono">₹{(exchangeTotals.cgst + exchangeTotals.sgst).toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-3 text-gray-950">
                  <span>{differenceAmount < 0 ? 'Total Refund Value' : differenceAmount > 0 ? 'Total Due Amount' : 'Net Settlement'}</span>
                  <span className="font-mono text-base text-black">
                    ₹{Math.abs(differenceAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleProcessSalesReturn}
                disabled={returnTotals.total === 0}
                className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-200 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Process Return & Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODE: RETURN REGISTRY HISTORY ----------------- */}
      {moduleMode === 'return_history' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search return register by Return No, Invoice No, Customer..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Filter className="w-4 h-4 text-gray-400" />
                <span>Total Transactions: {filteredPastReturns.length}</span>
              </div>
              <button
                onClick={() => {
                  const element = document.getElementById('return-registry-print');
                  if (!element) return;
                  const printWindow = window.open('', '_blank', 'width=1100,height=800');
                  if (!printWindow) return;
                  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(s => s.outerHTML).join('');
                  printWindow.document.write(`
                    <!doctype html>
                    <html>
                      <head>
                        <base href="${window.location.href}" />
                        <title>Return Registry</title>
                        ${styles}
                        <style>
                          @page { size: A4 landscape; margin: 10mm; }
                          body { margin: 0; padding: 0; background: white !important; visibility: visible !important; }
                          #return-registry-print { visibility: visible !important; width: 100% !important; max-width: none !important; }
                          /* Hide elements that shouldn't print */
                          table th:last-child, table td:last-child { display: none !important; }
                        </style>
                      </head>
                      <body class="bg-white">
                        <div class="p-6">
                          <h1 class="text-xl font-bold mb-4">Sales Return Registry</h1>
                          ${element.outerHTML}
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  const doPrint = async () => {
                    const links = Array.from(printWindow.document.querySelectorAll('link[rel="stylesheet"]'));
                    await Promise.all(links.map((link: any) => {
                      if (link.sheet) return Promise.resolve();
                      return new Promise(res => { link.onload = res; link.onerror = res; });
                    }));
                    await printWindow.document.fonts?.ready;
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                  };
                  if (printWindow.document.readyState === 'complete') { void doPrint(); }
                  else { printWindow.addEventListener('load', () => void doPrint(), { once: true }); }
                }}
                className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-800 transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print Registry
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase border-b border-gray-150">
                    <th className="p-4">Return Number</th>
                    <th className="p-4">Linked Invoice</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Return Amt</th>
                    <th className="p-4 text-center">Exchange Items</th>
                    <th className="p-4 text-center">Refund Mode</th>
                    <th className="p-4 text-center">Credit Note No</th>
                    <th className="p-4 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredPastReturns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400">
                        No processed sales returns found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPastReturns.map((sr) => (
                      <tr key={sr.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-bold font-mono text-gray-900">{sr.returnNumber}</td>
                        <td className="p-4 font-mono font-medium text-gray-500">{sr.originalBillNumber}</td>
                        <td className="p-4 font-medium text-gray-900">{sr.customerName}</td>
                        <td className="p-4 text-gray-500">{sr.date}</td>
                        <td className="p-4 text-right font-mono font-bold text-gray-900">₹{sr.grandTotal}</td>
                        <td className="p-4 text-center">
                          {sr.exchangeItems && sr.exchangeItems.length > 0 ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Yes ({sr.exchangeItems.length})
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                            {sr.refundMode || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-gray-900">
                          {sr.creditNoteNumber ? (
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-bold">
                              {sr.creditNoteNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setViewedReturn(sr);
                              setModuleMode('view_receipt');
                            }}
                            className="bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-400 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Receipt
                          </button>
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

      {/* ----------------- MODE: VIEW RETURN RECEIPT / CREDIT NOTE PRINT PREVIEW ----------------- */}
      {moduleMode === 'view_receipt' && viewedReturn && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm print:hidden">
            <button
              onClick={() => {
                // If it was just created, reset to search
                if (viewedReturn.id === 'sr_temp') {
                  setModuleMode('search');
                  setActiveBill(null);
                } else {
                  setModuleMode('return_history');
                }
                setViewedReturn(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {viewedReturn.id === 'sr_temp' ? 'Create Another Return' : 'Back to Registry'}
            </button>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setPrintTemplate('a4')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-150 ${
                    printTemplate === 'a4'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  A4 Invoice Size
                </button>
                <button
                  onClick={() => setPrintTemplate('thermal')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-150 ${
                    printTemplate === 'thermal'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  80mm Thermal Slip
                </button>
              </div>
              <button
                onClick={handlePrint}
                className="bg-black text-white hover:bg-gray-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          </div>

          {/* PRINTABLE AREA CANVAS */}
          <div className="flex justify-center overflow-auto p-2 bg-gray-100/50 rounded-2xl border border-gray-200 border-dashed max-h-[72vh] print:overflow-visible print:bg-white print:border-none print:p-0 print:justify-start print:max-h-none">
            {printTemplate === 'a4' ? (
              /* A4 RENDER STYLE */
              <div id="a4-print-element" className="w-full flex flex-col gap-6 print:block print:gap-0 print:items-stretch print:justify-start">
                <div className="print-page bg-white w-[800px] mx-auto p-8 border border-gray-200 shadow-sm flex flex-col justify-between font-sans text-xs text-gray-900 print:flex print:flex-col print:justify-between print:items-stretch print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none print:mb-0 mb-6">
                  <div className="flex-1 flex flex-col print:flex print:flex-col">
                {/* Header info */}
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-3 mb-4">
                  <div>
                    <h1 className="text-lg font-extrabold text-black uppercase tracking-wide">
                      {businessDetails.name || 'DEALER / ENTERPRISE'}
                    </h1>
                    <p className="text-gray-500 mt-1 max-w-[300px] leading-relaxed">
                      {businessDetails.address || 'Address details not set'}
                    </p>
                    <p className="text-gray-500 mt-1">Phone: {businessDetails.phone || ''} • Email: {businessDetails.email || ''}</p>
                    {businessDetails.gstNumber && (
                      <p className="text-black font-semibold mt-1">GSTIN: {businessDetails.gstNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black text-red-600 tracking-wider">
                      {viewedReturn.creditNoteNumber ? 'CREDIT NOTE' : 'SALES RETURN RECEIPT'}
                    </h2>
                    <div className="mt-3 space-y-1 font-mono text-[11px] text-gray-700">
                      <div><strong className="text-black">Return No:</strong> {viewedReturn.returnNumber}</div>
                      {viewedReturn.creditNoteNumber && (
                        <div><strong className="text-black">Credit Note No:</strong> {viewedReturn.creditNoteNumber}</div>
                      )}
                      <div><strong className="text-black">Date:</strong> {viewedReturn.date} {viewedReturn.time || ''}</div>
                      <div><strong className="text-black">Linked Invoice:</strong> {viewedReturn.originalBillNumber}</div>
                    </div>
                  </div>
                </div>

                {/* Customer Section */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-150 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-1">Returned By (Customer)</h3>
                    <p className="font-bold text-sm text-black">{viewedReturn.customerName}</p>
                    <p className="text-gray-500 mt-0.5">Mobile: {viewedReturn.customerMobile}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-1">Return Settlement</h3>
                    <p className="font-bold text-sm text-black">Refund Mode: <span className="uppercase text-red-600 font-mono font-extrabold">{viewedReturn.refundMode || 'N/A'}</span></p>
                    <p className="text-gray-500 mt-0.5">Authorized User: Administrator</p>
                  </div>
                </div>

                {/* Returned Goods Section */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-extrabold text-black uppercase tracking-wider text-[10px] border-b border-gray-200 pb-1 flex items-center gap-1.5 text-red-600">
                    <ArrowDownLeft className="w-3.5 h-3.5" /> List of Returned Items
                  </h4>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[9px] border-b border-gray-200">
                        <th className="p-2">#</th>
                        <th className="p-2">Product Name</th>
                        <th className="p-2 text-center">Qty Returned</th>
                        <th className="p-2 text-right">Unit Rate (₹)</th>
                        <th className="p-2 text-center">GST (%)</th>
                        <th className="p-2 text-right">Proportional Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewedReturn.items.map((item, idx) => (
                        <tr key={item.productId} className="hover:bg-gray-50/20">
                          <td className="p-2 font-mono text-gray-400">{idx + 1}</td>
                          <td className="p-2 font-semibold text-gray-900">{item.name}</td>
                          <td className="p-2 text-center font-mono font-medium">{item.quantity} {item.unit}</td>
                          <td className="p-2 text-right font-mono">₹{(item.rate ?? 0).toFixed(2)}</td>
                          <td className="p-2 text-center font-mono">{item.gstPercent}%</td>
                          <td className="p-2 text-right font-mono font-bold text-gray-900">₹{item.total.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-right font-bold text-[11px] text-red-600 font-mono bg-red-50/30 p-2 rounded border border-red-50 border-dashed">
                    Gross Returned Value: ₹{viewedReturn.grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Exchanged Goods Section */}
                {viewedReturn.exchangeItems && viewedReturn.exchangeItems.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="font-extrabold text-black uppercase tracking-wider text-[10px] border-b border-gray-200 pb-1 flex items-center gap-1.5 text-emerald-600">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Replacement Items Issued (Exchange)
                    </h4>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[9px] border-b border-gray-200">
                          <th className="p-2">#</th>
                          <th className="p-2">Product Name</th>
                          <th className="p-2 text-center">Qty Taken</th>
                          <th className="p-2 text-right">Unit Rate (₹)</th>
                          <th className="p-2 text-center">GST (%)</th>
                          <th className="p-2 text-right">Proportional Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewedReturn.exchangeItems.map((item, idx) => (
                          <tr key={item.productId} className="hover:bg-gray-50/20">
                            <td className="p-2 font-mono text-gray-400">{idx + 1}</td>
                            <td className="p-2 font-semibold text-gray-900">{item.name}</td>
                            <td className="p-2 text-center font-mono font-medium">{item.quantity} {item.unit}</td>
                            <td className="p-2 text-right font-mono">₹{(item.rate ?? 0).toFixed(2)}</td>
                            <td className="p-2 text-center font-mono">{item.gstPercent}%</td>
                            <td className="p-2 text-right font-mono font-bold text-gray-900">₹{item.total.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-right font-bold text-[11px] text-emerald-600 font-mono bg-emerald-50/30 p-2 rounded border border-emerald-50 border-dashed">
                      Gross Exchange Value: ₹{viewedReturn.exchangeTotal?.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                  </div>
                {/* Return Reason, Notes, and Totals Columns */}
                <div className="mt-2 print-invoice-footer mt-auto border-t border-gray-200 pt-2 print:pt-1">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-7 space-y-1">
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-150 text-[10px] space-y-1 text-gray-600">
                        <div><strong className="text-black">Reason for Return:</strong> {viewedReturn.reason}</div>
                        <div><strong className="text-black">Declaration:</strong> This document serves as certified confirmation of receipt of returned stock as registered under statutory GST/VAT billing guidelines.</div>
                      </div>
                    </div>
                    
                    <div className="col-span-5 text-right font-mono space-y-0.5 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Total Returned</span>
                          <span>₹{(viewedReturn.grandTotal ?? 0).toFixed(2)}</span>
                        </div>
                        {viewedReturn.exchangeTotal !== undefined && viewedReturn.exchangeTotal !== null && (
                          <div className="flex justify-between text-[11px] text-gray-500">
                            <span>Total Exchanged</span>
                            <span>₹{(viewedReturn.exchangeTotal ?? 0).toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between font-extrabold text-xs text-black border-t border-gray-200 pt-1 bg-gray-50 p-2 rounded">
                          <span>
                            {(viewedReturn.differenceAmount || 0) < 0 ? 'Refund Due to Customer' : (viewedReturn.differenceAmount || 0) > 0 ? 'Collectable Cash' : 'Balanced Exchange'}
                          </span>
                          <span className="text-sm font-black text-black">
                            ₹{Math.abs(viewedReturn.differenceAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Authorized Signature */}
                      <div className="mt-4 print:mt-3 text-right self-end">
                        <div className="w-36 inline-block text-center">
                          <div className="h-8 border-b border-gray-400 mb-1 mx-auto"></div>
                          <span className="text-gray-600 font-semibold uppercase text-[10px]">Authorized Signatory</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Message */}
                  <div className="mt-2 flex justify-center items-center text-[9px] text-gray-400 border-t border-gray-100 pt-1 font-mono print:mt-1">
                    <span className="print:mt-0 font-bold text-black">Powering your business in real-time</span>
                  </div>
                </div>

                </div>
              </div>
            ) : (
              /* THERMAL 80MM SLIP STYLE */
              <div id="thermal-print-element" className="bg-white w-[290px] p-4 border border-gray-200 shadow-sm font-mono text-[10px] text-black print:shadow-none print:border-none print:p-0">
                <div className="text-center space-y-1 mb-3">
                  <h1 className="text-sm font-black uppercase">{businessDetails.name || 'MY ENTERPRISE'}</h1>
                  <p className="text-[9px] leading-snug">{businessDetails.address || ''}</p>
                  <p className="text-[9px]">Ph: {businessDetails.phone || ''}</p>
                  {businessDetails.gstNumber && <p className="text-[9px] font-bold">GSTIN: {businessDetails.gstNumber}</p>}
                  <p className="border-b border-dashed border-black py-0.5"></p>
                  <h2 className="text-xs font-black uppercase text-center mt-1">
                    {viewedReturn.creditNoteNumber ? 'CREDIT NOTE' : 'SALES RETURN SLIP'}
                  </h2>
                  <p className="border-b border-dashed border-black py-0.5"></p>
                </div>

                <div className="space-y-1 font-mono text-[9px] mb-3">
                  <div>RET NO: {viewedReturn.returnNumber}</div>
                  {viewedReturn.creditNoteNumber && <div>CN NO : {viewedReturn.creditNoteNumber}</div>}
                  <div>DATE  : {viewedReturn.date} {viewedReturn.time || ''}</div>
                  <div>INV NO: {viewedReturn.originalBillNumber}</div>
                  <div>CLIENT: {viewedReturn.customerName}</div>
                  <div>MOBILE: {viewedReturn.customerMobile}</div>
                  <p className="border-b border-dashed border-black py-0.5"></p>
                </div>

                {/* Returned items */}
                <div className="mb-2">
                  <div className="font-black text-[9px] uppercase mb-1">=== RETURNED ITEMS ===</div>
                  {viewedReturn.items.map((item) => (
                    <div key={item.productId} className="py-1">
                      <div className="font-bold">{item.name}</div>
                      <div className="flex justify-between text-[9px]">
                        <span>{item.quantity} {item.unit} x ₹{(item.rate ?? 0).toFixed(2)}</span>
                        <span>₹{item.total}</span>
                      </div>
                    </div>
                  ))}
                  <p className="border-b border-dashed border-black py-0.5"></p>
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>GROSS RETURNED:</span>
                    <span>₹{viewedReturn.grandTotal}</span>
                  </div>
                  <p className="border-b border-dashed border-black py-0.5"></p>
                </div>

                {/* Exchanged items */}
                {viewedReturn.exchangeItems && viewedReturn.exchangeItems.length > 0 && (
                  <div className="mb-2">
                    <div className="font-black text-[9px] uppercase mb-1">=== EXCHANGE ITEMS ===</div>
                    {viewedReturn.exchangeItems.map((item) => (
                      <div key={item.productId} className="py-1">
                        <div className="font-bold">{item.name}</div>
                        <div className="flex justify-between text-[9px]">
                          <span>{item.quantity} {item.unit} x ₹{(item.rate ?? 0).toFixed(2)}</span>
                          <span>₹{item.total}</span>
                        </div>
                      </div>
                    ))}
                    <p className="border-b border-dashed border-black py-0.5"></p>
                    <div className="flex justify-between font-bold text-[10px]">
                      <span>GROSS EXCHANGE:</span>
                      <span>₹{viewedReturn.exchangeTotal}</span>
                    </div>
                    <p className="border-b border-dashed border-black py-0.5"></p>
                  </div>
                )}

                {/* Settlement modes */}
                <div className="space-y-1 text-[9px] mb-3">
                  <div>REFUND MODE  : {viewedReturn.refundMode || 'N/A'}</div>
                  <div>REASON       : {viewedReturn.reason}</div>
                  <div>OPERATOR     : Administrator</div>
                  <p className="border-b border-dashed border-black py-0.5"></p>
                </div>

                {/* Financial Summary Net */}
                <div className="space-y-1 font-black text-xs text-center border-2 border-black p-1.5 uppercase">
                  <div>
                    {(viewedReturn.differenceAmount || 0) < 0 
                      ? 'REFUND AMOUNT' 
                      : (viewedReturn.differenceAmount || 0) > 0 
                        ? 'COLLECT AMOUNT' 
                        : 'BALANCED SWAP'}
                  </div>
                  <div className="text-sm font-extrabold">
                    ₹{Math.abs(viewedReturn.differenceAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-center text-[8px] text-gray-500 mt-6 leading-relaxed uppercase">
                  === THANK YOU ===<br />
                  STOCK CONFIRMED RECEIVED
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

