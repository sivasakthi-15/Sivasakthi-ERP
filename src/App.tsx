import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BillTypeScreen } from './components/BillTypeScreen';
import { Sidebar } from './components/Sidebar';
import { BillingModule } from './components/BillingModule';
import { DashboardModule } from './components/DashboardModule';
import { BillHistory } from './components/BillHistory';
import { ProductsModule } from './components/ProductsModule';
import { CustomersModule } from './components/CustomersModule';
import { SuppliersModule } from './components/SuppliersModule';
import { PurchaseModule } from './components/PurchaseModule';
import { InventoryModule } from './components/InventoryModule';
import { ExpensesModule } from './components/ExpensesModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { SalesReturnModule } from './components/SalesReturnModule';
import { LoginScreen } from './components/LoginScreen';
import { SecurityModule } from './components/SecurityModule';

// New Enterprise Extensions
import { AccountingModule } from './components/AccountingModule';
import { EmployeeModule } from './components/EmployeeModule';
import { WarehouseModule } from './components/WarehouseModule';
import { BarcodeModule } from './components/BarcodeModule';
import { BIModule } from './components/BIModule';
import { GSTModule } from './components/GSTModule';
import { DocumentsModule } from './components/DocumentsModule';
import { BankingModule } from './components/BankingModule';
import { FixedAssetsModule } from './components/FixedAssetsModule';
import { SystemHubModule } from './components/SystemHubModule';

import { ShieldOff, HelpCircle } from 'lucide-react';

const AccessDenied: React.FC<{ tabName: string }> = ({ tabName }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 select-none text-center">
      <div className="h-16 w-16 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center shadow-sm mb-4">
        <ShieldOff className="h-8 w-8 stroke-[1.8px]" />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-gray-900">Permission Restrained</h2>
      <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">
        Your current operator access profile does not possess authorization to view the <strong className="text-gray-800">{tabName}</strong> module. 
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 border border-gray-150 p-3 rounded-xl bg-white shadow-xs max-w-xs leading-normal">
        <HelpCircle className="h-4 w-4 text-gray-400 shrink-0" />
        <span>Contact your systems administrator to modify your Role Configuration Matrix.</span>
      </div>
    </div>
  );
};

const MainAppContent: React.FC = () => {
  const { currentUser, currentBusiness, selectBusiness, currentBillType, activeTab, hasPermission } = useApp();

  // Branch Access check: Single-branch users are restricted to their assigned branch
  useEffect(() => {
    if (currentUser && currentUser.branch !== 'all') {
      if (!currentBusiness || currentBusiness.id !== currentUser.branch) {
        selectBusiness(currentUser.branch);
      }
    }
  }, [currentUser, currentBusiness, selectBusiness]);

  // Phase 0: Authenticate personnel
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Phase 1: Initialize Shop selection (Only multi-branch owners/admins select)
  if (!currentBusiness) {
    return <WelcomeScreen />;
  }

  // Phase 2: Select fiscal pricing rule billing type
  if (!currentBillType) {
    return <BillTypeScreen />;
  }

  // Permissions gatekeeping logic per module tab
  const isPermitted = () => {
    if (currentUser.role === 'owner') return true;
    if (activeTab === 'billing') return hasPermission('billing', 'view');
    if (activeTab === 'dashboard') return hasPermission('billing', 'view');
    if (activeTab === 'history') return hasPermission('billing', 'view');
    if (activeTab === 'returns') return hasPermission('billing', 'view');
    if (activeTab === 'products') return hasPermission('inventory', 'view');
    if (activeTab === 'customer-directory') return hasPermission('billing', 'view');
    if (activeTab === 'customer-ledger') return hasPermission('billing', 'view');
    if (activeTab === 'supplier-directory') return hasPermission('purchase', 'view');
    if (activeTab === 'supplier-ledger') return hasPermission('purchase', 'view');
    if (activeTab === 'purchase') return hasPermission('purchase', 'view');
    if (activeTab === 'inventory') return hasPermission('inventory', 'view');
    if (activeTab === 'expenses') return hasPermission('accounting', 'view');
    if (activeTab === 'reports') return hasPermission('reports', 'view');
    if (activeTab === 'settings') return currentUser.role === 'owner' || currentUser.role === 'admin';
    if (activeTab === 'security') return currentUser.role === 'owner' || currentUser.role === 'admin';
    
    // New permissions
    if (activeTab === 'accounting') return hasPermission('accounting', 'view');
    if (activeTab === 'employees') return hasPermission('accounting', 'view');
    if (activeTab === 'warehouses') return hasPermission('inventory', 'view');
    if (activeTab === 'barcodes') return hasPermission('inventory', 'view');
    if (activeTab === 'bi') return hasPermission('reports', 'view');
    if (activeTab === 'gst') return hasPermission('reports', 'view');
    if (activeTab === 'documents') return hasPermission('reports', 'view');
    if (activeTab === 'banking') return hasPermission('accounting', 'view');
    if (activeTab === 'fixedassets') return hasPermission('accounting', 'view');
    if (activeTab === 'systemhub') return currentUser.role === 'owner' || currentUser.role === 'admin';

    return true;
  };

  const getTabLabel = () => {
    if (activeTab === 'billing') return 'POS Billing';
    if (activeTab === 'dashboard') return 'Business Dashboard';
    if (activeTab === 'history') return 'Billing History';
    if (activeTab === 'returns') return 'Sales Returns';
    if (activeTab === 'products') return 'Products Master';
    if (activeTab === 'customer-directory') return 'Customer Directory';
    if (activeTab === 'customer-ledger') return 'Customer Ledger';
    if (activeTab === 'supplier-directory') return 'Supplier Directory';
    if (activeTab === 'supplier-ledger') return 'Supplier Ledger';
    if (activeTab === 'purchase') return 'Purchase Inwards';
    if (activeTab === 'inventory') return 'Inventory';
    if (activeTab === 'expenses') return 'Expenses Ledger';
    if (activeTab === 'reports') return 'Business Reports';
    if (activeTab === 'settings') return 'Settings';
    if (activeTab === 'security') return 'Security & Access Control';
    
    // New tab labels
    if (activeTab === 'accounting') return 'Double-Entry Accounting';
    if (activeTab === 'employees') return 'HRM & Payroll Register';
    if (activeTab === 'warehouses') return 'Multi-Warehouse & Transfers';
    if (activeTab === 'barcodes') return 'Barcode & QR Designer';
    if (activeTab === 'bi') return 'Business Intelligence (BI)';
    if (activeTab === 'gst') return 'GST Returns & NIC compliance';
    if (activeTab === 'documents') return 'Corporate Document Vault';
    if (activeTab === 'banking') return 'Treasury & Bank Books';
    if (activeTab === 'fixedassets') return 'Fixed Assets Register';
    if (activeTab === 'systemhub') return 'Corporate System Hub';

    return activeTab;
  };

  // Phase 3: Display active corporate terminal
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans antialiased selection:bg-neutral-250">
      
      {/* Left Menu Drawer */}
      <Sidebar />

      {/* Main tab switching router panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {!isPermitted() ? (
          <AccessDenied tabName={getTabLabel()} />
        ) : (
          <>
            {activeTab === 'billing' && <BillingModule />}
            {activeTab === 'dashboard' && <DashboardModule />}
            {activeTab === 'history' && <BillHistory />}
            {activeTab === 'returns' && <SalesReturnModule />}
            {activeTab === 'products' && <ProductsModule />}
            {activeTab === 'customer-directory' && <CustomersModule />}
            {activeTab === 'customer-ledger' && <CustomersModule />}
            {activeTab === 'supplier-directory' && <SuppliersModule />}
            {activeTab === 'supplier-ledger' && <SuppliersModule />}
            {activeTab === 'purchase' && <PurchaseModule />}
            {activeTab === 'inventory' && <InventoryModule />}
            {activeTab === 'expenses' && <ExpensesModule />}
            {activeTab === 'reports' && <ReportsModule />}
            {activeTab === 'settings' && <SettingsModule />}
            {activeTab === 'security' && <SecurityModule />}
            
            {/* New components registration */}
            {activeTab === 'accounting' && <AccountingModule />}
            {activeTab === 'employees' && <EmployeeModule />}
            {activeTab === 'warehouses' && <WarehouseModule />}
            {activeTab === 'barcodes' && <BarcodeModule />}
            {activeTab === 'bi' && <BIModule />}
            {activeTab === 'gst' && <GSTModule />}
            {activeTab === 'documents' && <DocumentsModule />}
            {activeTab === 'banking' && <BankingModule />}
            {activeTab === 'fixedassets' && <FixedAssetsModule />}
            {activeTab === 'systemhub' && <SystemHubModule />}
          </>
        )}
      </div>
      
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
