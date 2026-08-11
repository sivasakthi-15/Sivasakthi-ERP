// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GRN, PurchaseOrder, Product } from '../../types';
import { Search, Eye, ClipboardCheck, ArrowUpRight, AlertTriangle, Printer, X, FileText, Check } from 'lucide-react';

interface GRNSectionProps {
  onConvertToInvoice: (grn: GRN) => void;
  activePOToReceive?: PurchaseOrder | null;
  clearActivePO?: () => void;
}

export const GRNSection: React.FC<GRNSectionProps> = ({ 
  onConvertToInvoice, 
  activePOToReceive, 
  clearActivePO 
}) => {
  const { 
    purchaseOrders, 
    grns, 
    products, 
    createGRN, 
    updatePurchaseOrderReceivedQty 
  } = useApp();

  const [activePO, setActivePO] = useState<PurchaseOrder | null>(activePOToReceive || null);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [receivedRates, setReceivedRates] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Handle outside activation from PO section
  React.useEffect(() => {
    if (activePOToReceive) {
      setActivePO(activePOToReceive);
      initForm(activePOToReceive);
    }
  }, [activePOToReceive]);

  const initForm = (po: PurchaseOrder) => {
    const qtys: Record<string, number> = {};
    const rates: Record<string, number> = {};
    po.items.forEach(item => {
      const remaining = Math.max(0, item.receivedQuantity - item.receivedQuantity);
      qtys[item.productId] = remaining;
      rates[item.productId] = item.expectedRate;
    });
    setReceivedQtys(qtys);
    setReceivedRates(rates);
    setNotes('');
    setFormError('');
  };

  const handleSelectPO = (po: PurchaseOrder) => {
    setActivePO(po);
    initForm(po);
  };

  const handleCancelReceipt = () => {
    setActivePO(null);
    if (clearActivePO) clearActivePO();
  };

  const handleSaveGRN = () => {
    if (!activePO) return;

    // Validate quantities
    const itemsToReceive = [];
    let hasZeroReceived = true;

    for (const item of activePO.items) {
      const inputQty = receivedQtys[item.productId] || 0;
      const rate = receivedRates[item.productId] || item.expectedRate || 0;

      if (inputQty < 0) {
        setFormError('Received quantity cannot be negative');
        return;
      }

      const remaining = item.receivedQuantity - item.receivedQuantity;
      if (inputQty > remaining) {
        setFormError(`Cannot receive more than remaining ordered quantity (${remaining} ${item.unit} for ${item.name})`);
        return;
      }

      if (inputQty > 0) {
        hasZeroReceived = false;
        itemsToReceive.push({
          productId: item.productId,
          name: item.name,
          quantity: inputQty,
          unit: item.unit,
          purchaseRate: rate,
          total: inputQty * rate
        });
      }
    }

    if (hasZeroReceived) {
      setFormError('Please enter received quantity for at least one product');
      return;
    }

    const subtotal = itemsToReceive.reduce((sum, item) => sum + item.total, 0);

    // 1. Create GRN
    createGRN({
      poId: activePO.id,
      poNumber: activePO.poNumber,
      supplierId: activePO.supplierId,
      supplierName: activePO.supplierName,
      date: new Date().toISOString().split('T')[0],
      items: itemsToReceive,
      subtotal,
      grandTotal: subtotal,
      notes,
      isConvertedToInvoice: false
    });

    // 2. Update PO quantities inside context
    const quantityMap: Record<string, number> = {};
    itemsToReceive.forEach(item => {
      quantityMap[item.productId] = item.receivedQuantity;
    });
    updatePurchaseOrderReceivedQty(activePO.id, quantityMap);

    // Reset Form
    setActivePO(null);
    if (clearActivePO) clearActivePO();
    setFormError('');
  };

  // Filters for GRNs and POs
  const pendingPOs = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'pending' || po.status === 'partially_received');
  }, [purchaseOrders]);

  const filteredGRNs = useMemo(() => {
    return grns.filter(grn => {
      return grn.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
             grn.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             grn.poNumber.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [grns, searchQuery]);

  const handlePrintGRN = (grn: GRN) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = grn.items.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.receivedQuantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.rate ?? 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.total ?? 0).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Goods Receipt Note - ${grn.grnNumber}</title>
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
              <div class="title">Goods Receipt Note (GRN)</div>
              <p>GRN Number: <strong>${grn.grnNumber}</strong></p>
              <p>Receipt Date: ${grn.date}</p>
            </div>
            <div style="text-align: right;">
              <h2>Shop Desk ERP</h2>
              <p>Referenced PO: <strong>${grn.poNumber}</strong></p>
            </div>
          </div>
          <div class="details">
            <div>
              <h3>Supplier details:</h3>
              <p><strong>${grn.supplierName}</strong></p>
            </div>
            <div style="text-align: right;">
              <p>Status: <strong>RECEIVED & VERIFIED</strong></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">S.No</th>
                <th>Item Details</th>
                <th style="text-align: center;">Qty Received</th>
                <th style="text-align: right;">Estimated Rate</th>
                <th style="text-align: right;">Estimated Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div class="totals">
            <p style="font-size: 16px;">Estimated Total Goods Value: ₹${(grn.grandTotal ?? 0).toFixed(2)}</p>
          </div>
          ${grn.notes ? `<div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;"><p><strong>Receipt Notes:</strong> ${grn.notes}</p></div>` : ''}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="grn-section-container" className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Goods Receipt Notes (GRN)</h2>
          <p className="text-xs text-slate-500">Record delivery of stock, verify item quantities and convert shipments into invoices.</p>
        </div>
      </div>

      {activePO ? (
        /* Record GRN Form */
        <div id="grn-recorder-form" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Verify Goods Receipt</h3>
              <p className="text-xs text-slate-500">Receipt against PO: <strong className="text-emerald-600">{activePO.poNumber}</strong> | Supplier: <strong>{activePO.supplierName}</strong></p>
            </div>
            <button
              onClick={handleCancelReceipt}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formError && (
            <div id="grn-form-error" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {formError}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-600">
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Ordered Qty</th>
                  <th className="p-3 text-center">Previously Recv.</th>
                  <th className="p-3 text-center w-36">Receive Now</th>
                  <th className="p-3 text-right">PO Rate</th>
                  <th className="p-3 text-right">Est. Cost Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePO.items.map(item => {
                  const remaining = item.receivedQuantity - item.receivedQuantity;
                  const recvNow = receivedQtys[item.productId] || 0;
                  const rate = receivedRates[item.productId] || item.expectedRate;

                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-700">
                        <div>{item.name}</div>
                        <div className="text-[10px] text-emerald-600 font-bold font-mono mt-0.5">
                          Current Stock: {products.find(p => p.id === item.productId)?.stock ?? 0} {item.unit}
                        </div>
                      </td>
                      <td className="p-3 text-center font-medium text-slate-600">{item.receivedQuantity} {item.unit}</td>
                      <td className="p-3 text-center font-medium text-slate-500">{item.receivedQuantity} {item.unit}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number"
                            value={recvNow === 0 ? '' : recvNow}
                            placeholder={`${remaining} max`}
                            onChange={e => {
                              const v = Math.max(0, parseInt(e.target.value) || 0);
                              setReceivedQtys({ ...receivedQtys, [item.productId]: v });
                            }}
                            className="w-24 text-center rounded-lg border border-slate-200 p-1.5 text-sm font-semibold focus:border-emerald-500"
                            disabled={remaining <= 0}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right">₹{(rate ?? 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        ₹{(recvNow * rate).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Receipt Remarks (e.g., Shortages, Damaged stock notes)</label>
              <textarea
                rows={2}
                placeholder="Notes on packaging, physical inspections, missing quantities..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
              <span className="text-slate-700 text-sm font-semibold">
                Total Shipment Cost Value: <span className="text-lg font-extrabold text-slate-900">
                  ₹{(Object.entries(receivedQtys).reduce((sum, [pId, qty]) => {
                    const rate = Number(receivedRates[pId] || 0);
                    const q = Number(qty || 0);
                    return sum + (q * rate);
                  }, 0) ?? 0).toFixed(2)}
                </span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelReceipt}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGRN}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Verify & Save GRN
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GRN Dash/History lists */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Pending Purchase Orders waiting to be Received */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Awaiting Delivery ({pendingPOs.length})</h3>
            
            {pendingPOs.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs font-medium">
                No pending POs waiting for receipt.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                {pendingPOs.map(po => (
                  <div
                    key={po.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {po.poNumber}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {po.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-700 text-sm mb-1">{po.supplierName}</h4>
                      <p className="text-[10px] text-slate-400">Delivery expected: {po.deliveryDate}</p>
                    </div>

                    <button
                      onClick={() => handleSelectPO(po)}
                      className="mt-4 w-full flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Receive Shipment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Historical / Verified GRN Documents list */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Verified Shipment Records (GRNs)</h3>
            
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search GRN, PO Number or Supplier..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {filteredGRNs.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-sm font-medium">
                No GRN shipment records found.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredGRNs.map(grn => (
                  <div
                    key={grn.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {grn.grnNumber}
                        </span>
                        {grn.isConvertedToInvoice ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Invoiced
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                            Pending Bill
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm mb-2">{grn.supplierName}</h4>
                      
                      <div className="space-y-1 text-xs text-slate-500">
                        <div>Receipt Date: <span className="font-medium text-slate-700">{grn.date}</span></div>
                        <div>Referenced PO: <span className="font-mono text-slate-700">{grn.poNumber}</span></div>
                        <div>Total Goods Value: <span className="font-semibold text-slate-700">₹{(grn.grandTotal ?? 0).toFixed(2)}</span></div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedGRN(grn)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Items
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handlePrintGRN(grn)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                          title="Print GRN Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {!grn.isConvertedToInvoice && (
                          <button
                            onClick={() => onConvertToInvoice(grn)}
                            className="flex items-center gap-1 bg-emerald-600 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Book Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRN Detail slide over / modal */}
      {selectedGRN && (
        <div id="grn-detail-modal" className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-4">
          <div className="h-full w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Goods Receipt Verification</h3>
                  <span className="text-xs font-mono text-slate-500">{selectedGRN.grnNumber}</span>
                </div>
                <button
                  onClick={() => setSelectedGRN(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase">Supplier</p>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedGRN.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase">Referenced PO</p>
                    <p className="font-mono text-slate-800 font-semibold mt-0.5">{selectedGRN.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase">Received Date</p>
                    <p className="font-medium text-slate-700 mt-0.5">{selectedGRN.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase">Invoice Status</p>
                    <span className={`inline-block mt-1 rounded px-2.5 py-0.5 text-[10px] font-bold uppercase ${selectedGRN.isConvertedToInvoice ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {selectedGRN.isConvertedToInvoice ? 'Invoiced' : 'Pending Booking'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 text-sm">Goods Received List</h4>
                  <div className="overflow-hidden rounded-lg border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-100">
                          <th className="p-2.5">Product Name</th>
                          <th className="p-2.5 text-center">Received Qty</th>
                          <th className="p-2.5 text-right">Unit Rate</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedGRN.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-semibold text-slate-800">{it.name}</td>
                            <td className="p-2.5 text-center font-bold text-slate-700">{it.quantity} {it.unit}</td>
                            <td className="p-2.5 text-right">₹{(it.purchaseRate ?? 0).toFixed(2)}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">₹{(it.total ?? 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedGRN.notes && (
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Receipt Remarks</p>
                    <p className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-600 italic">
                      {selectedGRN.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-800">Grand Total Valuation: ₹{(selectedGRN.grandTotal ?? 0).toFixed(2)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintGRN(selectedGRN)}
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

