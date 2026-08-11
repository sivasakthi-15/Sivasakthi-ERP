// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Warehouse, WarehouseStock, StockTransfer, SerialNumber, StockAdjustment, StockMovement, Supplier } from '../types';
import { 
  Search, ShieldAlert, Archive, Plus, Minus, Check, X, ClipboardList, 
  Sparkles, HelpCircle, RefreshCw, Printer, Trash2, Eye, Download, Info, 
  AlertTriangle, FileText, CheckCircle2, ChevronRight, Settings, PlusCircle, ArrowLeftRight, HelpCircle as HelpIcon, Barcode as BarcodeIcon, Tag
} from 'lucide-react';

export const InventoryModule: React.FC = () => {
  const { 
    products, stockMovements, adjustStock, warehouses, warehouseStocks, stockTransfers, 
    serialNumbers, stockAdjustments, addWarehouse, updateWarehouseStock, createStockTransfer, 
    addSerialNumber, updateSerialNumber, adjustStockProfessional, suppliers, createPurchaseOrder
  } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'barcode' | 'warehouses' | 'serials' | 'adjustments' | 'audit_trail' | 'reports'>('dashboard');

  // Notifications
  const [notifications, setNotifications] = useState<{ id: string; type: 'success' | 'error' | 'warn'; text: string }[]>([]);
  const pushNotify = (type: 'success' | 'error' | 'warn', text: string) => {
    const id = Math.random().toString();
    setNotifications(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal controls
  const [showAddWhModal, setShowAddWhModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [showAddSNModal, setShowAddSNModal] = useState(false);
  const [showSNInfoModal, setShowSNInfoModal] = useState(false);
  const [showLabelPrintModal, setShowLabelPrintModal] = useState(false);

  // Form states
  const [newWhName, setNewWhName] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');

  // Stock Transfer Form
  const [transferFromWh, setTransferFromWh] = useState('');
  const [transferToWh, setTransferToWh] = useState('');
  const [transferProduct, setTransferProduct] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Serial Number form
  const [newSNCode, setNewSNCode] = useState('');
  const [newSNProduct, setNewSNProduct] = useState('');
  const [newSNWarranty, setNewSNWarranty] = useState('12');
  const [newSNNotes, setNewSNNotes] = useState('');

  // Selected entities for modals
  const [selectedProductForAdj, setSelectedProductForAdj] = useState<Product | null>(null);
  const [selectedProductForLabels, setSelectedProductForLabels] = useState<Product | null>(null);
  const [selectedSN, setSelectedSN] = useState<SerialNumber | null>(null);

  // Professional Adjustment Form
  const [adjWarehouse, setAdjWarehouse] = useState('');
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState<'physical_count' | 'damage' | 'lost' | 'theft' | 'correction' | 'opening_balance'>('correction');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjUser, setAdjUser] = useState('Administrator');

  // Label Printer Configuration
  const [labelCols, setLabelCols] = useState<'2' | '3' | '4' | 'thermal'>('3');
  const [labelQty, setLabelQty] = useState('6');
  const [showPriceOnLabel, setShowPriceOnLabel] = useState(true);
  const [showNameOnLabel, setShowNameOnLabel] = useState(true);
  const [showShopNameOnLabel, setShowShopNameOnLabel] = useState(true);

  // Serial Number Search states
  const [snSearchTerm, setSnSearchTerm] = useState('');

  // Barcode quick search state
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState('');

  // Low stock reorder PO helpers
  const handleAutoPOCreate = (prod: Product) => {
    if (!suppliers || suppliers.length === 0) {
      pushNotify('error', 'No active suppliers found to generate PO.');
      return;
    }
    const targetSupplier = suppliers.find(s => s.id === prod.preferredSupplierId) || suppliers[0];
    const poItems = [{
      productId: prod.id,
      name: prod.name,
      quantity: prod.reorderLevel * 2 - prod.stock, // order enough to be safely above reorder level
      unit: prod.unit,
      expectedRate: prod.purchasePrice,
      receivedQuantity: 0,
      total: (prod.reorderLevel * 2 - prod.stock) * prod.purchasePrice
    }];

    createPurchaseOrder({
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.name,
      supplierMobile: targetSupplier.mobile || '9999999999',
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0], // 5 days from now
      items: poItems,
      amount: poItems[0].total,
      discountPercent: 0,
      discountAmount: 0,
      gstPercent: prod.gstPercent,
      taxableAmount: poItems[0].total,
      cgst: poItems[0].total * (prod.gstPercent / 200),
      sgst: poItems[0].total * (prod.gstPercent / 200),
      grandTotal: poItems[0].total * (1 + prod.gstPercent / 100),
      status: 'draft',
      notes: `Automated reorder suggestion trigger for low stock item ${prod.name}`
    });

    pushNotify('success', `Draft PO suggested for ${prod.name} successfully created with Supplier ${targetSupplier.name}!`);
  };

  // Submit handers
  const handleAddWhSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName.trim()) return;
    addWarehouse({
      name: newWhName,
      location: newWhLocation
    });
    setNewWhName('');
    setNewWhLocation('');
    setShowAddWhModal(false);
    pushNotify('success', 'New warehouse location initialized successfully.');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromWh || !transferToWh || !transferProduct || !transferQty) return;
    if (transferFromWh === transferToWh) {
      pushNotify('error', 'Source and Destination warehouses cannot be identical.');
      return;
    }

    const qty = parseFloat(transferQty) || 0;
    if (qty <= 0) {
      pushNotify('error', 'Transfer quantity must be greater than zero.');
      return;
    }

    // Check available stock in from warehouse
    const currentWS = warehouseStocks.find(ws => ws.productId === transferProduct && ws.warehouseId === transferFromWh);
    const available = currentWS ? currentWS.currentStock : 0;
    if (qty > available) {
      pushNotify('error', `Insufficient stock. Only ${available} units available in source warehouse.`);
      return;
    }

    const prod = products.find(p => p.id === transferProduct);
    const fromWh = warehouses.find(w => w.id === transferFromWh);
    const toWh = warehouses.find(w => w.id === transferToWh);

    if (!prod || !fromWh || !toWh) return;

    createStockTransfer({
      fromWarehouseId: transferFromWh,
      fromWarehouseName: fromWh.name,
      toWarehouseId: transferToWh,
      toWarehouseName: toWh.name,
      productId: transferProduct,
      productName: prod.name,
      quantity: qty,
      unit: prod.unit,
      status: 'completed',
      notes: transferNotes
    });

    setTransferProduct('');
    setTransferQty('');
    setTransferNotes('');
    setShowTransferModal(false);
    pushNotify('success', 'Stock transfer dispatched and balances updated successfully.');
  };

  const handleAddSNSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSNCode.trim() || !newSNProduct) return;

    // Check for duplicate serial number
    const isDuplicate = serialNumbers.some(sn => (sn.serialNumber || '').toUpperCase() === newSNCode.trim().toUpperCase());
    if (isDuplicate) {
      pushNotify('error', `Serial Number "${newSNCode}" already exists in the registry.`);
      return;
    }

    const prod = products.find(p => p.id === newSNProduct);
    if (!prod) return;

    addSerialNumber({
      productId: newSNProduct,
      productName: prod.name,
      serialNumber: newSNCode.trim().toUpperCase(),
      status: 'available',
      warrantyPeriodMonths: parseInt(newSNWarranty) || 12,
      notes: newSNNotes
    });

    setNewSNCode('');
    setNewSNNotes('');
    setShowAddSNModal(false);
    pushNotify('success', `Serial number registered for ${prod.name}.`);
  };

  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdj || !adjWarehouse || !adjQty) return;

    const qty = parseFloat(adjQty) || 0;
    const wh = warehouses.find(w => w.id === adjWarehouse);
    const currentWS = warehouseStocks.find(ws => ws.productId === selectedProductForAdj.id && ws.warehouseId === adjWarehouse);
    const prevQtyInWh = currentWS ? currentWS.currentStock : 0;

    // Adjusting qty: difference between target quantity and previous quantity
    const diff = qty - prevQtyInWh;

    adjustStockProfessional({
      date: new Date().toISOString().split('T')[0],
      productId: selectedProductForAdj.id,
      productName: selectedProductForAdj.name,
      warehouseId: adjWarehouse,
      warehouseName: wh?.name || 'Unknown',
      previousQuantity: prevQtyInWh,
      updatedQuantity: qty,
      adjustedQuantity: diff,
      reason: adjReason,
      notes: adjNotes,
      user: adjUser
    });

    setSelectedProductForAdj(null);
    setAdjQty('');
    setAdjNotes('');
    setShowAdjModal(false);
    pushNotify('success', 'Professional inventory correction journal posted successfully.');
  };

  // Helper Calculations for Dashboard Tab
  const totalProducts = products.filter(p => p.isActive).length;
  const outOfStockItems = products.filter(p => p.isActive && p.stock <= 0);
  const lowStockItems = products.filter(p => p.isActive && p.stock > 0 && p.stock <= p.reorderLevel);
  
  // Total valuation
  const totalBaseValuation = products.reduce((sum, p) => sum + ((p.stock ?? 0) * (p.sellingPrice || 0)), 0);
  const totalPurchaseValuation = products.reduce((sum, p) => sum + ((p.stock ?? 0) * (p.purchasePrice ?? 0)), 0);

  // Fast vs Slow Moving logic based on historical Movements (simulated for simplicity but real evaluation)
  const productMovementCounts: Record<string, number> = {};
  stockMovements.forEach(m => {
    productMovementCounts[m.productId] = (productMovementCounts[m.productId] || 0) + Math.abs(m.quantity);
  });
  const sortedMoveProds = Object.entries(productMovementCounts).sort((a, b) => b[1] - a[1]);
  const fastMovingIds = sortedMoveProds.slice(0, 3).map(x => x[0]);
  const slowMovingIds = products.filter(p => !productMovementCounts[p.id]).slice(0, 3).map(p => p.id);

  // Filtered Products for Register Tab
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLow = !filterLowStock || (p.stock <= p.reorderLevel);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;

    return matchesSearch && matchesLow && matchesCategory && p.isActive;
  });

  // Unique categories for filters
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // Warehouse stats
  const getWarehouseStockValue = (whId: string, type: 'selling' | 'purchase') => {
    return warehouseStocks
      .filter(ws => ws.warehouseId === whId && ws.shopId !== 'all')
      .reduce((sum, ws) => {
        const prod = products.find(p => p.id === ws.productId);
        if (!prod) return sum;
        const rate = (type === 'selling' ? prod.sellingPrice : prod.purchasePrice) ?? 0;
        return sum + ((ws.currentStock ?? 0) * rate);
      }, 0);
  };

  const getWarehouseItemCount = (whId: string) => {
    return warehouseStocks.filter(ws => ws.warehouseId === whId && ws.currentStock > 0).length;
  };

  const getProductStockInWarehouse = (prodId: string, whId: string) => {
    const match = warehouseStocks.find(ws => ws.productId === prodId && ws.warehouseId === whId);
    return match ? match.currentStock : 0;
  };

  // Label print trigger
  const handleTriggerLabelPrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden font-sans">
      
      {/* Notifications Alert Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`p-3.5 rounded-xl text-xs font-semibold shadow-lg border flex items-center gap-2.5 animate-slide-in-right ${
              n.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              n.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {n.type === 'success' && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />}
            {n.type === 'error' && <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0" />}
            {n.type === 'warn' && <Info className="h-4.5 w-4.5 text-amber-600 shrink-0" />}
            <span>{n.text}</span>
          </div>
        ))}
      </div>

      {/* Main Top Header */}
      <div className="bg-white border-b border-gray-150 shrink-0 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Archive className="h-5 w-5 stroke-[1.8]" />
            <span>Electrical Stock Register Suite</span>
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">Commercial warehouse inventory controls, EAN sticker matrix, multi-godown transit ledger.</p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setTransferFromWh(warehouses[0]?.id || '');
              setTransferToWh(warehouses[1]?.id || '');
              setShowTransferModal(true);
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />
            <span>Transit Dispatch</span>
          </button>
          <button
            onClick={() => setShowAddSNModal(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="h-3.5 w-3.5 text-gray-400" />
            <span>Record Serial Number</span>
          </button>
          <button
            onClick={() => setShowAddWhModal(true)}
            className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="h-3.5 w-3.5 text-white" />
            <span>Create Godown</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="bg-white border-b border-gray-150 shrink-0 px-6 flex items-center justify-between overflow-x-auto gap-4 select-none scrollbar-none">
        <div className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard Control' },
            { id: 'register', label: 'Stock Master Register' },
            { id: 'barcode', label: 'Barcode Sticker Hub' },
            { id: 'warehouses', label: 'Warehouse & Godown' },
            { id: 'serials', label: 'Serial & Warranty' },
            { id: 'adjustments', label: 'Stock Adjustments' },
            { id: 'audit_trail', label: 'Operational Audit Log' },
            { id: 'reports', label: 'Dynamic Reports' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 text-xs font-semibold relative cursor-pointer border-b-2 transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'border-black text-black font-bold' 
                  : 'border-transparent text-gray-400 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.id === 'register' && lowStockItems.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-800 font-mono text-[9px] font-bold rounded-full">
                  {lowStockItems.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Module Panel Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* 1. DASHBOARD CONTROL TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Summary Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Inventory Value (Base Rates)</span>
                  <div className="text-xl font-black text-gray-900 mt-1">₹{totalBaseValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                </div>
                <div className="text-[10px] text-gray-500 mt-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                  <span>Estimated retail valuation</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Inventory Value (Purchase Costs)</span>
                  <div className="text-xl font-black text-gray-900 mt-1">₹{totalPurchaseValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                </div>
                <div className="text-[10px] text-gray-500 mt-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-black rounded-full"></span>
                  <span>Audited cost value in stores</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Out of Stock & Low Alerts</span>
                  <div className="text-xl font-black text-red-600 mt-1">{outOfStockItems.length + lowStockItems.length} Products</div>
                </div>
                <div className="text-[10px] text-red-500 font-bold mt-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse"></span>
                  <span>{outOfStockItems.length} totally depleted, {lowStockItems.length} under threshold</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Catalog Items</span>
                  <div className="text-xl font-black text-gray-900 mt-1">{totalProducts} Products</div>
                </div>
                <div className="text-[10px] text-gray-500 mt-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                  <span>Active SKUs registered</span>
                </div>
              </div>
            </div>

            {/* Warehouse Stock value spread vs Velocity Analyzer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Godown distribution matrix */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-150 shadow-xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Godown Distribution Matrix</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Available balances and real cost value across storage units.</p>
                  </div>
                  <Archive className="h-4.5 w-4.5 text-gray-400" />
                </div>

                <div className="space-y-3">
                  {warehouses.map(wh => {
                    const costVal = getWarehouseStockValue(wh.id, 'purchase');
                    const sellVal = getWarehouseStockValue(wh.id, 'selling');
                    const itemsCount = getWarehouseItemCount(wh.id);
                    const rawPercent = totalPurchaseValuation > 0 ? (costVal / totalPurchaseValuation) * 100 : 0;
                    const percent = isNaN(rawPercent) ? 0 : rawPercent;

                    return (
                      <div key={wh.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                            <span>{wh.name}</span>
                            {wh.isDefault && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-[8px] uppercase font-mono font-bold rounded">Default Counter</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">{wh.location || 'No location address recorded'}</div>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <div className="text-[10px] text-gray-400">Active SKUs</div>
                            <div className="text-xs font-bold text-gray-700">{itemsCount} Products</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400">Value (Cost)</div>
                            <div className="text-xs font-bold text-gray-900">₹{costVal.toLocaleString('en-IN')}</div>
                          </div>
                          <div className="w-16">
                            <div className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-center">
                              {percent.toFixed(0)}% Vol
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fast & Slow moving indices */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Product Velocity Analyzer</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Evaluation of counter sales dispatch turnover.</p>
                  </div>

                  {/* Fast Moving */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Fast Moving (High Turnover)</span>
                    <div className="space-y-1.5">
                      {fastMovingIds.length === 0 ? (
                        <div className="text-[10px] text-gray-400 italic">Insufficent sale records to track speed index</div>
                      ) : (
                        fastMovingIds.map(id => {
                          const p = products.find(prod => prod.id === id);
                          return p ? (
                            <div key={p.id} className="flex justify-between items-center text-xs font-semibold p-2 hover:bg-gray-50 rounded">
                              <span className="truncate text-gray-800">{p.name}</span>
                              <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50/50 px-1.5 py-0.5 rounded font-bold">★ Fast</span>
                            </div>
                          ) : null;
                        })
                      )}
                    </div>
                  </div>

                  {/* Slow Moving */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Slow Moving (Overstock Risk)</span>
                    <div className="space-y-1.5">
                      {slowMovingIds.length === 0 ? (
                        <div className="text-[10px] text-gray-400 italic">No stagnant stock detected</div>
                      ) : (
                        slowMovingIds.map(id => {
                          const p = products.find(prod => prod.id === id);
                          return p ? (
                            <div key={p.id} className="flex justify-between items-center text-xs font-semibold p-2 hover:bg-gray-50 rounded">
                              <span className="truncate text-gray-800">{p.name}</span>
                              <span className="font-mono text-[10px] text-amber-600 bg-amber-50/50 px-1.5 py-0.5 rounded font-bold">▲ Slow</span>
                            </div>
                          ) : null;
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 italic mt-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  Tip: Suggested discount campaigns on slow items to optimize working capital.
                </div>
              </div>
            </div>

            {/* Low stock auto suggested procurement log */}
            <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Automated Reorder Suggestions</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">System detected items below safety thresholds with single-click Purchase Order dispatch.</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg text-[10px] border border-amber-250">
                  {lowStockItems.length} Action Needed
                </span>
              </div>

              {lowStockItems.length === 0 ? (
                <div className="text-center p-10 text-xs text-gray-400 italic border border-dashed border-gray-200 rounded-xl">
                  Excellent! No products are currently below reorder safety thresholds.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-150">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">Product Item</th>
                        <th className="p-3 text-center">Safety Threshold</th>
                        <th className="p-3 text-center">Current Stock</th>
                        <th className="p-3 text-center">Recommended Order</th>
                        <th className="p-3 text-center">Supplier Target</th>
                        <th className="p-3 text-center">Procure Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {lowStockItems.map(p => {
                        const recOrder = p.reorderLevel * 2 - p.stock;
                        const targetSupplier = suppliers.find(s => s.id === p.preferredSupplierId) || suppliers[0];

                        return (
                          <tr key={p.id} className="hover:bg-gray-50/20">
                            <td className="p-3">
                              <div className="font-bold text-gray-900">{p.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">Code: {p.productCode} | Cat: {p.category}</div>
                            </td>
                            <td className="p-3 text-center font-mono text-gray-500">{p.reorderLevel} {p.unit}</td>
                            <td className="p-3 text-center font-mono text-red-600 font-bold">{p.stock} {p.unit}</td>
                            <td className="p-3 text-center font-mono text-emerald-600 font-bold">{recOrder} {p.unit}</td>
                            <td className="p-3 text-center text-gray-600">
                              {targetSupplier ? (
                                <span className="font-semibold">{targetSupplier.name}</span>
                              ) : (
                                <span className="text-gray-400 italic">No Preferred Supplier</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleAutoPOCreate(p)}
                                className="px-3 py-1 bg-black hover:bg-neutral-800 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                              >
                                Draft PO
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. STOCK REGISTER TAB */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            
            {/* Search Filter Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                
                {/* Search field */}
                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    placeholder="Search by SKU, Brand, Code, Barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-black bg-white"
                  />
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>

                {/* Category selection */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Toggle low stock */}
                <button
                  onClick={() => setFilterLowStock(!filterLowStock)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold shadow-xs border transition-all cursor-pointer ${
                    filterLowStock 
                      ? 'bg-amber-100 text-amber-800 border-amber-300' 
                      : 'bg-white text-gray-600 hover:border-gray-400 border-gray-200'
                  }`}
                >
                  {filterLowStock ? 'Showing Low Stock' : 'Filter Low Stock'}
                </button>
              </div>

              {/* Reset filter button */}
              {(searchTerm || filterCategory !== 'all' || filterLowStock) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                    setFilterLowStock(false);
                  }}
                  className="text-xs font-bold text-gray-400 hover:text-black cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Main Products Grid Table */}
            <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Product Item / Details</th>
                      <th className="p-3">Brand & Category</th>
                      <th className="p-3 text-center">Overall Stock</th>
                      <th className="p-3 text-center">Warehouse Spread</th>
                      <th className="p-3 text-right">Selling Rate</th>
                      <th className="p-3 text-center">Warranty</th>
                      <th className="p-3 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                    {filteredProducts.map((p, idx) => {
                      const isLow = p.stock <= p.reorderLevel;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/20">
                          <td className="p-3 text-center font-mono text-gray-400 text-[10px]">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{p.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                              <span>Code: <strong className="text-gray-700">{p.productCode}</strong></span>
                              <span>|</span>
                              <span>EAN: <strong className="text-gray-700">{p.barcode || 'N/A'}</strong></span>
                              {p.isSerialTracked && (
                                <>
                                  <span>|</span>
                                  <span className="px-1 bg-neutral-100 text-[9px] text-neutral-800 font-extrabold rounded">Serial-Tracked</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{p.brand}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{p.category}</div>
                          </td>
                          <td className="p-3 text-center font-mono">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                p.stock <= 0 ? 'bg-red-50 text-red-700 border border-red-150' :
                                isLow ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                                'bg-emerald-50 text-emerald-700 border border-emerald-150'
                              }`}>
                                {p.stock} {p.unit}
                              </span>
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5">Min: {p.minStock} / Max: {p.maxStock}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1 text-[10px] font-mono text-gray-500 max-w-[180px] mx-auto">
                              {warehouses.map(wh => {
                                const whQty = getProductStockInWarehouse(p.id, wh.id);
                                return whQty > 0 ? (
                                  <div key={wh.id} className="flex justify-between border-b border-gray-50 pb-0.5">
                                    <span className="truncate pr-2">{wh.name}:</span>
                                    <span className="font-bold text-gray-700 shrink-0">{whQty} {p.unit}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-gray-900">
                            <div>₹{(p.sellingPrice || 0).toFixed(2)}</div>
                            <div className="text-[9px] text-gray-400">Cost: ₹{(p.purchasePrice ?? 0).toFixed(2)}</div>
                          </td>
                          <td className="p-3 text-center">
                            {p.warrantyPeriodMonths ? (
                              <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-800 rounded text-[10px] font-bold">
                                {p.warrantyPeriodMonths} Months
                              </span>
                            ) : (
                              <span className="text-gray-400">No Warranty</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedProductForAdj(p);
                                  setAdjWarehouse(warehouses[0]?.id || '');
                                  setAdjQty((p.stock ?? 0).toString());
                                  setShowAdjModal(true);
                                }}
                                className="px-2 py-1 bg-gray-100 hover:bg-black hover:text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Adjust
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProductForLabels(p);
                                  setLabelQty('6');
                                  setShowLabelPrintModal(true);
                                }}
                                className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Tag className="h-3 w-3 text-gray-400" />
                                <span>Labels</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. BARCODE STICKER HUB */}
        {activeTab === 'barcode' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">Barcode Label Template Generator</h3>
              <p className="text-xs text-gray-500 mb-6">Select a product to preview and generate scannable barcode price tag labels. Supports standard A4 sheets and thermal roll printing.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* Left Form: Setup */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">1. Select Catalog Item</label>
                    <select
                      onChange={(e) => {
                        const match = products.find(p => p.id === e.target.value);
                        setSelectedProductForLabels(match || null);
                      }}
                      className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                      value={selectedProductForLabels?.id || ''}
                    >
                      <option value="">-- Choose Product --</option>
                      {products.filter(p => p.isActive).map(p => (
                        <option key={p.id} value={p.id}>{p.name} [{p.productCode}]</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">2. Grid Format</label>
                    <select
                      value={labelCols}
                      onChange={(e) => setLabelCols(e.target.value as any)}
                      className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                    >
                      <option value="2">2 Columns (Large Sticker)</option>
                      <option value="3">3 Columns (Standard Label)</option>
                      <option value="4">4 Columns (Small Label)</option>
                      <option value="thermal">3 Inch Thermal Roll (1x Column)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">3. Label Quantity</label>
                    <input
                      type="number"
                      value={labelQty}
                      onChange={(e) => setLabelQty(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                      min="1"
                      max="100"
                    />
                  </div>

                  {/* Print Options */}
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold block">Print Inclusions</label>
                    
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showShopNameOnLabel}
                        onChange={(e) => setShowShopNameOnLabel(e.target.checked)}
                        className="rounded text-black focus:ring-black"
                      />
                      <span>Print Shop Name</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showNameOnLabel}
                        onChange={(e) => setShowNameOnLabel(e.target.checked)}
                        className="rounded text-black focus:ring-black"
                      />
                      <span>Print Product Name</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPriceOnLabel}
                        onChange={(e) => setShowPriceOnLabel(e.target.checked)}
                        className="rounded text-black focus:ring-black"
                      />
                      <span>Print Price (MRP)</span>
                    </label>
                  </div>

                  <button
                    onClick={handleTriggerLabelPrint}
                    disabled={!selectedProductForLabels}
                    className="w-full py-2.5 bg-black text-white hover:bg-neutral-800 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Label Sheet</span>
                  </button>
                </div>

                {/* Right Panel: Sticker Preview */}
                <div className="md:col-span-2 border border-gray-150 rounded-xl p-5 flex flex-col items-center justify-center bg-gray-50/50 min-h-[300px]">
                  {selectedProductForLabels ? (
                    <div className="space-y-6 w-full max-w-md">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block text-center">Live Preview of Single Label</span>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center space-y-2 max-w-[240px] mx-auto font-sans">
                        {showShopNameOnLabel && (
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-1">
                            SIVASAKTHI ELECTRICALS
                          </div>
                        )}
                        {showNameOnLabel && (
                          <div className="text-xs font-bold text-gray-800 truncate px-1">
                            {selectedProductForLabels.name}
                          </div>
                        )}
                        
                        {/* Barcode graphic simulation */}
                        <div className="py-2 flex flex-col items-center justify-center space-y-1">
                          <div className="flex gap-0.5 h-8 items-center justify-center">
                            {[1,2,1,3,2,1,4,1,2,3,1,2,1,4,2,1,2,1,3,2,1,4,1,2,1,3,2,1,4,1].map((w, idx) => (
                              <div key={idx} className="bg-black h-full" style={{ width: `${w * 0.7}px` }}></div>
                            ))}
                          </div>
                          <span className="font-mono text-[9px] tracking-widest font-semibold text-gray-500">
                            {selectedProductForLabels.barcode || '3325158912401'}
                          </span>
                        </div>

                        {showPriceOnLabel && (
                          <div className="text-xs font-mono font-bold text-gray-900">
                            MRP: ₹{(selectedProductForLabels.mrp ?? 0).toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="text-center text-[11px] text-gray-400 italic">
                        Formulated with high-contrast bar density parameters for seamless USB scanning compatibility.
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-xs text-gray-400 italic">
                      Please select a product from the left drop-down list to configure sticker template.
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 4. WAREHOUSE & GODOWN TAB */}
        {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* List of Godowns */}
            <div className="lg:col-span-2 space-y-4">
              {warehouses.map(wh => {
                const costVal = getWarehouseStockValue(wh.id, 'purchase');
                const sellVal = getWarehouseStockValue(wh.id, 'selling');
                const itemsCount = getWarehouseItemCount(wh.id);

                return (
                  <div key={wh.id} className="bg-white rounded-xl border border-gray-150 shadow-xs p-5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                          <span>{wh.name}</span>
                          {wh.isDefault && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-[8px] rounded font-bold font-mono">Counter Default</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{wh.location || 'No address location catalogued'}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold font-mono bg-gray-50 px-2.5 py-1 border border-gray-100 rounded-lg text-gray-700">
                          {itemsCount} Unique SKUs
                        </span>
                      </div>
                    </div>

                    {/* Stock listing in this specific Warehouse */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Available Stock Ledger</span>
                      {warehouseStocks.filter(ws => ws.warehouseId === wh.id && ws.currentStock > 0).length === 0 ? (
                        <div className="text-[10px] text-gray-400 italic py-2">No stock balances currently situated in this godown.</div>
                      ) : (
                        warehouseStocks.filter(ws => ws.warehouseId === wh.id && ws.currentStock > 0).map(ws => {
                          const prod = products.find(p => p.id === ws.productId);
                          if (!prod) return null;

                          return (
                            <div key={ws.id} className="flex items-center justify-between text-xs font-semibold p-2 bg-gray-50 rounded border border-gray-100/50">
                              <span className="text-gray-800 truncate pr-4">{prod.name}</span>
                              <span className="font-mono text-[11px] text-gray-900 shrink-0 font-bold">{ws.currentStock} {prod.unit}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-[10px] font-mono text-gray-500">
                      <span>Valuation (Base Price): <strong className="text-gray-900">₹{sellVal.toLocaleString('en-IN')}</strong></span>
                      <span>Valuation (Purchase Price): <strong className="text-gray-900">₹{costVal.toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warehouse transfer history log */}
            <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">Recent Stock Transfers</h4>
              
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {stockTransfers.length === 0 ? (
                  <div className="text-center p-8 text-xs text-gray-400 italic border border-dashed border-gray-150 rounded-xl">
                    No historical stock transfers logged yet.
                  </div>
                ) : (
                  stockTransfers.map(st => (
                    <div key={st.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1.5 relative">
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-bold text-gray-900 truncate" title={st.productName}>{st.productName}</span>
                        <span className="font-mono font-bold text-black text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-150 shrink-0">
                          {st.quantity} {st.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-400">
                        <span>No: {st.transferNumber}</span>
                        <span>{st.transferDate}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-gray-600 bg-white p-1 rounded font-semibold border border-gray-100">
                        <span className="truncate max-w-[80px] text-red-600">{st.fromWarehouseName}</span>
                        <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[80px] text-emerald-600">{st.toWarehouseName}</span>
                      </div>

                      {st.notes && (
                        <p className="text-[10px] text-gray-500 bg-gray-100 p-1 rounded italic font-medium">
                          Notes: {st.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* 5. SERIAL & WARRANTY TRACKING TAB */}
        {activeTab === 'serials' && (
          <div className="space-y-6">
            
            {/* Search Serial Field */}
            <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Serial &amp; Warranty Registry</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Track serial keys for high-value electrical appliances (Water Heaters, Pump Motors, Ceiling Fans).</p>
                </div>
                <button
                  onClick={() => setShowAddSNModal(true)}
                  className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Record Serial
                </button>
              </div>

              {/* Input field */}
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Enter Serial Number to search (e.g. SN-HAVELLS-...)"
                  value={snSearchTerm}
                  onChange={(e) => setSnSearchTerm(e.target.value)}
                  className="w-full text-xs font-semibold border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:border-black bg-white"
                />
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-3" />
              </div>
            </div>

            {/* Serial registry list */}
            <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                    <tr>
                      <th className="p-3">Serial Number</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Purchase Details (Inward)</th>
                      <th className="p-3">Sales Details (Outward)</th>
                      <th className="p-3 text-center">Warranty Period</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                    {serialNumbers
                      .filter(sn => !snSearchTerm || sn.serialNumber.toLowerCase().includes(snSearchTerm.toLowerCase()) || sn.productName.toLowerCase().includes(snSearchTerm.toLowerCase()))
                      .map(sn => {
                        return (
                          <tr key={sn.id} className="hover:bg-gray-50/20">
                            <td className="p-3 font-mono font-bold text-gray-900">{sn.serialNumber}</td>
                            <td className="p-3">{sn.productName}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                sn.status === 'available' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' :
                                sn.status === 'sold' ? 'bg-blue-50 text-blue-800 border border-blue-150' :
                                'bg-red-50 text-red-800 border border-red-150'
                              }`}>
                                {sn.status}
                              </span>
                            </td>
                            <td className="p-3">
                              {sn.purchaseInvoiceNo ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-gray-900">{sn.purchaseInvoiceNo}</div>
                                  <div className="text-[10px] text-gray-400">Supplier: {sn.supplierName}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">No inward record</span>
                              )}
                            </td>
                            <td className="p-3">
                              {sn.saleInvoiceNo ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-gray-900">{sn.saleInvoiceNo}</div>
                                  <div className="text-[10px] text-gray-400">Customer: {sn.customerName}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Unsold</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono font-bold">
                              {sn.warrantyPeriodMonths ? `${sn.warrantyPeriodMonths} Months` : 'No Warranty'}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedSN(sn);
                                  setShowSNInfoModal(true);
                                }}
                                className="px-2 py-1 bg-gray-100 hover:bg-black hover:text-white rounded text-[10px] font-bold cursor-pointer transition-all border border-gray-200"
                              >
                                View Log
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. STOCK ADJUSTMENTS (PROFESSIONAL ENTRY PANEL) */}
        {activeTab === 'adjustments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Panel: Adjustment History Journal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">Inventory Correction Journals</h3>
                <p className="text-xs text-gray-500 mb-4">Immutable logs of physical audits, damaged stock writes, and correction entries.</p>

                <div className="overflow-x-auto rounded-lg border border-gray-150">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
                      <tr>
                        <th className="p-3">Journal No</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Godown Location</th>
                        <th className="p-3 text-center">Qty Shift</th>
                        <th className="p-3 text-center">Reason Code</th>
                        <th className="p-3">Auditor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {stockAdjustments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-gray-400 italic text-xs">No adjustments recorded.</td>
                        </tr>
                      ) : (
                        stockAdjustments.map(adj => {
                          return (
                            <tr key={adj.id} className="hover:bg-gray-50/20">
                              <td className="p-3 font-mono font-bold text-gray-900">{adj.adjustmentNumber}</td>
                              <td className="p-3">
                                <div className="font-semibold text-gray-800">{adj.productName}</div>
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{adj.date}</div>
                              </td>
                              <td className="p-3 text-gray-600 font-semibold">{adj.warehouseName}</td>
                              <td className="p-3 text-center font-mono">
                                <span className={`font-bold ${
                                  adj.adjustedQuantity > 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {adj.adjustedQuantity > 0 ? '+' : ''}{adj.adjustedQuantity}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold rounded">
                                  {(adj.reason || '').toUpperCase().replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-3 text-gray-500">{adj.user}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Panel: Immediate action block */}
            <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Post Inventory Correction</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Conduct immediate physical counts correction entry audits.</p>
              </div>

              <div className="text-xs space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-gray-500 leading-relaxed">
                  To correct stock quantities, find the respective item inside the <strong>Stock Master Register</strong> tab and click on the <strong>Adjust</strong> action button.
                </p>
                <div className="p-2.5 bg-amber-50 rounded-lg text-[10px] text-amber-800 font-bold border border-amber-100 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Always execute stock audits at close of day trading for high integrity.</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 7. OPERATIONAL AUDIT LOG */}
        {activeTab === 'audit_trail' && (
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Operational Audit Log</h3>
                <p className="text-xs text-gray-500 mt-0.5">Continuous ledger of warehouse entries, supplier inward bookings, and stock restoral trails.</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                Total Logs: {stockMovements.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {stockMovements.length === 0 ? (
                <div className="text-center p-12 text-xs text-gray-400 italic">No operational logging traces catalogued.</div>
              ) : (
                stockMovements.map(m => {
                  const isAddition = m.quantity > 0;
                  const prod = products.find(p => p.id === m.productId);

                  return (
                    <div key={m.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900">{prod ? prod.name : 'Unknown Catalog SKU'}</div>
                        <p className="text-[10px] text-gray-500">{m.reason}</p>
                        <div className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">{m.date} | {m.time} | Auditor: {m.user || 'Admin'}</div>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <div className="text-[9px] text-gray-400 uppercase">Movement</div>
                          <span className={`font-mono font-bold ${isAddition ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isAddition ? '+' : ''}{m.quantity}
                          </span>
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-400 uppercase">After Audit</div>
                          <span className="font-mono text-gray-800 font-bold">{m.stockAfter}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 8. DYNAMIC REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Stock Register Sheet</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">Continuous record sheet of product codes, category valuation balances, and brand profiles.</p>
                <button
                  onClick={handleTriggerLabelPrint}
                  className="w-full py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer text-center"
                >
                  Generate Register
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Valuation Audit Certificate</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">Certified calculation certificate of total retail valuation vs real purchasing cost capital in godowns.</p>
                <button
                  onClick={handleTriggerLabelPrint}
                  className="w-full py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer text-center"
                >
                  Valuation Report
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Warehouse Transfer Slip Ledger</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">Tracking ledger records of inter-godown transits, transit numbers, dispatch dates, and notes.</p>
                <button
                  onClick={handleTriggerLabelPrint}
                  className="w-full py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer text-center"
                >
                  Dispatch Reports
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Warranty Registry Ledger</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">Continuous record of registered serial keys, linked invoice references, customer listings, and warranty status.</p>
                <button
                  onClick={handleTriggerLabelPrint}
                  className="w-full py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer text-center"
                >
                  Warranty Registers
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: ADD WAREHOUSE */}
      {showAddWhModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Initialize New Godown Location</h3>
              <button onClick={() => setShowAddWhModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddWhSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Godown Storage Name *</label>
                <input
                  type="text"
                  required
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  placeholder="e.g. Warehouse B Unit 2"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Godown Location Address</label>
                <input
                  type="text"
                  value={newWhLocation}
                  onChange={(e) => setNewWhLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  placeholder="e.g. Outer Bypass Road, Chennai"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                Inaugurate Godown
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Transit Dispatch (Stock Transfer) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Dispatched Transit Entry</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">From Warehouse (Source) *</label>
                <select
                  value={transferFromWh}
                  onChange={(e) => setTransferFromWh(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  required
                >
                  <option value="">-- Choose Godown --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">To Warehouse (Destination) *</label>
                <select
                  value={transferToWh}
                  onChange={(e) => setTransferToWh(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  required
                >
                  <option value="">-- Choose Godown --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Select Product *</label>
                <select
                  value={transferProduct}
                  onChange={(e) => setTransferProduct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.filter(p => p.isActive).map(p => {
                    const available = getProductStockInWarehouse(p.id, transferFromWh);
                    return (
                      <option key={p.id} value={p.id}>{p.name} (Avail: {available} {p.unit})</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Transfer Qty *</label>
                <input
                  type="number"
                  step="any"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white font-mono"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Transit Notes</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  placeholder="e.g. Dispatched via Loading Rickshaw"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                Dispatch Stock Transit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PROFESSIONAL ADJUSTMENT MODAL */}
      {showAdjModal && selectedProductForAdj && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Post Correction Audit</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{selectedProductForAdj.name}</p>
              </div>
              <button onClick={() => { setSelectedProductForAdj(null); setShowAdjModal(false); }} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAdjSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Select Godown to Adjust *</label>
                <select
                  value={adjWarehouse}
                  onChange={(e) => setAdjWarehouse(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  required
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} (Current: {getProductStockInWarehouse(selectedProductForAdj.id, w.id)} {selectedProductForAdj.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Target Physical Stock count *</label>
                <input
                  type="number"
                  step="any"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white font-mono"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Audit Reason *</label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  required
                >
                  <option value="physical_count">Physical Count Audit</option>
                  <option value="damage">Damaged Stock Write-off</option>
                  <option value="lost">Lost Item Write-off</option>
                  <option value="theft">Theft Write-off</option>
                  <option value="correction">Standard Correction</option>
                  <option value="opening_balance">Opening Balance Calibration</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  placeholder="e.g. Found damaged during high tension wire tests"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                Post Correction Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD SERIAL NUMBER */}
      {showAddSNModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Record Appliance Serial</h3>
              <button onClick={() => setShowAddSNModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddSNSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Select Appliance Product *</label>
                <select
                  value={newSNProduct}
                  onChange={(e) => setNewSNProduct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  required
                >
                  <option value="">-- Choose Appliance --</option>
                  {products.filter(p => p.isActive).map(p => (
                    <option key={p.id} value={p.id}>{p.name} [{p.productCode}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Serial Key Number *</label>
                <input
                  type="text"
                  required
                  value={newSNCode}
                  onChange={(e) => setNewSNCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white font-mono"
                  placeholder="e.g. SN-HAVELLS-50L-1901"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Warranty Period (Months)</label>
                <select
                  value={newSNWarranty}
                  onChange={(e) => setNewSNWarranty(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white font-mono"
                >
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Remarks</label>
                <input
                  type="text"
                  value={newSNNotes}
                  onChange={(e) => setNewSNNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-black bg-white"
                  placeholder="e.g. Brand sealed pack"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                Register Serial Key
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VIEW SERIAL INFO LOG */}
      {showSNInfoModal && selectedSN && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Serial Key History Trail</h3>
              <button onClick={() => { setSelectedSN(null); setShowSNInfoModal(false); }} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 font-mono text-[10px] space-y-1">
                <div>Key Number: <strong className="text-gray-900 font-black">{selectedSN.serialNumber}</strong></div>
                <div>Appliance: <strong className="text-gray-800">{selectedSN.productName}</strong></div>
                <div>Registered: <span>{selectedSN.createdAt ? new Date(selectedSN.createdAt).toLocaleString() : 'N/A'}</span></div>
              </div>

              {/* Status block */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Active Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedSN.status === 'available' ? 'bg-emerald-50 text-emerald-800' :
                  selectedSN.status === 'sold' ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'
                }`}>
                  {selectedSN.status}
                </span>
              </div>

              {/* Inward Details */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Inward Procurement</span>
                {selectedSN.purchaseInvoiceNo ? (
                  <div className="space-y-1 bg-gray-50/50 p-2 rounded">
                    <div>Invoice No: <strong className="text-gray-800">{selectedSN.purchaseInvoiceNo}</strong></div>
                    <div>Supplier: <strong className="text-gray-700">{selectedSN.supplierName}</strong></div>
                  </div>
                ) : (
                  <span className="text-gray-400 italic font-mono text-[10px]">No linked procurement receipt recorded</span>
                )}
              </div>

              {/* Outward Details */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Outward Customer Sales</span>
                {selectedSN.saleInvoiceNo ? (
                  <div className="space-y-1 bg-gray-50/50 p-2 rounded">
                    <div>Bill Number: <strong className="text-gray-800">{selectedSN.saleInvoiceNo}</strong></div>
                    <div>Customer: <strong className="text-gray-700">{selectedSN.customerName}</strong></div>
                    <div>Warranty Cover: <strong className="text-neutral-800">{selectedSN.warrantyPeriodMonths} Months</strong></div>
                  </div>
                ) : (
                  <span className="text-gray-400 italic font-mono text-[10px]">Product remains unsold inside godown register</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY LABEL GRID SHEETS OVERLAY */}
      {showLabelPrintModal && selectedProductForLabels && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-150 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Prepare Sticker Sheet</h3>
              <button onClick={() => { setSelectedProductForLabels(null); setShowLabelPrintModal(false); }} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-[10px]">
                <div>SKU: <strong className="text-gray-900">{selectedProductForLabels.name}</strong></div>
                <div>EAN: <strong className="text-gray-900">{selectedProductForLabels.barcode || '3325158912401'}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Print Quantity</label>
                  <input
                    type="number"
                    value={labelQty}
                    onChange={(e) => setLabelQty(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Grid Template</label>
                  <select
                    value={labelCols}
                    onChange={(e) => setLabelCols(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="2">2 Columns (Large)</option>
                    <option value="3">3 Columns (Medium)</option>
                    <option value="4">4 Columns (Small)</option>
                    <option value="thermal">3 Inch Thermal Roll</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowLabelPrintModal(false);
                    setActiveTab('barcode');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Adjust Content
                </button>
                <button
                  onClick={handleTriggerLabelPrint}
                  className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Sticker Sheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY CSS TARGET SHEET OVERLAYS (Invisible in UI, triggers only on window.print()) */}
      {selectedProductForLabels && (
        <div className="hidden print:block absolute inset-0 bg-white z-9999 font-sans p-6">
          <div className="text-center mb-6">
            <h1 className="text-base font-bold uppercase tracking-wider">SIVASAKTHI ELECTRICALS</h1>
            <p className="text-[10px] text-gray-500 font-semibold uppercase mt-0.5">Automated Stock Sticker Generation Ledger</p>
          </div>

          <div className={`grid gap-4 ${
            labelCols === '2' ? 'grid-cols-2' :
            labelCols === '3' ? 'grid-cols-3' :
            labelCols === '4' ? 'grid-cols-4' : 'grid-cols-1 max-w-[280px]'
          }`}>
            {Array.from({ length: parseInt(labelQty) || 6 }).map((_, i) => (
              <div key={i} className="border border-black p-3.5 rounded text-center space-y-1.5 bg-white">
                {showShopNameOnLabel && (
                  <div className="text-[9px] font-black uppercase tracking-widest text-black border-b border-gray-200 pb-0.5">
                    SIVASAKTHI ELECTRICALS
                  </div>
                )}
                {showNameOnLabel && (
                  <div className="text-[11px] font-extrabold text-gray-900 truncate">
                    {selectedProductForLabels.name}
                  </div>
                )}
                
                {/* Simulated Barcode */}
                <div className="py-1 flex flex-col items-center justify-center space-y-0.5">
                  <div className="flex gap-0.5 h-6 items-center justify-center">
                    {[1,2,1,3,2,1,4,1,2,3,1,2,1,4,2,1].map((w, idx) => (
                      <div key={idx} className="bg-black h-full" style={{ width: `${w * 0.8}px` }}></div>
                    ))}
                  </div>
                  <span className="font-mono text-[8px] font-bold text-gray-600">
                    {selectedProductForLabels.barcode || '3325158912401'}
                  </span>
                </div>

                {showPriceOnLabel && (
                  <div className="text-[10px] font-mono font-black text-black">
                    MRP: ₹{(selectedProductForLabels.mrp ?? 0).toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

