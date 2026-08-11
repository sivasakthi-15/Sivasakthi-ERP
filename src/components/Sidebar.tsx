import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calculator, BarChart3, Package, Users, Archive, Landmark, ShoppingBag, 
  Settings, ClipboardList, Wallet, FileText, ArrowLeftRight, LogOut, ShieldCheck,
  Barcode, Sparkles, FolderOpen, Building, Terminal
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    currentUser, currentBusiness, currentBillType, activeTab, 
    setActiveTab, resetToWelcome, logout, hasPermission, businessDetails
  } = useApp();

  if (!currentBusiness) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, show: hasPermission('billing', 'view') },
    { id: 'billing', label: 'POS Billing', icon: Calculator, badge: currentBillType === 'contractor' ? 'Contr.' : 'Retail', show: hasPermission('billing', 'view') },
    { id: 'history', label: 'Invoices', icon: ClipboardList, show: hasPermission('billing', 'view') },
    { id: 'products', label: 'Products Master', icon: Package, show: hasPermission('inventory', 'view') },
    { id: 'inventory', label: 'Live Stock Register', icon: Archive, show: hasPermission('inventory', 'view') },
    
    // Group: Customers
    { id: 'customer-group', label: 'Customers', isHeader: true, show: hasPermission('billing', 'view') },
    { id: 'customer-directory', label: 'Customer Directory', icon: Users, show: hasPermission('billing', 'view'), isSub: true },
    { id: 'customer-ledger', label: 'Customer Ledger', icon: Landmark, show: hasPermission('billing', 'view'), isSub: true },
    
    // Group: Suppliers
    { id: 'supplier-group', label: 'Suppliers', isHeader: true, show: hasPermission('purchase', 'view') },
    { id: 'supplier-directory', label: 'Supplier Directory', icon: Users, show: hasPermission('purchase', 'view'), isSub: true },
    { id: 'supplier-ledger', label: 'Supplier Ledger', icon: Landmark, show: hasPermission('purchase', 'view'), isSub: true },

    { id: 'purchase', label: 'Purchase Inward', icon: ShoppingBag, show: hasPermission('purchase', 'view') },
    { id: 'returns', label: 'Sales Returns & CN', icon: ArrowLeftRight, show: hasPermission('billing', 'view') },
    { id: 'expenses', label: 'Expenses Book', icon: Wallet, show: hasPermission('accounting', 'view') },
    { id: 'accounting', label: 'Double-Entry Ledgers', icon: Landmark, show: hasPermission('accounting', 'view') },
    { id: 'banking', label: 'Treasury Bank Books', icon: Landmark, show: hasPermission('accounting', 'view') },
    { id: 'fixedassets', label: 'Fixed Assets Register', icon: Building, show: hasPermission('accounting', 'view') },
    { id: 'employees', label: 'HRM & Payroll Register', icon: Users, show: hasPermission('accounting', 'view') },
    
    // Intelligence & Docs
    { id: 'reports', label: 'Reports & Books', icon: FileText, show: hasPermission('reports', 'view') },
    { id: 'bi', label: 'AI Forecasting & BI', icon: Sparkles, show: hasPermission('reports', 'view') },
    { id: 'gst', label: 'GST Returns compliance', icon: FileText, show: hasPermission('reports', 'view') },
    { id: 'documents', label: 'Corporate Doc Vault', icon: FolderOpen, show: hasPermission('reports', 'view') },
    
    // Config
    { id: 'settings', label: 'ERP Settings', icon: Settings, show: currentUser?.role === 'owner' || currentUser?.role === 'admin' },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck, show: currentUser?.role === 'owner' || currentUser?.role === 'admin' },
    { id: 'systemhub', label: 'Developer System Hub', icon: Terminal, show: currentUser?.role === 'owner' || currentUser?.role === 'admin' },
  ];

  const visibleItems = menuItems.filter(item => item.show);

  return (
    <div className="w-64 bg-white border-r border-gray-150 h-screen flex flex-col justify-between shrink-0 font-sans select-none">
      {/* Top Brand Block */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          {businessDetails.appearance?.showLogo && businessDetails.logo ? <img src={businessDetails.logo} alt="Company logo" className="h-8 w-8 rounded-lg object-contain" /> : <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center"><span className="text-white font-mono font-bold text-xs tracking-wider">{(businessDetails.tradingName || currentBusiness.name || 'CO').slice(0, 2).toUpperCase()}</span></div>}
          <div className="truncate">
            <h2 className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest leading-none">ERP Portal</h2>
            <h1 className="text-xs font-bold text-gray-800 truncate tracking-tight mt-1 leading-none">
              {businessDetails.tradingName || businessDetails.name || currentBusiness.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleItems.map((item) => {
          if (item.isHeader) {
            return (
              <div 
                key={item.id} 
                className="pt-3 pb-1 px-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 select-none"
              >
                {item.label}
              </div>
            );
          }

          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isSub) {
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between pl-6 pr-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-gray-100 text-black font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] ${isActive ? 'text-black font-extrabold' : 'text-gray-300 group-hover:text-gray-500'}`}>•</span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-gray-100 text-black font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {Icon && (
                  <Icon className={`h-4.5 w-4.5 stroke-[1.8px] ${
                    isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                )}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded leading-none ${
                  item.badge === 'Contr.' 
                    ? 'bg-amber-100 text-amber-800 font-bold' 
                    : 'bg-emerald-100 text-emerald-800 font-bold'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile & Actions Block */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50 space-y-1.5">
        
        {/* Active Operator Badge Card */}
        <div className="px-2.5 py-2.5 rounded-xl bg-white border border-gray-150 flex items-center justify-between gap-2 shadow-xs">
          <div className="truncate">
            <div className="text-[11px] font-bold text-gray-800 truncate leading-tight">{currentUser?.name}</div>
            <div className="text-[9px] font-mono text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{currentUser?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Log Out Operator Terminal"
            className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer shrink-0 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Switch Corporate Shop (Only for multi-branch users) */}
        {currentUser?.branch === 'all' && (
          <button
            onClick={resetToWelcome}
            className="w-full flex items-center justify-between p-2 text-[10px] text-gray-500 hover:text-black hover:bg-gray-100/70 rounded-md font-medium transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>Switch Corporate Branch</span>
            </div>
            <span className="text-[9px] font-mono text-gray-300">Ctrl+Shift+S</span>
          </button>
        )}
      </div>

    </div>
  );
};
