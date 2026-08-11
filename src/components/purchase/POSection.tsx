import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder, Product } from '../../types';
import { Plus, Search, Trash2, Calendar, FileText, Check, X, Printer, Eye } from 'lucide-react';

interface POSectionProps {
  onSelectPOForGRN?: (po: PurchaseOrder) => void;
}

export const POSection: React.FC<POSectionProps> = ({ onSelectPOForGRN }) => {
  const { 
    suppliers, 
    products, 
    purchaseOrders, 
    createPurchaseOrder, 
    updatePurchaseOrderStatus 
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; expectedRate: number }[]>([]);
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [formError, setFormError] = useState('');

  // Handle Supplier Selection to auto-set rate from product or preferred rate
  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === supplierId);
  }, [supplierId, suppliers]);

  const handleProductChange = (prodId: string) => {
    setCurrentProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCurrentRate(prod.latestPurchaseCost || prod.purchasePrice || 0);
    }
  };

  const handleAddItem = () => {
    if (!currentProductId) {
      setFormError('Please select a product');
      return;
    }
    if (currentQty <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }
    if (currentRate < 0) {
      setFormError('Rate cannot be negative');
      return;
    }

    // Check duplicate
    const existingIndex = poItems.findIndex(i => i.productId === currentProductId);
    if (existingIndex >= 0) {
      const updated = [...poItems];
      updated[existingIndex].quantity += currentQty;
      setPoItems(updated);
    } else {
      setPoItems([...poItems, { productId: currentProductId, quantity: currentQty, expectedRate: currentRate }]);
    }

    setCurrentProductId('');
    setCurrentQty(1);
    setCurrentRate(0);
    setFormError('');
  };

  const handleRemoveItem = (index: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePO = (status: 'draft' | 'pending') => {
    if (!supplierId) {
      setFormError('Please select a supplier');
      return;
    }
    if (poItems.length === 0) {
      setFormError('Please add at least one product row');
      return;
    }
    if (!deliveryDate) {
      setFormError('Please select expected delivery date');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const items = poItems.map(item => {
      const prod = products.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        name: prod.name,
        quantity: item.quantity,
        receivedQuantity: 0,
        unit: prod.unit || 'Units',
        expectedRate: item.expectedRate,
        total: item.quantity * item.expectedRate
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    createPurchaseOrder({
      supplierId,
      supplierName: supplier.name,
      date: new Date().toISOString().split('T')[0],
      deliveryDate,
      items,
      subtotal,
      grandTotal: subtotal,
      status,
      notes
    });

    // Reset Form
    setIsCreating(false);
    setSupplierId('');
    setDeliveryDate('');
    setNotes('');
    setPoItems([]);
    setFormError('');
  };

  // Filtering
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : po.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  const handlePrintPO = (po: PurchaseOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = po.items.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.expectedRate ?? 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.total ?? 0).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${po.poNumber}</title>
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
              <div class="title">Purchase Order</div>
              <p>PO Number: <strong>${po.poNumber}</strong></p>
              <p>Date: ${po.date}</p>
            </div>
            <div style="text-align: right;">
              <h2>Shop Desk ERP</h2>
              <p>Expected Delivery: <strong>${po.expectedDeliveryDate}</strong></p>
            </div>
          </div>
          <div class="details">
            <div>
              <h3>Supplier Details:</h3>
              <p><strong>${po.supplierName}</strong></p>
            </div>
            <div style="text-align: right;">
              <p>Status: <strong style="text-transform: uppercase;">${po.status}</strong></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">S.No</th>
                <th>Item Details</th>
                <th style="text-align: center;">Expected Qty</th>
                <th style="text-align: right;">Expected Rate</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div class="totals">
            <p>Subtotal: ₹${(po.subtotal ?? 0).toFixed(2)}</p>
            <p style="font-size: 18px;">Grand Total: ₹${(po.grandTotal ?? 0).toFixed(2)}</p>
          </div>
          ${po.notes ? `<div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;"><p><strong>Notes:</strong> ${po.notes}</p></div>` : ''}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="po-section-container" className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Purchase Orders (PO)</h2>
        <button
          id="btn-create-po"
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isCreating ? 'Cancel Draft' : 'Raise New PO'}
        </button>
      </div>

      {isCreating ? (
        /* Create PO Panel */
        <div id="po-creator-card" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-700">Raise Purchase Order</h3>
          
          {formError && (
            <div id="po-form-error" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {formError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Select Supplier</label>
              <select
                id="select-po-supplier"
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(supp => (
                  <option key={supp.id} value={supp.id}>{supp.name} ({supp.city || 'No City'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Expected Delivery Date</label>
              <input
                id="input-po-delivery-date"
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">PO Status</label>
              <input
                type="text"
                value="Draft / Pending Approval"
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500"
              />
            </div>
          </div>

          {/* Add Item Builder Grid */}
          <div id="po-item-builder" className="mt-6 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Add Product Row</h4>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <select
                  id="select-po-item-product"
                  value={currentProductId}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} (Stock: {prod.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  id="input-po-item-qty"
                  type="number"
                  placeholder="Expected Qty"
                  value={currentQty === 0 ? '' : currentQty}
                  onChange={e => setCurrentQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white"
                />
              </div>
              <div className="flex gap-2">
                <input
                  id="input-po-item-rate"
                  type="number"
                  placeholder="Expected Rate"
                  value={currentRate === 0 ? '' : currentRate}
                  onChange={e => setCurrentRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white flex-1"
                />
                <button
                  id="btn-po-item-add"
                  type="button"
                  onClick={handleAddItem}
                  className="rounded-lg bg-emerald-600 px-4 text-white hover:bg-emerald-700 font-medium text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* PO Items Table */}
          {poItems.length > 0 && (
            <div id="po-items-preview" className="mt-6 overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Expected Qty</th>
                    <th className="p-3 text-right">Expected Rate</th>
                    <th className="p-3 text-right">Estimated Total</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {poItems.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-700">{prod?.name || 'Unknown'}</td>
                        <td className="p-3 text-center">{item.quantity} {prod?.unit || 'Pcs'}</td>
                        <td className="p-3 text-right">₹{(item.expectedRate ?? 0).toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold">₹{(item.quantity * item.expectedRate).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PO Notes & Footers */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">PO Note / Terms of Delivery</label>
              <textarea
                id="input-po-notes"
                rows={2}
                placeholder="Include payment terms, packaging conditions, delivery timelines..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-4 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
              <div className="text-slate-700 text-sm">
                Estimated Grand Total: <span className="text-lg font-extrabold text-slate-900">₹{(poItems.reduce((sum, item) => sum + (item.quantity * item.expectedRate), 0) ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  id="btn-po-save-draft"
                  onClick={() => handleSavePO('draft')}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Save as Draft
                </button>
                <button
                  id="btn-po-save-pending"
                  onClick={() => handleSavePO('pending')}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Approve & Issue PO
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PO List Panel */
        <div id="po-list-container" className="space-y-4">
          {/* Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-po-input"
                type="text"
                placeholder="Search PO Number or Supplier Name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <select
              id="filter-po-status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 text-sm focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="partially_received">Partially Received</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* List Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPOs.length === 0 ? (
              <div id="po-empty-state" className="col-span-2 text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">No purchase orders found matching filters.</p>
              </div>
            ) : (
              filteredPOs.map(po => (
                <div
                  key={po.id}
                  id={`po-card-${po.id}`}
                  className={`rounded-xl border p-5 shadow-sm bg-white transition hover:shadow-md flex flex-col justify-between ${
                    selectedPO?.id === po.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {po.poNumber}
                        </span>
                        <h4 className="font-semibold text-slate-800 mt-2">{po.supplierName}</h4>
                      </div>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        po.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        po.status === 'partially_received' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        po.status === 'pending' ? 'bg-sky-50 text-sky-700' :
                        po.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {po.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 my-3">
                      <div>PO Date: <span className="font-medium text-slate-700">{po.date}</span></div>
                      <div>Exp Delivery: <span className="font-medium text-slate-700">{po.deliveryDate}</span></div>
                      <div className="col-span-2">Total Items: <span className="font-medium text-slate-700">{po.items.length} product(s)</span></div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">₹{(po.grandTotal ?? 0).toFixed(2)}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedPO(po)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePrintPO(po)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        title="Print PO"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      {onSelectPOForGRN && po.status !== 'completed' && po.status !== 'cancelled' && po.status !== 'draft' && (
                        <button
                          onClick={() => onSelectPOForGRN(po)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Receive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PO Detail Modal Slider */}
      {selectedPO && (
        <div id="po-detail-modal" className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-4">
          <div className="h-full w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Purchase Order Details</h3>
                  <span className="text-xs font-mono text-emerald-600">{selectedPO.poNumber}</span>
                </div>
                <button
                  onClick={() => setSelectedPO(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Supplier</p>
                    <p className="font-bold text-slate-800">{selectedPO.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">PO Status</p>
                    <span className="inline-block mt-1 rounded px-2 py-0.5 text-xs font-semibold uppercase bg-emerald-100 text-emerald-800">
                      {selectedPO.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">PO Issue Date</p>
                    <p className="font-medium text-slate-700">{selectedPO.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Expected Delivery Date</p>
                    <p className="font-medium text-slate-700">{selectedPO.deliveryDate}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 text-sm">Items Ordered</h4>
                  <div className="overflow-hidden rounded-lg border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-100">
                          <th className="p-2.5">Product</th>
                          <th className="p-2.5 text-center">Ordered</th>
                          <th className="p-2.5 text-center">Received</th>
                          <th className="p-2.5 text-right">Est. Rate</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedPO.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium">{it.name}</td>
                            <td className="p-2.5 text-center">{it.quantity} {it.unit}</td>
                            <td className="p-2.5 text-center">
                              <span className={`font-semibold ${it.receivedQuantity >= it.quantity ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {it.receivedQuantity} {it.unit}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">₹{(it.expectedRate ?? 0).toFixed(2)}</td>
                            <td className="p-2.5 text-right font-semibold">₹{(it.total ?? 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedPO.notes && (
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Notes / Special Instructions</p>
                    <p className="text-sm bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-600 italic">
                      {selectedPO.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-base font-bold text-slate-800">Total: ₹{(selectedPO.grandTotal ?? 0).toFixed(2)}</span>
              <div className="flex gap-2">
                {selectedPO.status === 'pending' && (
                  <button
                    onClick={() => {
                      updatePurchaseOrderStatus(selectedPO.id, 'cancelled');
                      setSelectedPO(null);
                    }}
                    className="rounded-lg bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2 text-xs font-semibold hover:bg-rose-100"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => handlePrintPO(selectedPO)}
                  className="rounded-lg border border-slate-200 bg-white text-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Help linter with missing icon imports
import { AlertTriangle } from 'lucide-react';
