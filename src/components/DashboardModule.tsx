import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calculator, AlertTriangle, ArrowUpRight, TrendingUp, TrendingDown, 
  Sparkles, DollarSign, FileText, Landmark, UserPlus, PackagePlus 
} from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const { 
    bills, products, customers, purchases, expenses, 
    setActiveTab, currentBusiness 
  } = useApp();

  if (!currentBusiness) return null;

  // Helper date matching
  const todayStr = new Date().toISOString().split('T')[0];
  const activeBills = bills.filter(b => b.status !== 'cancelled');

  // Compute stats
  const todayBills = activeBills.filter(b => b.date === todayStr);
  const todaySales = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const todayInvoicesCount = todayBills.length;
  
  // Outstanding receivables
  const totalOutstanding = customers.reduce((sum, c) => sum + Math.max(0, c.outstandingAmount), 0);
  
  // Low Stock Items count
  const lowStockProducts = products.filter(p => p.isActive && p.stock <= p.reorderLevel);

  // Financial analytics
  const totalSalesAllTime = activeBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalPurchasesAllTime = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalExpensesAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Profit calculations
  // Net Profit today = Today's Sales Items Selling Value - Today's Sales Items Purchase Cost - Today's Expenses
  const todayExpensesAmount = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);
  
  let todayCostOfGoods = 0;
  todayBills.forEach(b => {
    b.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const purchasePrice = prod ? (prod.purchasePrice ?? 0) : 0;
      todayCostOfGoods += purchasePrice * (item.quantity ?? 0);
    });
  });
  
  const todayProfit = Math.max(0, todaySales - todayCostOfGoods - todayExpensesAmount);

  // Quick mode breakdowns for payment types (UPI, Cash, Card, Bank, Credit)
  const modeCash = todayBills.filter(b => b.paymentMode === 'cash').reduce((sum, b) => sum + b.grandTotal, 0);
  const modeUpi = todayBills.filter(b => b.paymentMode === 'upi').reduce((sum, b) => sum + b.grandTotal, 0);
  const modeCard = todayBills.filter(b => b.paymentMode === 'card').reduce((sum, b) => sum + b.grandTotal, 0);
  const modeCredit = todayBills.filter(b => b.paymentMode === 'credit').reduce((sum, b) => sum + b.grandTotal, 0);

  // Staggered days chart calculation (last 5 days)
  const chartDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    const dStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    const daySales = activeBills.filter(b => b.date === dStr).reduce((sum, b) => sum + b.grandTotal, 0);
    return { label, amount: daySales };
  });

  const maxChartVal = Math.max(...chartDays.map(d => d.amount), 5000);

  // Top Products Sold
  const productSalesMap: Record<string, { name: string, qty: number, revenue: number }> = {};
  activeBills.forEach(b => {
    b.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.total;
    });
  });

  const topSelling = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="flex-1 bg-[#f9fafb] p-6 overflow-y-auto space-y-6 font-sans">
      
      {/* Header and Quick Actions Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Control Dashboard</span>
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time visual reports of operational registers. Billing remains the primary terminal trigger.
          </p>
        </div>
        
        {/* Instant POS Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setActiveTab('billing')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Open Billing Panel (F2)</span>
          </button>
          <button 
            onClick={() => setActiveTab('purchase')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:border-gray-400 rounded-xl text-xs font-medium bg-white transition-all cursor-pointer"
          >
            <PackagePlus className="h-3.5 w-3.5 text-gray-600" />
            <span>Inward Stock</span>
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:border-gray-400 rounded-xl text-xs font-medium bg-white transition-all cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 text-gray-600" />
            <span>Register Customer</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Today's Revenue</span>
            <span className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              ₹{todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-wider">
              {todayInvoicesCount} invoices generated
            </div>
          </div>
        </div>

        {/* Card 2: Today's Net profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Today's Profit (Est.)</span>
            <span className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              ₹{todayProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="text-[10px] text-gray-500 mt-1 font-mono">
              Margin computed dynamically
            </div>
          </div>
        </div>

        {/* Card 3: Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Outstanding Receivables</span>
            <span className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Landmark className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-indigo-700">
              ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-wider">
              Ledger debit balances
            </div>
          </div>
        </div>

        {/* Card 4: Low Stock warning */}
        <button 
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium group-hover:text-amber-700 transition-colors">Low-Stock Warnings</span>
            <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${
              lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-gray-50 text-gray-400'
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h2 className={`text-2xl font-bold tracking-tight ${
              lowStockProducts.length > 0 ? 'text-amber-600 font-extrabold' : 'text-gray-900'
            }`}>
              {lowStockProducts.length} Items
            </h2>
            <div className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-wider">
              At or below reorder limit
            </div>
          </div>
        </button>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Sales Trend Analysis</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Calculated based on active cash and credit invoice logs</p>
          </div>
          
          {/* Custom SVG Bar Chart */}
          <div className="h-56 mt-6 relative flex flex-col justify-end">
            <div className="w-full h-full absolute top-0 left-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-gray-100 w-full h-0"></div>
              <div className="border-b border-gray-100 w-full h-0"></div>
              <div className="border-b border-gray-100 w-full h-0"></div>
              <div className="border-b border-gray-100 w-full h-0"></div>
            </div>

            <div className="flex justify-between items-end h-40 px-4 z-10">
              {chartDays.map((day, idx) => {
                const heightPct = Math.max(5, Math.min(100, (day.amount / maxChartVal) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="text-[10px] font-semibold text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-black text-white px-1.5 py-0.5 rounded shadow-sm">
                      ₹{day.amount.toLocaleString()}
                    </div>
                    <div 
                      style={{ height: `${heightPct}%` }}
                      className="w-8 bg-black hover:bg-neutral-800 transition-all rounded-t-md duration-300 shadow-sm"
                    ></div>
                    <span className="text-[10px] text-gray-500 mt-2 font-medium truncate w-14 text-center">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Counter Cash Drawer breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 font-sans">Payment Collections (Today)</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Liquidity breakdown from today's ledger sales</p>
          </div>

          <div className="space-y-3.5 my-6">
            {/* Cash */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">Cash Sales</span>
                <span className="font-semibold text-gray-900">₹{(modeCash ?? 0).toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${todaySales > 0 ? (modeCash / todaySales) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full rounded-full"
                ></div>
              </div>
            </div>

            {/* UPI */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">UPI Instant Pay</span>
                <span className="font-semibold text-gray-900">₹{(modeUpi ?? 0).toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${todaySales > 0 ? (modeUpi / todaySales) * 100 : 0}%` }}
                  className="bg-blue-500 h-full rounded-full"
                ></div>
              </div>
            </div>

            {/* Card */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">POS Cards Terminal</span>
                <span className="font-semibold text-gray-900">₹{(modeCard ?? 0).toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${todaySales > 0 ? (modeCard / todaySales) * 100 : 0}%` }}
                  className="bg-purple-500 h-full rounded-full"
                ></div>
              </div>
            </div>

            {/* Credit */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">Credit Sales Ledger</span>
                <span className="font-semibold text-gray-900">₹{(modeCredit ?? 0).toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${todaySales > 0 ? (modeCredit / todaySales) * 100 : 0}%` }}
                  className="bg-amber-500 h-full rounded-full"
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Total: ₹{(todaySales ?? 0).toFixed(2)}</span>
            <span>Uncancelled entries</span>
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Alert lists vs Top Products list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Critical Stock Warnings</h3>
              <p className="text-[10px] text-gray-400">Products that require replacement purchase</p>
            </div>
            <button 
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-semibold text-neutral-950 hover:underline cursor-pointer"
            >
              Adjust Stock
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 border border-dashed border-gray-100 rounded-xl">
              <Sparkles className="h-8 w-8 stroke-[1px] text-emerald-400 mb-2" />
              <p className="text-xs font-semibold text-gray-600">All stocks healthy</p>
              <p className="text-[10px] mt-0.5 text-gray-400">No items are below reorder level.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div className="truncate pr-4">
                    <div className="text-xs font-medium text-gray-800 truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                      Code: {p.productCode} &middot; Reorder Level: {p.reorderLevel} {p.unit}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-50 text-red-700 border border-red-100">
                      {p.stock} {p.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Performing Catalog Items */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Top Selling Products</h3>
              <p className="text-[10px] text-gray-400">Ranked by unit sale volumes</p>
            </div>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-neutral-950 hover:underline cursor-pointer"
            >
              Sales Reports
            </button>
          </div>

          {topSelling.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 border border-dashed border-gray-100 rounded-xl">
              <FileText className="h-8 w-8 stroke-[1px] mb-2" />
              <p className="text-xs font-semibold text-gray-600">No history available</p>
              <p className="text-[10px] mt-0.5 text-gray-400">Save invoices to populate metrics.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
              {topSelling.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="truncate pr-4 flex items-center gap-2.5">
                    <span className="text-xs font-bold text-gray-400 font-mono">#{idx+1}</span>
                    <div className="truncate">
                      <div className="text-xs font-medium text-gray-800 truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        Revenue Generated: ₹{(item.revenue ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {item.qty} Sold
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
