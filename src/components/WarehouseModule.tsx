import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Archive, Landmark, ArrowLeftRight, Settings, Plus, Check, X, 
  Trash2, AlertTriangle, Search, FileText, Download, ShieldCheck
} from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
}

interface RackBin {
  warehouseId: string;
  productId: string;
  rack: string;
  bin: string;
}

interface SerialBatchLog {
  productId: string;
  productName: string;
  serialNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  warehouseId: string;
}

interface StockTransfer {
  id: string;
  date: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  productName: string;
  quantity: number;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks: string;
}

export const WarehouseModule: React.FC = () => {
  const { currentBusiness, products, currentUser } = useApp();
  const bizId = currentBusiness?.id || 'all';

  // State
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const stored = safeGetItem(`${bizId}_warehouses`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'wh_main', name: 'Main Corporate Godown', code: 'MAIN-GDN', location: '12, Sathy Road, Erode', capacity: 50000 },
      { id: 'wh_shop', name: 'Retail Counter Front', code: 'SHOP-FRT', location: 'Erode Shop Floor', capacity: 10000 },
      { id: 'wh_basement', name: 'Basement Spare Rack Storage', code: 'BASE-RK', location: 'Erode Basement', capacity: 15000 },
    ];
  });

  const [rackBins, setRackBins] = useState<RackBin[]>(() => {
    const stored = safeGetItem(`${bizId}_rackbins`);
    return stored ? JSON.parse(stored) : [];
  });

  const [serialBatchLogs, setSerialBatchLogs] = useState<SerialBatchLog[]>(() => {
    const stored = safeGetItem(`${bizId}_serialbatch`);
    if (stored) return JSON.parse(stored);
    return [
      { productId: 'se_p1', productName: 'Finolex 1.5 Sqmm Copper Wire (Red)', batchNumber: 'BAT-2026-F1', warehouseId: 'wh_main' },
      { productId: 'se_p2', productName: 'Havells 2.5 Sqmm Copper Wire (Blue)', batchNumber: 'BAT-2026-H2', warehouseId: 'wh_main' },
      { productId: 'se_p3', productName: 'Legrand 1 Way Modular Switch 10A', serialNumber: 'LEG-SW-2291', warehouseId: 'wh_shop' },
    ];
  });

  const [transfers, setTransfers] = useState<StockTransfer[]>(() => {
    const stored = safeGetItem(`${bizId}_stocktransfers`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'st_1', date: '2026-07-01', fromWarehouseId: 'wh_main', toWarehouseId: 'wh_shop', productId: 'se_p1', productName: 'Finolex 1.5 Sqmm Copper Wire (Red) 90m', quantity: 5, requestedBy: 'Ramasamy K', status: 'approved', remarks: 'Replenishing shop floor cables' },
      { id: 'st_2', date: '2026-07-12', fromWarehouseId: 'wh_basement', toWarehouseId: 'wh_shop', productId: 'se_p3', productName: 'Legrand 1 Way Modular Switch 10A', quantity: 50, requestedBy: 'Siva G', status: 'pending', remarks: 'Restocking retail switches counter' },
    ];
  });

  const [activeTab, setActiveTab] = useState<'warehouses' | 'transfers' | 'serials' | 'rackallocation'>('warehouses');
  const [showAddWHModal, setShowAddWHModal] = useState(false);

  // New Warehouse form states
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whLoc, setWhLoc] = useState('');
  const [whCap, setWhCap] = useState('10000');

  // Stock Transfer form states
  const [tFrom, setTFrom] = useState('wh_main');
  const [tTo, setTTo] = useState('wh_shop');
  const [tProduct, setTProduct] = useState('');
  const [tQty, setTQty] = useState('5');
  const [tRemarks, setTRemarks] = useState('');

  // Allocation form states
  const [allocProd, setAllocProd] = useState('');
  const [allocWH, setAllocWH] = useState('wh_main');
  const [allocRack, setAllocRack] = useState('');
  const [allocBin, setAllocBin] = useState('');

  // Save helpers
  const saveWarehouses = (list: Warehouse[]) => {
    setWarehouses(list);
    safeSetItem(`${bizId}_warehouses`, JSON.stringify(list));
  };

  const saveTransfers = (list: StockTransfer[]) => {
    setTransfers(list);
    safeSetItem(`${bizId}_stocktransfers`, JSON.stringify(list));
  };

  const saveRackBins = (list: RackBin[]) => {
    setRackBins(list);
    safeSetItem(`${bizId}_rackbins`, JSON.stringify(list));
  };

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whCode) return;

    const newWH: Warehouse = {
      id: `wh_${Math.random().toString(36).substring(2, 9)}`,
      name: whName,
      code: whCode.toUpperCase(),
      location: whLoc,
      capacity: Number(whCap) || 10000
    };

    saveWarehouses([...warehouses, newWH]);
    setShowAddWHModal(false);

    // Reset fields
    setWhName('');
    setWhCode('');
    setWhLoc('');
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tProduct || Number(tQty) <= 0) return;

    if (tFrom === tTo) {
      alert('Source and Destination warehouses must be different!');
      return;
    }

    const prodObj = products.find(p => p.id === tProduct);
    if (!prodObj) return;

    const newTransfer: StockTransfer = {
      id: `st_${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      fromWarehouseId: tFrom,
      toWarehouseId: tTo,
      productId: tProduct,
      productName: prodObj.name,
      quantity: Number(tQty),
      requestedBy: currentUser?.name || 'Authorized Operator',
      status: 'pending',
      remarks: tRemarks
    };

    saveTransfers([newTransfer, ...transfers]);

    // Reset fields
    setTRemarks('');
    setTQty('5');
    alert('Stock transfer request recorded and pending audit approval!');
  };

  const handleProcessTransfer = (transferId: string, status: 'approved' | 'rejected') => {
    const updated = transfers.map(t => {
      if (t.id === transferId) {
        return { ...t, status };
      }
      return t;
    });
    saveTransfers(updated);
    alert(`Transfer request is ${status.toUpperCase()}!`);
  };

  const handleAddRackAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocProd || !allocRack || !allocBin) return;

    const updated = rackBins.filter(r => !(r.productId === allocProd && r.warehouseId === allocWH));
    updated.push({
      productId: allocProd,
      warehouseId: allocWH,
      rack: allocRack.toUpperCase(),
      bin: allocBin.toUpperCase()
    });
    saveRackBins(updated);

    setAllocRack('');
    setAllocBin('');
    alert('Rack & Bin allocation successfully set!');
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Multi-Warehouse & Stock Transfers</span>
            <Archive className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">Configure physical godowns, manage inter-warehouse stock relocations, allocate shelf racks & bins, and trace batch/expiry/serial warranty numbers.</p>
        </div>
        <div>
          <button
            onClick={() => setShowAddWHModal(true)}
            className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Godown / Warehouse</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {[
          { id: 'warehouses', label: 'Godowns & Warehouses Directory', icon: Landmark },
          { id: 'transfers', label: 'Inter-Warehouse Transfers', icon: ArrowLeftRight },
          { id: 'rackallocation', label: 'Rack & Bin Allocations', icon: Settings },
          { id: 'serials', label: 'Serial & Batch warranty Ledger', icon: ShieldCheck },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 font-medium transition-all border-b-2 flex items-center gap-1.5 cursor-pointer -mb-px ${
              activeTab === t.id 
                ? 'border-black text-black font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: GODOWNS & WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {warehouses.map(w => (
            <div key={w.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gray-50 text-gray-400 font-mono font-bold text-[10px] px-3 py-1.5 border-b border-l border-gray-150 uppercase rounded-bl-xl">
                {w.code}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-gray-900 pr-12">{w.name}</h3>
                <span className="text-[10px] text-gray-400 font-medium block">{w.location}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Volume Capacity</span>
                <span className="font-mono font-bold text-gray-900">{w.capacity} Cub. Ft</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: INTER-WAREHOUSE TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Transfer Creator */}
          <form onSubmit={handleCreateTransfer} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Request Stock Transfer</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Source Godown *</label>
                <select
                  value={tFrom}
                  onChange={(e) => setTFrom(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Destination Godown *</label>
                <select
                  value={tTo}
                  onChange={(e) => setTTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Product to transfer *</label>
              <select
                required
                value={tProduct}
                onChange={(e) => setTProduct(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
              >
                <option value="">-- Choose Corporate Product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Qty: {p.stock})</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Transfer Qty *</label>
              <input
                type="number"
                required
                min="1"
                value={tQty}
                onChange={(e) => setTQty(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Operator Notes / Remarks</label>
              <input
                type="text"
                placeholder="Ration/restock/dispatch..."
                value={tRemarks}
                onChange={(e) => setTRemarks(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-xl font-bold hover:bg-neutral-800 cursor-pointer"
            >
              Post Transfer Request
            </button>
          </form>

          {/* Transfers History & Audit Log */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Relocation Audit Log</h3>
            <div className="space-y-3">
              {transfers.map(t => {
                const fWH = warehouses.find(w => w.id === t.fromWarehouseId);
                const tWH = warehouses.find(w => w.id === t.toWarehouseId);

                return (
                  <div key={t.id} className="p-4 rounded-xl border border-gray-150 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-gray-900 block">{t.productName}</span>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2 font-mono">
                        <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded uppercase font-bold">{fWH?.code || 'MAIN'}</span>
                        <ArrowLeftRight className="h-3 w-3" />
                        <span className="bg-black text-white px-1.5 py-0.5 rounded uppercase font-bold">{tWH?.code || 'SHOP'}</span>
                        <span>| Qty: <strong>{t.quantity}</strong> | Ref: {t.id}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-sans mt-1">Requested by {t.requestedBy} on {t.date}</div>
                    </div>

                    <div className="flex gap-1 items-center shrink-0">
                      {t.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleProcessTransfer(t.id, 'approved')}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-150 hover:bg-emerald-100 px-2 py-1 rounded font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessTransfer(t.id, 'rejected')}
                            className="bg-red-50 text-red-700 border border-red-150 hover:bg-red-100 px-2 py-1 rounded font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-1 rounded font-mono font-bold uppercase ${
                          t.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {t.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: RACK & BIN ALLOCATION */}
      {activeTab === 'rackallocation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Allocator Form */}
          <form onSubmit={handleAddRackAllocation} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Set Shelf Location</h3>
            
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Select Product *</label>
              <select
                required
                value={allocProd}
                onChange={(e) => setAllocProd(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
              >
                <option value="">-- Choose Product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Warehouse Godown *</label>
              <select
                value={allocWH}
                onChange={(e) => setAllocWH(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Rack Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RACK-C3"
                  value={allocRack}
                  onChange={(e) => setAllocRack(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Bin Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIN-02"
                  value={allocBin}
                  onChange={(e) => setAllocBin(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-xl font-bold hover:bg-neutral-800 cursor-pointer"
            >
              Allocate Shelf Location
            </button>
          </form>

          {/* Allocation Sheets */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Shelf Layout Allocation Inventory</h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                    <th className="p-2">Product Name</th>
                    <th className="p-2">Godown Location</th>
                    <th className="p-2">Rack Assigned</th>
                    <th className="p-2">Bin Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {rackBins.map((rb, index) => {
                    const prodObj = products.find(p => p.id === rb.productId);
                    const whObj = warehouses.find(w => w.id === rb.warehouseId);
                    if (!prodObj) return null;

                    return (
                      <tr key={index} className="hover:bg-gray-50/50">
                        <td className="p-2 font-sans font-bold text-gray-800">{prodObj.name}</td>
                        <td className="p-2 font-sans">{whObj?.name || 'Main Warehouse'}</td>
                        <td className="p-2"><span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-bold font-mono">{rb.rack}</span></td>
                        <td className="p-2"><span className="bg-black text-white px-1.5 py-0.5 rounded font-bold font-mono">{rb.bin}</span></td>
                      </tr>
                    );
                  })}
                  {rackBins.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center font-sans text-gray-400">No rack layout placements set. Use the left Allocator to configure.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: SERIALS & BATCH WARRANTY */}
      {activeTab === 'serials' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-widest text-[9px]">Traceable Serial & Batch Register</h3>
            <span className="text-[10px] text-gray-400">Total warranty trackings: {serialBatchLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Godown</th>
                  <th className="p-3">Serial Number</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Warranty Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {serialBatchLogs.map((s, i) => {
                  const wh = warehouses.find(w => w.id === s.warehouseId);
                  return (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="p-3 font-sans font-bold text-gray-800">{s.productName}</td>
                      <td className="p-3 font-sans">{wh?.name || 'Main Warehouse'}</td>
                      <td className="p-3 font-bold text-gray-900">{s.serialNumber || <span className="text-gray-300">N/A</span>}</td>
                      <td className="p-3 font-bold text-gray-900">{s.batchNumber || <span className="text-gray-300">N/A</span>}</td>
                      <td className="p-3 text-amber-800 font-bold">{s.expiryDate || 'No Expiry'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD WAREHOUSE MODAL */}
      {showAddWHModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xl max-w-sm w-full space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h4 className="text-sm font-bold text-gray-900">Create Warehouse / Godown</h4>
              <button onClick={() => setShowAddWHModal(false)} className="text-gray-400 hover:text-black font-semibold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddWarehouse} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Godown Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basement Storage Rack-A"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-bold text-gray-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Unique Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="BASE-A"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Total Capacity (Cub. Ft)</label>
                  <input
                    type="number"
                    value={whCap}
                    onChange={(e) => setWhCap(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Physical Address / Location</label>
                <input
                  type="text"
                  placeholder="Erode Main Road, basement door 10..."
                  value={whLoc}
                  onChange={(e) => setWhLoc(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWHModal(false)}
                  className="px-3 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 cursor-pointer text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-3 py-2 rounded-lg font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
