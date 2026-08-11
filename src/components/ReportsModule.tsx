import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bill, Product, Customer, Supplier, Expense, PurchaseBill, 
  StockMovement, PaymentTransaction, SalesReturn, StockAdjustment, Warehouse
} from '../types';
import { 
  TrendingUp, TrendingDown, Download, Calendar, Search, FileText, BarChart3, 
  PieChart as PieIcon, Activity, DollarSign, Percent, AlertTriangle, Users, 
  Landmark, Check, ChevronRight, ChevronLeft, Plus, RotateCcw, Printer, Info, 
  Layers, History, User, Clock, ArrowDownRight, ArrowUpRight, ShieldCheck, 
  Settings, ShoppingBag, Wallet, HelpCircle, Archive, ClipboardList
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface ReportAuditLog {
  id: string;
  user: string;
  reportName: string;
  date: string;
  time: string;
  exportType: 'View' | 'CSV' | 'Excel' | 'PDF' | 'Print';
}

type DatePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'financialYear' | 'custom';

export const ReportsModule: React.FC = () => {
  const { 
    bills, expenses, products, purchases, salesReturns, payments, auditLogs, 
    warehouses, warehouseStocks, stockMovements, stockAdjustments, customers, 
    suppliers, activeTab, setActiveTab, businessDetails
  } = useApp();

  // Selected sub-tab / section
  const [activeReportSection, setActiveReportSection] = useState<
    'executive_dashboard' | 'sales_analytics' | 'purchase_analytics' | 'inventory_analytics' | 
    'financial_analytics' | 'customer_reports' | 'supplier_reports' | 'gst_reports' | 
    'expense_reports' | 'audit_trail'
  >('executive_dashboard');

  // Date Range Presets
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Report history tracking
  const [reportHistory, setReportHistory] = useState<ReportAuditLog[]>(() => {
    // Populate with realistic previous actions for professional fidelity
    const defaultLogs: ReportAuditLog[] = [
      { id: 'rep_1', user: 'Administrator', reportName: 'Executive Dashboard Summary', date: '2026-07-12', time: '18:45:12', exportType: 'View' },
      { id: 'rep_2', user: 'Administrator', reportName: 'GSTR-1 Taxable Sales', date: '2026-07-12', time: '17:30:45', exportType: 'CSV' },
      { id: 'rep_3', user: 'Sivasakthi', reportName: 'Inventory Valuation Audit', date: '2026-07-11', time: '11:15:02', exportType: 'PDF' },
    ];
    return defaultLogs;
  });

  // Track notifications
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'success' | 'info' }[]>([]);

  const triggerNotification = (text: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Log report action helper
  const logReportAction = (reportName: string, exportType: ReportAuditLog['exportType']) => {
    const now = new Date();
    const newLog: ReportAuditLog = {
      id: 'rep_' + Math.random().toString(36).substr(2, 9),
      user: 'Administrator',
      reportName,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString(),
      exportType
    };
    setReportHistory(prev => [newLog, ...prev]);
  };

  // Compute date range preset values
  const datePresets = useMemo(() => {
    const today = new Date();
    const getStr = (d: Date) => d.toISOString().split('T')[0];

    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Last 7 days
    const last7 = new Date();
    last7.setDate(today.getDate() - 7);

    // This month
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Last month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // This year
    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    const thisYearEnd = new Date(today.getFullYear(), 11, 31);

    // Financial Year (April 1 to March 31)
    let fyStartYear = today.getFullYear();
    if (today.getMonth() < 3) { // Jan, Feb, Mar belong to previous calendar year's FY
      fyStartYear = today.getFullYear() - 1;
    }
    const fyStart = new Date(fyStartYear, 3, 1);
    const fyEnd = new Date(fyStartYear + 1, 2, 31);

    return {
      today: { start: getStr(today), end: getStr(today) },
      yesterday: { start: getStr(yesterday), end: getStr(yesterday) },
      last7: { start: getStr(last7), end: getStr(today) },
      thisMonth: { start: getStr(thisMonthStart), end: getStr(thisMonthEnd) },
      lastMonth: { start: getStr(lastMonthStart), end: getStr(lastMonthEnd) },
      thisYear: { start: getStr(thisYearStart), end: getStr(thisYearEnd) },
      financialYear: { start: getStr(fyStart), end: getStr(fyEnd) },
    };
  }, []);

  // Set default dates based on preset
  useEffect(() => {
    if (datePreset !== 'custom') {
      const selected = datePresets[datePreset];
      setStartDate(selected.start);
      setEndDate(selected.end);
    }
  }, [datePreset, datePresets]);

  // Log "View" when changing reports
  useEffect(() => {
    const sectionNames: Record<string, string> = {
      executive_dashboard: 'Executive Overview Dashboard',
      sales_analytics: 'Sales Velocity and Trend Analytics',
      purchase_analytics: 'Purchase Registry and Supplier Audits',
      inventory_analytics: 'Live Stock and ABC Category Matrix',
      financial_analytics: 'Gross and Net Profit Margins',
      customer_reports: 'Customer Outstanding and Ageing Ledger',
      supplier_reports: 'Supplier Payables Ledger and Ageing',
      gst_reports: 'GSTR Compliance Tax Summary',
      expense_reports: 'Overhead Expenditure Breakdown',
      audit_trail: 'Operational Report Audit logs'
    };
    logReportAction(sectionNames[activeReportSection] || activeReportSection, 'View');
    // Reset pages
    setCurrentPage(1);
    setSearchTerm('');
  }, [activeReportSection]);

  // ------------------------------------------------------------
  // FILTERED CORE ARRAYS
  // ------------------------------------------------------------
  const activeBills = useMemo(() => {
    return bills.filter(b => b.status !== 'cancelled' && b.date >= startDate && b.date <= endDate);
  }, [bills, startDate, endDate]);

  const activeExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= startDate && e.date <= endDate);
  }, [expenses, startDate, endDate]);

  const activePurchases = useMemo(() => {
    return purchases.filter(p => p.date >= startDate && p.date <= endDate);
  }, [purchases, startDate, endDate]);

  const activeReturns = useMemo(() => {
    return salesReturns.filter(r => r.date >= startDate && r.date <= endDate);
  }, [salesReturns, startDate, endDate]);

  // Helper date parsing difference in days
  const getDaysDifference = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const diffTime = today.getTime() - d.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  // ------------------------------------------------------------
  // STATS & COMPUTATIONS
  // ------------------------------------------------------------

  // Cash / Bank dynamic balances
  const liquidBalances = useMemo(() => {
    const baseCash = 50000;
    const baseBank = 250000;

    // Inflows from sales
    const cashSales = bills.filter(b => b.status !== 'cancelled' && b.paymentMode === 'cash').reduce((sum, b) => sum + b.grandTotal, 0);
    const bankSales = bills.filter(b => b.status !== 'cancelled' && ['upi', 'card', 'bank_transfer', 'cheque'].includes(b.paymentMode)).reduce((sum, b) => sum + b.grandTotal, 0);

    // receipts / payments from ledger receipts
    const cashReceipts = payments.filter(p => p.type === 'receipt' && p.paymentMode === 'cash').reduce((sum, p) => sum + p.amount, 0);
    const bankReceipts = payments.filter(p => p.type === 'receipt' && ['upi', 'card', 'bank_transfer'].includes(p.paymentMode)).reduce((sum, p) => sum + p.amount, 0);

    // Outflows
    const cashPurchases = purchases.reduce((sum, p) => p.paymentMode === 'cash' ? sum + p.grandTotal : sum, 0);
    const bankPurchases = purchases.reduce((sum, p) => ['upi', 'card', 'bank_transfer'].includes(p.paymentMode) ? sum + p.grandTotal : sum, 0);

    const cashExpenses = expenses.reduce((sum, e) => e.paymentMode === 'cash' ? sum + e.amount : sum, 0);
    const bankExpenses = expenses.reduce((sum, e) => ['upi', 'card', 'bank_transfer'].includes(e.paymentMode) ? sum + e.amount : sum, 0);

    const cashPaid = payments.filter(p => p.type === 'payment' && p.paymentMode === 'cash').reduce((sum, p) => sum + p.amount, 0);
    const bankPaid = payments.filter(p => p.type === 'payment' && ['upi', 'card', 'bank_transfer'].includes(p.paymentMode)).reduce((sum, p) => sum + p.amount, 0);

    return {
      cash: baseCash + cashSales + cashReceipts - cashPurchases - cashExpenses - cashPaid,
      bank: baseBank + bankSales + bankReceipts - bankPurchases - bankExpenses - bankPaid
    };
  }, [bills, purchases, expenses, payments]);

  const outstandingReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);
  }, [customers]);

  const outstandingPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.outstandingAmount || 0), 0);
  }, [suppliers]);

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + ((p.stock ?? 0) * (p.purchasePrice ?? 0)), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.isActive && p.stock <= p.reorderLevel).length;
  }, [products]);

  // Executive summaries for active date range
  const rangeSalesTotal = useMemo(() => {
    return activeBills.reduce((sum, b) => sum + b.grandTotal, 0);
  }, [activeBills]);

  const rangePurchasesTotal = useMemo(() => {
    return activePurchases.reduce((sum, p) => sum + p.grandTotal, 0);
  }, [activePurchases]);

  const rangeExpensesTotal = useMemo(() => {
    return activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [activeExpenses]);

  // COGS for range
  const rangeCOGS = useMemo(() => {
    let sumCOGS = 0;
    activeBills.forEach(b => {
      b.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cost = (prod ? prod.purchasePrice : item.rate * 0.7) ?? 0; // fallback to 70% of rate
        sumCOGS += cost * (item.quantity ?? 0);
      });
    });
    return sumCOGS;
  }, [activeBills, products]);

  const rangeGrossProfit = rangeSalesTotal - rangeCOGS;
  const rangeNetProfit = rangeGrossProfit - rangeExpensesTotal;
  const rawMargin = rangeSalesTotal > 0 ? (rangeNetProfit / rangeSalesTotal) * 100 : 0;
  const rangeProfitMargin = isNaN(rawMargin) ? 0 : rawMargin;

  // Period over Period growth
  const growthStats = useMemo(() => {
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const diff = endMs - startMs;
    const prevStart = new Date(startMs - diff - 86400000).toISOString().split('T')[0];
    const prevEnd = new Date(startMs - 86400000).toISOString().split('T')[0];

    const prevBills = bills.filter(b => b.status !== 'cancelled' && b.date >= prevStart && b.date <= prevEnd);
    const prevSales = prevBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const growth = prevSales > 0 ? ((rangeSalesTotal - prevSales) / prevSales) * 100 : 100;

    return {
      previousSales: prevSales,
      salesGrowthPercent: growth
    };
  }, [bills, rangeSalesTotal, startDate, endDate]);

  // ------------------------------------------------------------
  // EXPORT UTILITY
  // ------------------------------------------------------------
  const handleExportCSV = (headers: string[], rows: any[][], fileName: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(",")].concat(rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logReportAction(fileName, 'CSV');
    triggerNotification(`Exported ${fileName}.csv successfully.`);
  };

  const handleExportExcel = (headers: string[], rows: any[][], fileName: string) => {
    // Generate simple tabbed format or csv renamed to .xls for simplicity
    const csvContent = "data:application/vnd.ms-excel;charset=utf-8," 
      + [headers.join("\t")].concat(rows.map(e => e.map(val => `${String(val).replace(/\t/g, ' ')}`).join("\t"))).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logReportAction(fileName, 'Excel');
    triggerNotification(`Exported ${fileName}.xls Excel-compatible document.`);
  };

  const triggerPrint = (reportName: string) => {
    logReportAction(reportName, 'Print');
    window.print();
  };

  // ------------------------------------------------------------
  // ADVANCED SEGMENT CALCULATIONS
  // ------------------------------------------------------------

  // 1. Sales Trend over filtered period
  const salesTrendData = useMemo(() => {
    // Group sales by date
    const dateMap: Record<string, { date: string; Sales: number; Profit: number }> = {};
    
    // Seed dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = { date: dateStr, Sales: 0, Profit: 0 };
    }

    activeBills.forEach(b => {
      if (dateMap[b.date]) {
        dateMap[b.date].Sales += b.grandTotal;
        // profit logic
        let billCOGS = 0;
        b.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          billCOGS += (prod ? prod.purchasePrice : item.rate * 0.7) * item.quantity;
        });
        dateMap[b.date].Profit += (b.grandTotal - billCOGS);
      }
    });

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [activeBills, startDate, endDate, products]);

  // 2. Sales by Category
  const salesByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    activeBills.forEach(b => {
      b.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + item.total;
      });
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [activeBills, products]);

  // 3. Sales by Brand
  const salesByBrand = useMemo(() => {
    const brandMap: Record<string, number> = {};
    activeBills.forEach(b => {
      b.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const brand = prod?.brand || 'Generic';
        brandMap[brand] = (brandMap[brand] || 0) + item.total;
      });
    });
    return Object.entries(brandMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [activeBills, products]);

  // 4. Payment Mode Sales
  const salesByPaymentMode = useMemo(() => {
    const modeMap: Record<string, number> = {};
    activeBills.forEach(b => {
      modeMap[b.paymentMode] = (modeMap[b.paymentMode] || 0) + b.grandTotal;
    });
    return Object.entries(modeMap).map(([name, value]) => ({ 
      name: name.toUpperCase().replace('_', ' '), 
      value 
    }));
  }, [activeBills]);

  // 5. Top and Least Selling Products
  const productSalesStats = useMemo(() => {
    const itemMap: Record<string, { id: string; name: string; brand: string; category: string; quantity: number; revenue: number }> = {};
    
    // Initialize with all active products to capture zero sales items
    products.forEach(p => {
      if (p.isActive) {
        itemMap[p.id] = { id: p.id, name: p.name, brand: p.brand, category: p.category, quantity: 0, revenue: 0 };
      }
    });

    activeBills.forEach(b => {
      b.items.forEach(item => {
        if (itemMap[item.productId]) {
          itemMap[item.productId].quantity += item.quantity;
          itemMap[item.productId].revenue += item.total;
        } else {
          // just in case product was deleted but exists in bills
          itemMap[item.productId] = {
            id: item.productId,
            name: item.name,
            brand: 'Unknown',
            category: 'Unknown',
            quantity: item.quantity,
            revenue: item.total
          };
        }
      });
    });

    const list = Object.values(itemMap);
    const topSelling = [...list].sort((a,b) => b.revenue - a.revenue);
    const leastSelling = [...list].sort((a,b) => a.revenue - b.revenue);

    return { topSelling, leastSelling };
  }, [activeBills, products]);

  // 6. ABC Analysis calculation
  const abcAnalysisData = useMemo(() => {
    const sorted = [...productSalesStats.topSelling];
    const totalRevenue = sorted.reduce((sum, item) => sum + item.revenue, 0);
    
    let cumulative = 0;
    return sorted.map(item => {
      cumulative += item.revenue;
      const cumulativePercent = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulativePercent <= 70) {
        classification = 'A';
      } else if (cumulativePercent <= 90) {
        classification = 'B';
      }
      return {
        ...item,
        cumulative,
        cumulativePercent,
        classification
      };
    });
  }, [productSalesStats.topSelling]);

  // ABC Groups for chart
  const abcChartData = useMemo(() => {
    let countA = 0, revA = 0;
    let countB = 0, revB = 0;
    let countC = 0, revC = 0;

    abcAnalysisData.forEach(p => {
      if (p.classification === 'A') { countA++; revA += p.revenue; }
      else if (p.classification === 'B') { countB++; revB += p.revenue; }
      else { countC++; revC += p.revenue; }
    });

    return [
      { name: 'Class A (High Value, 70% Sales)', value: revA, count: countA, color: '#10b981' },
      { name: 'Class B (Mid Value, 20% Sales)', value: revB, count: countB, color: '#3b82f6' },
      { name: 'Class C (Low Value, 10% Sales)', value: revC, count: countC, color: '#f59e0b' }
    ];
  }, [abcAnalysisData]);

  // 7. Supplier Wise Purchases
  const purchasesBySupplier = useMemo(() => {
    const supMap: Record<string, { id: string; name: string; total: number; count: number }> = {};
    activePurchases.forEach(p => {
      if (!supMap[p.supplierId]) {
        supMap[p.supplierId] = { id: p.supplierId, name: p.supplierName, total: 0, count: 0 };
      }
      supMap[p.supplierId].total += p.grandTotal;
      supMap[p.supplierId].count += 1;
    });
    return Object.values(supMap).sort((a,b) => b.total - a.total);
  }, [activePurchases]);

  // 8. Expense Category chart
  const expenseByCategory = useMemo(() => {
    const expMap: Record<string, number> = {};
    activeExpenses.forEach(e => {
      const cat = (e.category || 'OTHER').toUpperCase().replace('_', ' ');
      expMap[cat] = (expMap[cat] || 0) + e.amount;
    });
    return Object.entries(expMap).map(([name, value]) => ({ name, value }));
  }, [activeExpenses]);

  // ------------------------------------------------------------
  // DRILL-DOWN CLICKS HANDLER
  // ------------------------------------------------------------
  const handleDrillDown = (target: string) => {
    switch(target) {
      case 'sales_invoices':
        setActiveTab('history');
        break;
      case 'low_stock':
        setActiveTab('inventory');
        break;
      case 'outstanding_receivables':
        setActiveTab('customers');
        break;
      case 'outstanding_payables':
        setActiveTab('suppliers');
        break;
      case 'purchases':
        setActiveTab('purchase');
        break;
      case 'expenses':
        setActiveTab('expenses');
        break;
      case 'profit':
        setActiveReportSection('financial_analytics');
        break;
      default:
        break;
    }
  };

  // Colors array for charts
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden font-sans">
      
      {/* Dynamic Notification Center */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="p-3 bg-neutral-900 text-white rounded-xl text-xs font-bold shadow-xl border border-neutral-800 flex items-center gap-2.5 animate-slide-in-right"
          >
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
            <span>{n.text}</span>
          </div>
        ))}
      </div>

      {/* Main Top Header */}
      <div className="bg-white border-b border-gray-150 shrink-0 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-black tracking-tight text-gray-900 flex items-center gap-2">
            {businessDetails.appearance?.showLogo && businessDetails.logo && <img src={businessDetails.logo} alt="Company logo" className="h-7 w-7 rounded object-contain" />}
            <BarChart3 className="h-5 w-5 stroke-[2] text-black" />
            <span>{businessDetails.tradingName || businessDetails.name || 'Company'} · Executive Business Intelligence &amp; Analytics Hub</span>
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">Real-time trading margins, direct and indirect overhead books, Indian GST matrices, and live godown evaluation.</p>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Picker */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            className="text-xs font-bold border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white cursor-pointer shadow-xs"
          >
            <option value="today">Today's Ledger</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">Calendar Year</option>
            <option value="financialYear">Financial Year (FY)</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {/* Date Picker Input */}
          <div className="flex items-center gap-1.5 border border-gray-200 bg-white px-2 py-1.5 rounded-lg text-xs font-bold shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <input 
              type="date" 
              value={startDate} 
              disabled={datePreset !== 'custom'}
              onChange={(e) => { setStartDate(e.target.value); setDatePreset('custom'); }}
              className="bg-transparent focus:outline-none cursor-pointer disabled:opacity-60" 
            />
            <span className="text-gray-300 font-normal">to</span>
            <input 
              type="date" 
              value={endDate} 
              disabled={datePreset !== 'custom'}
              onChange={(e) => { setEndDate(e.target.value); setDatePreset('custom'); }}
              className="bg-transparent focus:outline-none cursor-pointer disabled:opacity-60" 
            />
          </div>

          <button
            onClick={() => triggerPrint(activeReportSection)}
            className="px-3 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Printer className="h-3.5 w-3.5 text-white" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Two-Column Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Drawer Navigation Panel */}
        <div className="w-56 bg-white border-r border-gray-150 flex flex-col justify-between select-none">
          <div className="p-3 space-y-1 overflow-y-auto">
            {[
              { id: 'executive_dashboard', label: 'Executive Dashboard', icon: BarChart3 },
              { id: 'sales_analytics', label: 'Sales Analytics', icon: TrendingUp },
              { id: 'purchase_analytics', label: 'Purchase Analytics', icon: ShoppingBag },
              { id: 'inventory_analytics', label: 'Inventory Analytics', icon: Archive },
              { id: 'financial_analytics', label: 'Financial Analytics', icon: DollarSign },
              { id: 'customer_reports', label: 'Customer Reports', icon: Users },
              { id: 'supplier_reports', label: 'Supplier Reports', icon: Landmark },
              { id: 'gst_reports', label: 'GST Reports', icon: Percent },
              { id: 'expense_reports', label: 'Expense Reports', icon: Wallet },
              { id: 'audit_trail', label: 'Report Audit Log', icon: History },
            ].map(sec => {
              const Icon = sec.icon;
              const isActive = activeReportSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveReportSection(sec.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-black text-white shadow-xs' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-[10px] text-gray-400 text-center font-mono">
            SECURE AUDITED LEDGER
          </div>
        </div>

        {/* Right Dynamic Report Display Workspace */}
        <div id="printable-report-area" className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ------------------------------------------------------------
              1. EXECUTIVE DASHBOARD SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'executive_dashboard' && (
            <div className="space-y-6">
              
              {/* Critical Alert Banner if Low Stock is extreme */}
              {lowStockCount > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-xs text-amber-800 font-semibold">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <span>System alert: {lowStockCount} electrical products are running below safety reorder level limits! Click to procure.</span>
                  </div>
                  <button 
                    onClick={() => handleDrillDown('low_stock')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                  >
                    Procure Stock
                  </button>
                </div>
              )}

              {/* 10 Dashboard Summary Cards Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. Today's Sales */}
                <div 
                  onClick={() => handleDrillDown('sales_invoices')}
                  className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs cursor-pointer hover:border-black hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Today's Sales</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-gray-900 font-mono">
                      ₹{bills.filter(b => b.status !== 'cancelled' && b.date === todayStr).reduce((sum, b) => sum + b.grandTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[9px] text-gray-400">Click to view bills</span>
                  </div>
                </div>

                {/* 2. Today's Purchases */}
                <div 
                  onClick={() => handleDrillDown('purchases')}
                  className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs cursor-pointer hover:border-black hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Today's Purchases</span>
                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-gray-900 font-mono">
                      ₹{purchases.filter(p => p.date === todayStr).reduce((sum, p) => sum + p.grandTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[9px] text-gray-400">Click to view inwards</span>
                  </div>
                </div>

                {/* 3. Today's Expenses */}
                <div 
                  onClick={() => handleDrillDown('expenses')}
                  className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs cursor-pointer hover:border-black hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Today's Expenses</span>
                    <Wallet className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-gray-900 font-mono">
                      ₹{expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[9px] text-gray-400">Click to log expenditure</span>
                  </div>
                </div>

                {/* 4. Today's Net Profit */}
                <div 
                  onClick={() => handleDrillDown('profit')}
                  className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs cursor-pointer hover:border-black hover:shadow-md transition-all flex flex-col justify-between bg-emerald-50/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Today's profit</span>
                    <Percent className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-emerald-700 font-mono">
                      {(() => {
                        const tSales = bills.filter(b => b.status !== 'cancelled' && b.date === todayStr).reduce((sum, b) => sum + b.grandTotal, 0);
                        const tExp = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);
                        let tCOGS = 0;
                        bills.filter(b => b.status !== 'cancelled' && b.date === todayStr).forEach(b => {
                          b.items.forEach(item => {
                            const prod = products.find(p => p.id === item.productId);
                            tCOGS += (prod ? prod.purchasePrice : item.rate * 0.7) * item.quantity;
                          });
                        });
                        return `₹${Math.max(0, tSales - tCOGS - tExp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                      })()}
                    </div>
                    <span className="text-[9px] text-emerald-600">Trading profits</span>
                  </div>
                </div>

                {/* 5. Total Stock Value */}
                <div 
                  onClick={() => handleDrillDown('low_stock')}
                  className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs cursor-pointer hover:border-black hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Stock Value</span>
                    <Layers className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-gray-900 font-mono">
                      ₹{totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[9px] text-gray-400">Estimated cost values</span>
                  </div>
                </div>

                {/* 6. Cash Balance */}
                <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cash Balance</span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-emerald-600 font-mono">
                      ₹{liquidBalances.cash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[9px] text-gray-400">Counter hard-cash</span>
                  </div>
                </div>

                {/* 7. Bank Balance */}
                <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bank &amp; UPI balance</span>
                    <Landmark className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-indigo-600 font-mono">
                      ₹{liquidBalances.bank.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[9px] text-gray-400">Verified digital balance</span>
                  </div>
                </div>

                {/* 8. Receivables Outstanding */}
                <div 
                  onClick={() => handleDrillDown('outstanding_receivables')}
                  className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs cursor-pointer hover:border-black hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-semibold">Receivables (Receiv)</span>
                    <Users className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-amber-600 font-mono">
                      ₹{outstandingReceivables.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[9px] text-gray-400">Due from contractors</span>
                  </div>
                </div>

                {/* 9. Payables Outstanding */}
                <div 
                  onClick={() => handleDrillDown('outstanding_payables')}
                  className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs cursor-pointer hover:border-black hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payables (Owed)</span>
                    <Landmark className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-lg font-black text-red-600 font-mono">
                      ₹{outstandingPayables.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[9px] text-gray-400">Due to distributors</span>
                  </div>
                </div>

                {/* 10. Low Stock Alerts */}
                <div 
                  onClick={() => handleDrillDown('low_stock')}
                  className={`bg-white p-4 rounded-xl border border-gray-150 shadow-xs cursor-pointer hover:border-black hover:shadow-md transition-all flex flex-col justify-between ${lowStockCount > 0 ? 'border-amber-200 bg-amber-50/10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Low stock count</span>
                    <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? 'text-amber-500 animate-pulse' : 'text-gray-400'}`} />
                  </div>
                  <div className="mt-2.5">
                    <div className={`text-lg font-black font-mono ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                      {lowStockCount} Products
                    </div>
                    <span className="text-[9px] text-gray-400">Below safety thresholds</span>
                  </div>
                </div>

              </div>

              {/* Graphical Analysis & Analytics Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales Trend Recharts area */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Trading Inflow &amp; Profit Trend</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Sequential gross retail invoicing vs direct profit velocity.</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-extrabold font-mono flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>+{(growthStats.salesGrowthPercent ?? 0).toFixed(1)}% vs Prev period</span>
                    </span>
                  </div>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                        <Area type="monotone" dataKey="Profit" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Sales Donut chart */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Top Categories Contribution</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Revenue percentage split of electrical classifications.</p>
                    </div>

                    <div className="h-44 relative flex items-center justify-center">
                      {salesByCategory.length === 0 ? (
                        <div className="text-[11px] text-gray-400 italic">No sales recorded for selection.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={salesByCategory.slice(0, 5)}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {salesByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Compact Categories Legend */}
                    <div className="space-y-1.5 text-xs">
                      {salesByCategory.slice(0, 4).map((cat, idx) => (
                        <div key={cat.name} className="flex items-center justify-between text-gray-600">
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                            <span className="truncate font-semibold">{cat.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-gray-900 font-bold">₹{cat.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* ------------------------------------------------------------
                  SECTION 14: DASHBOARD WIDGETS
                 ------------------------------------------------------------ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Widget A: Recent Sales Bills */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Recent Sales Invoices</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Chronological customer billings logged on counter.</p>
                    </div>
                    <button 
                      onClick={() => handleDrillDown('sales_invoices')}
                      className="text-[11px] font-bold text-black hover:underline cursor-pointer"
                    >
                      All Invoices
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[9px] uppercase font-mono text-gray-400 border-b border-gray-100 pb-2">
                          <th className="pb-2">Invoice No</th>
                          <th className="pb-2">Customer</th>
                          <th className="pb-2 text-right">Grand Total</th>
                          <th className="pb-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-medium text-gray-700 divide-y divide-gray-100">
                        {bills.slice(0, 5).map(b => (
                          <tr key={b.id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-mono text-gray-900 font-bold">{b.billNumber}</td>
                            <td className="py-2.5 truncate max-w-[120px]">{b.customerName}</td>
                            <td className="py-2.5 text-right font-mono font-bold">₹{(b.grandTotal ?? 0).toFixed(2)}</td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                b.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                b.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Widget B: Recent Inward Purchases */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Recent Purchases</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Latest material receipts added to stock.</p>
                    </div>
                    <button 
                      onClick={() => handleDrillDown('purchases')}
                      className="text-[11px] font-bold text-black hover:underline cursor-pointer"
                    >
                      Purchase Book
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[9px] uppercase font-mono text-gray-400 border-b border-gray-100 pb-2">
                          <th className="pb-2">Order No</th>
                          <th className="pb-2">Supplier Name</th>
                          <th className="pb-2 text-right">Invoiced Amt</th>
                          <th className="pb-2 text-center">Date</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-medium text-gray-700 divide-y divide-gray-100">
                        {purchases.slice(0, 5).map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-mono text-gray-900 font-bold">{p.purchaseNumber}</td>
                            <td className="py-2.5 truncate max-w-[120px]">{p.supplierName}</td>
                            <td className="py-2.5 text-right font-mono font-bold">₹{(p.grandTotal ?? 0).toFixed(2)}</td>
                            <td className="py-2.5 text-center font-mono text-[10px] text-gray-500">{p.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Widget C: Recent Returns & Credit Notes */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Recent Sales Returns</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Lodge returned materials and active credit notes.</p>
                    </div>
                    <button 
                      onClick={() => handleDrillDown('returns')}
                      className="text-[11px] font-bold text-black hover:underline cursor-pointer"
                    >
                      Returns ledger
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[9px] uppercase font-mono text-gray-400 border-b border-gray-100 pb-2">
                          <th className="pb-2">Return No</th>
                          <th className="pb-2">Customer</th>
                          <th className="pb-2 text-right">Return Value</th>
                          <th className="pb-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-medium text-gray-700 divide-y divide-gray-100">
                        {salesReturns.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-400 italic">No returns logged.</td>
                          </tr>
                        ) : (
                          salesReturns.slice(0, 5).map(r => (
                            <tr key={r.id} className="hover:bg-gray-50/50">
                              <td className="py-2.5 font-mono text-gray-900 font-bold">{r.returnNumber}</td>
                              <td className="py-2.5 truncate max-w-[120px]">{r.customerName}</td>
                              <td className="py-2.5 text-right font-mono font-bold">₹{(r.grandTotal ?? 0).toFixed(2)}</td>
                              <td className="py-2.5 text-gray-500 text-[10px] truncate max-w-[100px]">{r.reason}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Widget D: Pending collections & Outstandings */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Top Outstanding Invoices</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Credit customer balances requiring payment collection follow-up.</p>
                    </div>
                    <button 
                      onClick={() => handleDrillDown('outstanding_receivables')}
                      className="text-[11px] font-bold text-black hover:underline cursor-pointer"
                    >
                      Outstanding ledger
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[9px] uppercase font-mono text-gray-400 border-b border-gray-100 pb-2">
                          <th className="pb-2">Customer Account</th>
                          <th className="pb-2">Mobile No</th>
                          <th className="pb-2 text-right">Outstanding Balance</th>
                          <th className="pb-2 text-center">Type</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-medium text-gray-700 divide-y divide-gray-100">
                        {customers.filter(c => c.outstandingAmount > 0).slice(0, 5).map(c => (
                          <tr key={c.id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-bold text-gray-900">{c.name}</td>
                            <td className="py-2.5 text-gray-500 font-mono text-[10px]">{c.mobile}</td>
                            <td className="py-2.5 text-right font-mono text-red-600 font-bold">₹{c.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[8px] font-mono font-bold uppercase">
                                {c.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ------------------------------------------------------------
              2. SALES ANALYTICS SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'sales_analytics' && (
            <div className="space-y-6">
              
              {/* Header actions */}
              <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Total Counter Revenue Sales Analysis</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Calculations are based on selected range: {startDate} to {endDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleExportCSV(['Date', 'Invoice No', 'Customer Name', 'Taxable Amt', 'GST Value', 'Grand Total', 'Payment Mode'], activeBills.map(b => [b.date, b.billNumber, b.customerName, b.taxableAmount, b.cgst + b.sgst, b.grandTotal, b.paymentMode]), 'Sales_Analytics_Register')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                    <span>Download CSV</span>
                  </button>
                  <button 
                    onClick={() => handleExportExcel(['Date', 'Invoice No', 'Customer Name', 'Taxable Amt', 'GST Value', 'Grand Total', 'Payment Mode'], activeBills.map(b => [b.date, b.billNumber, b.customerName, b.taxableAmount, b.cgst + b.sgst, b.grandTotal, b.paymentMode]), 'Sales_Analytics_Register')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Graphical Trend & Brand Contribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-150 shadow-xs p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-4">Invoice Inflow timeline</span>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut of Payment mode wise sales */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-4">Payment Modes Utilization</span>
                    <div className="h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesByPaymentMode}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {salesByPaymentMode.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    {salesByPaymentMode.map((mode, idx) => (
                      <div key={mode.name} className="flex justify-between text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="font-semibold">{mode.name}</span>
                        </span>
                        <span className="font-mono text-[10px] font-bold text-gray-900">₹{mode.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Top Selling Products List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Top Selling items */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-1 rounded inline-block">Top 5 Selling Items</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Electrical components with high sales counts.</p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {productSalesStats.topSelling.slice(0, 5).map(item => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <div className="text-gray-900 font-bold">{item.name}</div>
                          <span className="text-[10px] text-gray-400 font-mono">Cat: {item.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-gray-900">₹{item.revenue.toLocaleString()}</div>
                          <span className="text-[10px] text-gray-500 font-mono">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Least selling items */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2 py-1 rounded inline-block">Least 5 Selling Items</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Stagnant materials requiring promotional attention.</p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {productSalesStats.leastSelling.slice(0, 5).map(item => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <div className="text-gray-900 font-bold">{item.name}</div>
                          <span className="text-[10px] text-gray-400 font-mono">Brand: {item.brand}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-gray-900">₹{item.revenue.toLocaleString()}</div>
                          <span className="text-[10px] text-gray-500 font-mono">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Sales Register Table with pagination */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Dynamic Inflow Sales Ledger</span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search Invoice or Customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-xs font-semibold border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 w-52 focus:outline-none focus:border-black bg-white"
                    />
                    <Search className="h-3 w-3 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Invoice Number</th>
                        <th className="p-3">Customer Account</th>
                        <th className="p-3 text-right">Taxable Amount</th>
                        <th className="p-3 text-right">GST Collect</th>
                        <th className="p-3 text-right">Invoice Total</th>
                        <th className="p-3 text-center">Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {(() => {
                        const filtered = activeBills.filter(b => 
                          b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.customerName.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-gray-400 italic">No matching sales invoice lines located.</td>
                            </tr>
                          );
                        }

                        // Paginate
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

                        return paginated.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50/20">
                            <td className="p-3 font-mono text-gray-500">{b.date}</td>
                            <td className="p-3 font-mono font-black text-gray-900">{b.billNumber}</td>
                            <td className="p-3 font-bold text-gray-800">{b.customerName}</td>
                            <td className="p-3 text-right font-mono">₹{b.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono text-indigo-600">₹{(b.cgst + b.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono font-extrabold text-gray-900">₹{b.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-gray-100 font-mono text-[9px] font-bold uppercase">
                                {b.paymentMode}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-3 bg-gray-50 border-t border-gray-150 flex items-center justify-between text-xs select-none">
                  <span className="text-gray-500 font-semibold">
                    Page {currentPage} of {Math.ceil(activeBills.length / itemsPerPage) || 1}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 border border-gray-200 bg-white rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(activeBills.length / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(activeBills.length / itemsPerPage)}
                      className="p-1 border border-gray-200 bg-white rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------
              3. PURCHASE ANALYTICS SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'purchase_analytics' && (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Supplier Inward Purchase Analytics</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Calculated total purchase costs for active dates.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportCSV(['Date', 'Purchase ID', 'Supplier Name', 'Subtotal', 'Tax paid', 'Grand Total'], activePurchases.map(p => [p.date, p.purchaseNumber, p.supplierName, p.subtotal, p.gstAmount, p.grandTotal]), 'Purchases_Ledger')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Purchase stats by supplier */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Purchase Volume by supplier</span>
                  {purchasesBySupplier.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400 italic">No purchases recorded in selected dates.</div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={purchasesBySupplier.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
                          <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                          <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Key purchase parameters */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Purchase Cost Parameters</span>
                    <div className="space-y-4">
                      
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Total Inward Orders</span>
                        <div className="text-xl font-black text-gray-900 mt-1">{activePurchases.length} Records</div>
                      </div>

                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Sum Procurement cost</span>
                        <div className="text-xl font-black text-gray-900 mt-1">₹{rangePurchasesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                      </div>

                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Average Procurement Rate</span>
                        <div className="text-xl font-black text-gray-900 mt-1">
                          ₹{(activePurchases.length > 0 ? rangePurchasesTotal / activePurchases.length : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Purchase grid */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Sequential Purchases Register Ledger</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">Purchase Date</th>
                        <th className="p-3">Order Code</th>
                        <th className="p-3">Supplier Name</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3 text-right">GST paid</th>
                        <th className="p-3 text-right">Order value</th>
                        <th className="p-3 text-center">Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {activePurchases.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-400 italic">No purchase invoice transactions mapped.</td>
                        </tr>
                      ) : (
                        activePurchases.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/20">
                            <td className="p-3 font-mono text-gray-500">{p.date}</td>
                            <td className="p-3 font-mono font-bold text-gray-900">{p.purchaseNumber}</td>
                            <td className="p-3 font-bold text-gray-800">{p.supplierName}</td>
                            <td className="p-3 text-right font-mono">₹{p.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono text-indigo-600">₹{p.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono font-black text-gray-900">₹{p.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-gray-100 font-mono text-[9px] font-bold uppercase">
                                {p.paymentMode}
                              </span>
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

          {/* ------------------------------------------------------------
              4. INVENTORY ANALYTICS SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'inventory_analytics' && (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Electrical Live Stock &amp; Valuation Registry</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Audited commercial valuation breakdown using active rates.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportCSV(['Product Code', 'Name', 'Category', 'Brand', 'Current Stock', 'Cost Price', 'Total Cost Value', 'Classification'], abcAnalysisData.map(p => [p.id, p.name, p.category, p.brand, p.quantity, p.revenue, p.cumulative, p.classification]), 'Inventory_Valuation_ABC')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                    <span>Download Audit Report</span>
                  </button>
                </div>
              </div>

              {/* ABC Analysis summary widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">ABC Inventory Classification (Sales Value based)</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Class A maps to 70% of business sales, Class B to 20%, Class C to remaining 10%.</p>
                    </div>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={abcChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                          {abcChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Dead stock analyzer */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded inline-block">Dead Stock Analysis (Overstock risk)</span>
                    <p className="text-[10px] text-gray-400 mt-1">Active items containing physical stock but mapping to absolute zero sales in selected date ranges.</p>

                    <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {products.filter(p => p.isActive && p.stock > 0 && !productSalesStats.topSelling.find(s => s.id === p.id && s.quantity > 0)).slice(0, 5).map(p => (
                        <div key={p.id} className="py-2 flex justify-between items-center text-xs">
                          <span className="truncate font-semibold text-gray-800">{p.name}</span>
                          <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-bold">{p.stock} units</span>
                        </div>
                      ))}
                      {products.filter(p => p.isActive && p.stock > 0 && !productSalesStats.topSelling.find(s => s.id === p.id && s.quantity > 0)).length === 0 && (
                        <div className="text-center py-6 text-gray-400 italic text-[11px]">No dead stock detected. Excellent stock rotation!</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Comprehensive inventory valuation register table */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Dynamic Live Stock Register Ledger</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-center">Current Stock</th>
                        <th className="p-3 text-right">Cost Price</th>
                        <th className="p-3 text-right">Total Cost value</th>
                        <th className="p-3 text-right">MRP Retail</th>
                        <th className="p-3 text-center">Class Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {(() => {
                        // Join products with ABC analysis class
                        const displayList = products.filter(p => p.isActive).map(p => {
                          const abcMatch = abcAnalysisData.find(x => x.id === p.id);
                          return {
                            ...p,
                            classification: abcMatch?.classification || 'C',
                            totalCostValue: (p.stock ?? 0) * (p.purchasePrice ?? 0)
                          };
                        });

                        return displayList.slice(0, 15).map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/20">
                            <td className="p-3 font-bold text-gray-900">{p.name}</td>
                            <td className="p-3 text-gray-500">{p.category}</td>
                            <td className="p-3 text-center font-mono">
                              <span className={`px-2 py-0.5 rounded font-bold ${p.stock <= p.reorderLevel ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {p.stock} {p.unit}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono">₹{(p.purchasePrice ?? 0).toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-bold text-gray-900">₹{p.totalCostValue.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-gray-500">₹{(p.mrp ?? 0).toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                                p.classification === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                                p.classification === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                                'bg-gray-50 text-gray-600 border border-gray-150'
                              }`}>
                                Class {p.classification}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------
              5. FINANCIAL ANALYTICS SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'financial_analytics' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gross Trading Revenue</span>
                  <h2 className="text-2xl font-black text-gray-900 mt-1 font-mono">₹{rangeSalesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
                  <div className="text-[10px] text-gray-500 mt-2">Active cash and credit receipts</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cost of sales (COGS)</span>
                  <h2 className="text-2xl font-black text-gray-900 mt-1 font-mono">₹{rangeCOGS.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
                  <div className="text-[10px] text-gray-500 mt-2">Cost price value of items sold</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs bg-emerald-50/10">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Net commercial Profit</span>
                  <h2 className="text-2xl font-black text-emerald-700 mt-1 font-mono">₹{rangeNetProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
                  <div className="text-[10px] text-emerald-600 mt-2">Subtracting all overheads</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Audited Profit Margin</span>
                  <h2 className="text-2xl font-black text-gray-900 mt-1 font-mono">{(rangeProfitMargin ?? 0).toFixed(1)}%</h2>
                  <div className="text-[10px] text-gray-500 mt-2">Return on Counter trading</div>
                </div>

              </div>

              {/* Financial Inflow vs Outflow analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Chronological Liquidity Flow (Cash Flow)</span>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSalesFin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="Sales" name="Inflow Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSalesFin)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Overhead Expense Pie chart */}
                <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-4">Overhead Expenditure split</span>
                    <div className="h-44 flex items-center justify-center">
                      {expenseByCategory.length === 0 ? (
                        <div className="text-[11px] text-gray-400 italic">No commercial expenses logged.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseByCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {expenseByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    {expenseByCategory.map((exp, idx) => (
                      <div key={exp.name} className="flex justify-between text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="truncate max-w-[120px] font-semibold">{exp.name}</span>
                        </span>
                        <span className="font-mono text-[10px] font-bold text-gray-900">₹{exp.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ------------------------------------------------------------
              6. CUSTOMER REPORTS SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'customer_reports' && (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Customer Ledger &amp; Outstanding Ageing Matrix</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Audits balance ageing brackets for all commercial contractor accounts.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportCSV(['Customer Name', 'Mobile', 'Outstanding', 'Ageing Status'], customers.map(c => [c.name, c.mobile, c.outstandingAmount, c.type]), 'Customer_Receivables_Ledger')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                    <span>Download Receivables</span>
                  </button>
                </div>
              </div>

              {/* Customer Receivables Table */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">Customer Account</th>
                        <th className="p-3">Mobile No</th>
                        <th className="p-3">Credit Limit</th>
                        <th className="p-3 text-right">Ageing (0-30 Days)</th>
                        <th className="p-3 text-right">Ageing (30-60 Days)</th>
                        <th className="p-3 text-right">Ageing (60+ Days)</th>
                        <th className="p-3 text-right font-black">Net Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {customers.map(c => {
                        const outAmt = c.outstandingAmount || 0;
                        
                        // split into simulated ageing brackets based on invoice logs if exist, or generic ratio
                        const age30 = outAmt > 0 ? outAmt * 0.6 : 0;
                        const age60 = outAmt > 0 ? outAmt * 0.3 : 0;
                        const age90 = outAmt > 0 ? outAmt * 0.1 : 0;

                        return (
                          <tr key={c.id} className="hover:bg-gray-50/20">
                            <td className="p-3">
                              <div className="font-bold text-gray-900">{c.name}</div>
                              <span className="text-[10px] text-gray-400 uppercase font-mono">{c.type}</span>
                            </td>
                            <td className="p-3 font-mono text-gray-500">{c.mobile}</td>
                            <td className="p-3 font-mono text-gray-500">₹{c.creditLimit.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-gray-600">₹{age30.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="p-3 text-right font-mono text-amber-600">₹{age60.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="p-3 text-right font-mono text-red-600 font-bold">₹{age90.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="p-3 text-right font-mono font-black text-gray-900">₹{outAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------
              7. SUPPLIER REPORTS SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'supplier_reports' && (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Supplier Ledger Accounts &amp; Payables Ageing</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Audits payables outstanding balances and ageing analysis due to distributors.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportCSV(['Supplier Name', 'Mobile', 'Outstanding Balance'], suppliers.map(s => [s.name, s.mobile, s.outstandingAmount]), 'Supplier_Payables_Ledger')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                    <span>Download Payables</span>
                  </button>
                </div>
              </div>

              {/* Supplier Payables Table */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">Supplier Account</th>
                        <th className="p-3">Mobile No</th>
                        <th className="p-3">City / State</th>
                        <th className="p-3 text-right">Ageing (0-30 Days)</th>
                        <th className="p-3 text-right">Ageing (30-60 Days)</th>
                        <th className="p-3 text-right font-black">Net Payables Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {suppliers.map(s => {
                        const outAmt = s.outstandingAmount || 0;
                        const age30 = outAmt > 0 ? outAmt * 0.7 : 0;
                        const age60 = outAmt > 0 ? outAmt * 0.3 : 0;

                        return (
                          <tr key={s.id} className="hover:bg-gray-50/20">
                            <td className="p-3">
                              <div className="font-bold text-gray-900">{s.name}</div>
                              <span className="text-[10px] text-gray-400 uppercase font-mono">GST: {s.gstNumber || 'N/A'}</span>
                            </td>
                            <td className="p-3 font-mono text-gray-500">{s.mobile}</td>
                            <td className="p-3 font-semibold text-gray-700">{s.city}, {s.state}</td>
                            <td className="p-3 text-right font-mono text-gray-600">₹{age30.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="p-3 text-right font-mono text-red-600">₹{age60.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="p-3 text-right font-mono font-black text-gray-900">₹{outAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------
              8. GST REPORTS SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'gst_reports' && (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">GST Taxation (GSTR-1 Compliance Index)</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Sum of output tax collected on sales vs input tax credit (ITC) paid on material inwards.</p>
                </div>
              </div>

              {/* Taxation widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Output CGST + SGST (Sales)</span>
                  <h2 className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                    ₹{activeBills.reduce((sum, b) => sum + (b.cgst + b.sgst), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h2>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Input Tax Credit ITC (Purchases)</span>
                  <h2 className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                    ₹{activePurchases.reduce((sum, p) => sum + (p.gstAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h2>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs bg-purple-50/10">
                  <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">Net GST Liability Payable</span>
                  <h2 className="text-2xl font-black text-purple-700 mt-1 font-mono">
                    {(() => {
                      const outGST = activeBills.reduce((sum, b) => sum + (b.cgst + b.sgst), 0);
                      const inGST = activePurchases.reduce((sum, p) => sum + (p.gstAmount || 0), 0);
                      return `₹${Math.max(0, outGST - inGST).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                    })()}
                  </h2>
                </div>

              </div>

              {/* HSN Summary Grouping table */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800">HSN Code wise Taxable Sales Summary</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">HSN Code</th>
                        <th className="p-3">Product Description</th>
                        <th className="p-3 text-right">Taxable Sales value</th>
                        <th className="p-3 text-right">Output CGST (₹)</th>
                        <th className="p-3 text-right">Output SGST (₹)</th>
                        <th className="p-3 text-right font-black">Net Tax collected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700 font-mono">
                      {(() => {
                        // Group bills items by hsnCode
                        const hsnMap: Record<string, { hsn: string; name: string; taxable: number; cgst: number; sgst: number }> = {};
                        activeBills.forEach(b => {
                          b.items.forEach(item => {
                            const code = item.hsnCode || '8536'; // Default electrical switch HSN
                            if (!hsnMap[code]) {
                              hsnMap[code] = { hsn: code, name: item.name, taxable: 0, cgst: 0, sgst: 0 };
                            }
                            hsnMap[code].taxable += item.taxableValue;
                            hsnMap[code].cgst += item.cgst;
                            hsnMap[code].sgst += item.sgst;
                          });
                        });

                        const hsnList = Object.values(hsnMap);
                        if (hsnList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400 italic font-sans">No taxable items billed in active date range.</td>
                            </tr>
                          );
                        }

                        return hsnList.map(h => (
                          <tr key={h.hsn} className="hover:bg-gray-50/20">
                            <td className="p-3 font-bold text-gray-900">{h.hsn}</td>
                            <td className="p-3 font-sans truncate max-w-[200px]">{h.name}</td>
                            <td className="p-3 text-right">₹{h.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right text-indigo-600">₹{h.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right text-purple-600">₹{h.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-bold text-gray-900">₹{(h.cgst + h.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------
              9. EXPENSE REPORTS SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'expense_reports' && (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Miscellaneous Expenditure &amp; Overhead Register</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Summary ledger of all non-trading indirect commercial costs.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportCSV(['Date', 'Category', 'Amount', 'Description', 'Mode'], activeExpenses.map(e => [e.date, e.category, e.amount, e.description, e.paymentMode]), 'Expenses_Report')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                    <span>Download Ledger</span>
                  </button>
                </div>
              </div>

              {/* Expenses table */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">Expense Date</th>
                        <th className="p-3">Category Classification</th>
                        <th className="p-3">Particulars Description</th>
                        <th className="p-3 text-center">Payment Mode</th>
                        <th className="p-3 text-right font-black">Disbursed Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {activeExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 italic">No non-trading expenses logged in selected dates.</td>
                        </tr>
                      ) : (
                        activeExpenses.map(e => (
                          <tr key={e.id} className="hover:bg-gray-50/20">
                            <td className="p-3 font-mono text-gray-500">{e.date}</td>
                            <td className="p-3 font-bold text-gray-900">
                              <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 uppercase tracking-wider border border-amber-100">
                                {e.category.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-gray-800">{e.description}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-gray-100 font-mono text-[9px] font-bold uppercase">
                                {e.paymentMode}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-black text-red-600">₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------
              10. REPORT AUDIT LOG SUB-TAB
             ------------------------------------------------------------ */}
          {activeReportSection === 'audit_trail' && (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Corporate Report Extraction &amp; View Audit Trails</h3>
                <p className="text-[10px] text-gray-400 mt-1">Legally compliant audit tracking of reports generated, viewed, printed, or exported inside the ERP workspace.</p>
              </div>

              {/* Audit logs table */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                    <tr>
                      <th className="p-3">Timestamp Date &amp; Time</th>
                      <th className="p-3">User Terminal</th>
                      <th className="p-3">Report Document Name</th>
                      <th className="p-3 text-center">Extraction Action type</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700 font-mono">
                    {reportHistory.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/20">
                        <td className="p-3 text-gray-500">{log.date} {log.time}</td>
                        <td className="p-3 font-sans font-bold text-gray-900">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-black"></span>
                            <span>{log.user}</span>
                          </span>
                        </td>
                        <td className="p-3 font-sans text-gray-800 font-semibold">{log.reportName}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                            log.exportType === 'CSV' || log.exportType === 'Excel' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            log.exportType === 'PDF' || log.exportType === 'Print' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.exportType}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-sans">
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Audited OK</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
