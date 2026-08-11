// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, PurchaseBill, GRN, PurchaseOrder, Supplier } from '../../types';
import { Plus, Search, Trash2, Save, FileText, Download, Check, AlertTriangle, Printer, RotateCcw } from 'lucide-react';

interface InvoiceSectionProps {
  importedGRN?: GRN | null;
  clearImportedGRN?: () => void;
  editingPurchase?: PurchaseBill | null;
  clearEditingPurchase?: () => void;
}

export const InvoiceSection: React.FC<InvoiceSectionProps> = ({ 
  importedGRN, 
  clearImportedGRN,
  editingPurchase,
  clearEditingPurchase
}) => {
  const { 
    suppliers, 
    products, 
    purchases, 
    createPurchase, 
    updatePurchase,
    updateProduct, // used to trigger UI sync
    grns 
  } = useApp();

  // Form States
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceItems, setInvoiceItems] = useState<{
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    purchaseRate: number;
    gstPercent: number;
    taxableValue: number;
    total: number;
  }[]>([]);

  // Item Builder Row States
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [currentGst, setCurrentGst] = useState<number>(18);

  // Additional Charges & Summaries
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [transportCharges, setTransportCharges] = useState<number>(0);
  const [loadingCharges, setLoadingCharges] = useState<number>(0);
  const [packingCharges, setPackingCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [isRoundOff, setIsRoundOff] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  // Payment states
  const [paymentMode, setPaymentMode] = useState('Credit');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // UI States
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<PurchaseBill | null>(null);

  // Load preferred supplier data if selected
  const activeSupplier = useMemo(() => {
    return suppliers.find(s => s.id === supplierId);
  }, [supplierId, suppliers]);

  // Handle incoming GRN import
  useEffect(() => {
    if (importedGRN) {
      setSupplierId(importedGRN.supplierId);
      setDate(importedGRN.date);
      setNotes(`Imported from GRN Note: ${importedGRN.grnNumber}`);
      
      const mappedItems = importedGRN.items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const gst = prod?.gstPercent || 18;
        const totalTaxable = item.quantityReceived * item.rate;
        const totalTax = (totalTaxable * gst) / 100;
        return {
          productId: item.productId,
          name: item.name,
          quantity: item.quantityReceived,
          unit: item.unit,
          purchaseRate: item.rate,
          gstPercent: gst,
          taxableValue: Number(totalTaxable.toFixed(2)),
          total: Number((totalTaxable + totalTax).toFixed(2))
        };
      });

      setInvoiceItems(mappedItems);
      setPaymentMode('Credit'); // default to credit since we received goods first
      
      // Update that the GRN is converted
      importedGRN.isConvertedToInvoice = true;

      if (clearImportedGRN) clearImportedGRN();
    }
  }, [importedGRN]);

  // Handle editing purchase prefill
  useEffect(() => {
    if (!editingPurchase) return;

    setSupplierId(editingPurchase.supplierId);
    setSupplierInvoiceNumber(editingPurchase.supplierInvoiceNumber || '');
    setDate(editingPurchase.date);
    setInvoiceItems(editingPurchase.items.map(item => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      purchaseRate: item.purchaseRate,
      gstPercent: item.gstPercent,
      taxableValue: item.taxableValue,
      total: item.total
    })));
    setDiscountPercent(editingPurchase.discountPercent || 0);
    setDiscountAmount(editingPurchase.discountAmount || 0);
    setTransportCharges(editingPurchase.transportCharges || 0);
    setLoadingCharges(editingPurchase.loadingCharges || 0);
    setPackingCharges(editingPurchase.packingCharges || 0);
    setOtherCharges(editingPurchase.otherCharges || 0);
    setIsRoundOff(editingPurchase.roundOff !== undefined ? !!editingPurchase.roundOff : true);
    setNotes(editingPurchase.notes || '');
    setPaymentMode(editingPurchase.paymentMode || 'Credit');
    setPaidAmount(editingPurchase.paidAmount || 0);
    setFormError('');
    setSuccessMsg('');
  }, [editingPurchase]);

  // Auto-fill product rate/gst on dropdown selection
  const handleProductSelection = (pId: string) => {
    setCurrentProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setCurrentQty(1);
      setCurrentRate(prod.latestPurchaseCost || prod.purchasePrice || 0);
      setCurrentGst(prod.gstPercent || 18);
    }
  };

  const handleAddItemRow = () => {
    if (!currentProductId) {
      setFormError('Please select a product');
      return;
    }
    if (currentQty <= 0) {
      setFormError('Quantity must be greater than zero');
      return;
    }
    if (currentRate < 0) {
      setFormError('Purchase cost rate cannot be negative');
      return;
    }

    const prod = products.find(p => p.id === currentProductId)!;
    
    // Check duplicate rows
    const existingIdx = invoiceItems.findIndex(i => i.productId === currentProductId);
    const itemTaxable = currentQty * currentRate;
    const itemGst = (itemTaxable * currentGst) / 100;
    const itemTotal = itemTaxable + itemGst;

    if (existingIdx >= 0) {
      const updated = [...invoiceItems];
      const prevQty = updated[existingIdx].quantity;
      const nextQty = prevQty + currentQty;
      const nextTaxable = nextQty * currentRate;
      const nextGstVal = (nextTaxable * currentGst) / 100;

      updated[existingIdx].quantity = nextQty;
      updated[existingIdx].purchaseRate = currentRate;
      updated[existingIdx].gstPercent = currentGst;
      updated[existingIdx].taxableValue = Number(nextTaxable.toFixed(2));
      updated[existingIdx].total = Number((nextTaxable + nextGstVal).toFixed(2));
      setInvoiceItems(updated);
    } else {
      setInvoiceItems([...invoiceItems, {
        productId: currentProductId,
        name: prod.name,
        quantity: currentQty,
        unit: prod.unit || 'Pcs',
        purchaseRate: currentRate,
        gstPercent: currentGst,
        taxableValue: Number(itemTaxable.toFixed(2)),
        total: Number(itemTotal.toFixed(2))
      }]);
    }

    // Reset Builder
    setCurrentProductId('');
    setCurrentQty(1);
    setCurrentRate(0);
    setFormError('');
  };

  const handleRemoveItemRow = (idx: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Import directly from GRN in modal
  const handleImportGRNInPlace = (grn: GRN) => {
    setSupplierId(grn.supplierId);
    setDate(grn.date);
    setNotes(`Imported from GRN Note: ${grn.grnNumber}`);
    
    const mappedItems = grn.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const gst = prod?.gstPercent || 18;
      const totalTaxable = item.quantityReceived * item.rate;
      const totalTax = (totalTaxable * gst) / 100;
      return {
        productId: item.productId,
        name: item.name,
        quantity: item.quantityReceived,
        unit: item.unit,
        purchaseRate: item.rate,
        gstPercent: gst,
        taxableValue: Number(totalTaxable.toFixed(2)),
        total: Number((totalTaxable + totalTax).toFixed(2))
      };
    });

    setInvoiceItems(mappedItems);
    grn.isConvertedToInvoice = true;
    setShowImportPanel(false);
  };

  // Summaries Calculations
  const calculations = useMemo(() => {
    const rawSubtotal = invoiceItems.reduce((sum, item) => sum + item.taxableValue, 0);
    const rawGstTotal = invoiceItems.reduce((sum, item) => sum + (item.total - item.taxableValue), 0);
    
    // Discount Calculation (Weighted/Percentage vs Manual)
    let computedDiscount = discountAmount;
    if (discountPercent > 0) {
      computedDiscount = (rawSubtotal * discountPercent) / 100;
    }

    const netTaxable = Math.max(0, rawSubtotal - computedDiscount);
    
    // Add additional charges
    const extraChargesSum = transportCharges + loadingCharges + packingCharges + otherCharges;
    
    let preRoundTotal = netTaxable + rawGstTotal + extraChargesSum;
    let roundOff = 0;
    let finalGrandTotal = preRoundTotal;

    if (isRoundOff) {
      finalGrandTotal = Math.round(preRoundTotal);
      roundOff = Number((finalGrandTotal - preRoundTotal).toFixed(2));
    }

    return {
      subtotal: rawSubtotal,
      gstAmount: rawGstTotal,
      discountAmount: computedDiscount,
      roundOff,
      grandTotal: finalGrandTotal
    };
  }, [
    invoiceItems, 
    discountPercent, 
    discountAmount, 
    transportCharges, 
    loadingCharges, 
    packingCharges, 
    otherCharges, 
    isRoundOff
  ]);

  // Handle defaults for paid amount on total updates
  useEffect(() => {
    if (paymentMode === 'Credit') {
      setPaidAmount(0);
    } else {
      setPaidAmount(calculations.grandTotal);
    }
  }, [calculations.grandTotal, paymentMode]);

  // Handle Form Submission
  const handleSaveInvoice = () => {
    setFormError('');
    setSuccessMsg('');

    if (!supplierId) {
      setFormError('Please select a supplier');
      return;
    }
    if (!supplierInvoiceNumber.trim()) {
      setFormError('Please enter the Supplier Invoice Number');
      return;
    }
    if (invoiceItems.length === 0) {
      setFormError('Invoice must contain at least one product line item');
      return;
    }
    if (paidAmount < 0) {
      setFormError('Paid amount cannot be negative');
      return;
    }
    if (paidAmount > calculations.grandTotal) {
      setFormError('Paid amount cannot exceed the grand total');
      return;
    }

    // SECTION 13: Check duplicate invoice number
    const isDuplicate = purchases.some(p => 
      p.id !== editingPurchase?.id &&
      p.supplierId === supplierId && 
      p.supplierInvoiceNumber?.toLowerCase() === supplierInvoiceNumber.trim().toLowerCase()
    );

    if (isDuplicate) {
      setFormError(`Duplicate Invoice Alert: Supplier already has a booked Invoice with number ${supplierInvoiceNumber}`);
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId)!;

    const balanceAmount = Number((calculations.grandTotal - paidAmount).toFixed(2));

    const invoicePayload = {
      supplierId,
      supplierName: supplier.name,
      date,
      items: invoiceItems,
      subtotal: Number(calculations.subtotal.toFixed(2)),
      gstAmount: Number(calculations.gstAmount.toFixed(2)),
      grandTotal: calculations.grandTotal,
      paidAmount,
      balanceAmount,
      paymentMode,
      supplierInvoiceNumber: supplierInvoiceNumber.trim(),
      discountPercent,
      discountAmount: calculations.discountAmount,
      transportCharges,
      loadingCharges,
      packingCharges,
      otherCharges,
      roundOff: calculations.roundOff,
      notes
    };

    const shouldUpdate = Boolean(editingPurchase);
    const saved = shouldUpdate
      ? updatePurchase(editingPurchase!.id, invoicePayload)
      : (createPurchase(invoicePayload), true);

    if (!saved) {
      setFormError('Unable to save purchase. Please try again.');
      return;
    }

    setSuccessMsg(shouldUpdate ? `Purchase invoice ${editingPurchase?.purchaseNumber} updated successfully.` : `Successfully booked Purchase Invoice for supplier ${supplier.name}`);
    
    const printDraft: PurchaseBill = {
      ...invoicePayload,
      id: editingPurchase?.id || 'temp_print',
      shopId: editingPurchase?.shopId || 'temp',
      purchaseNumber: editingPurchase?.purchaseNumber || 'TEMP',
      createdAt: editingPurchase?.createdAt || new Date().toISOString()
    };

    setLastSavedInvoice(printDraft);

    if (clearEditingPurchase) {
      clearEditingPurchase();
    }

    // Reset Forms
    setSupplierId('');
    setSupplierInvoiceNumber('');
    setInvoiceItems([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setTransportCharges(0);
    setLoadingCharges(0);
    setPackingCharges(0);
    setOtherCharges(0);
    setNotes('');
    setPaymentMode('Credit');
    setPaidAmount(0);
    setCurrentProductId('');
    setCurrentQty(1);
    setCurrentRate(0);
    setCurrentGst(18);
  };

  const handlePrintReceipt = (bill: PurchaseBill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = bill.items.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.purchaseRate.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.gstPercent}%</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Inward Invoice</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .details { display: flex; justify-content: space-between; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
            .totals { text-align: right; margin-top: 20px; font-size: 14px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Purchase Inward Bill</div>
              <p>Invoice Ref: <strong>${bill.supplierInvoiceNumber || 'N/A'}</strong></p>
              <p>Booking Date: ${bill.date}</p>
            </div>
            <div style="text-align: right;">
              <h2>Shop Desk ERP</h2>
              <p>Payment Mode: <strong>${bill.paymentMode}</strong></p>
            </div>
          </div>
          <div class="details">
            <div>
              <h3>Supplier Details:</h3>
              <p><strong>${bill.supplierName}</strong></p>
            </div>
            <div style="text-align: right;">
              <p>Outstanding Settle: <strong>₹${bill.balanceAmount.toFixed(2)}</strong></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">S.No</th>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Cost Rate</th>
                <th style="text-align: center;">GST %</th>
                <th style="text-align: right;">Total (Inc. GST)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
            <div>
              ${bill.notes ? `<p><strong>Notes:</strong> ${bill.notes}</p>` : ''}
            </div>
            <div class="totals">
              <p>Taxable Subtotal: ₹${bill.subtotal.toFixed(2)}</p>
              <p>GST Total: ₹${bill.gstAmount.toFixed(2)}</p>
              ${bill.discountAmount ? `<p>Discount: -₹${bill.discountAmount.toFixed(2)}</p>` : ''}
              ${bill.transportCharges ? `<p>Transport: ₹${bill.transportCharges.toFixed(2)}</p>` : ''}
              ${bill.roundOff ? `<p>Round Off: ₹${bill.roundOff.toFixed(2)}</p>` : ''}
              <p style="font-size: 18px; font-weight: bold;">Grand Total: ₹${bill.grandTotal.toFixed(2)}</p>
              <p style="color: #16a34a;">Paid Amount: ₹${bill.paidAmount.toFixed(2)}</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="invoice-section-container" className="space-y-6">
      {/* Success/Error Alerts */}
      {successMsg && (
        <div id="invoice-success-alert" className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />
            {successMsg}
          </span>
          {lastSavedInvoice && (
            <button
              onClick={() => handlePrintReceipt(lastSavedInvoice)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 font-bold"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Inward Bill
            </button>
          )}
        </div>
      )}

      {formError && (
        <div id="invoice-error-alert" className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm font-medium text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          {formError}
        </div>
      )}

      {/* Invoice Entry Form Card */}
      <div id="invoice-entry-card" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            <h3 className="font-bold text-slate-800">Record Inward Purchase Invoice</h3>
          </div>
          <button
            id="btn-trigger-import-grn"
            onClick={() => setShowImportPanel(!showImportPanel)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Import from GRN
          </button>
        </div>

        {showImportPanel && (
          <div id="grn-import-panel" className="bg-emerald-50/50 p-4 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Select a Verified GRN to Import</h4>
            <div className="flex flex-wrap gap-3">
              {grns.filter(g => !g.isConvertedToInvoice).length === 0 ? (
                <p className="text-slate-500 text-xs italic">No pending goods receipt records available.</p>
              ) : (
                grns.filter(g => !g.isConvertedToInvoice).map(grn => (
                  <button
                    key={grn.id}
                    onClick={() => handleImportGRNInPlace(grn)}
                    className="flex flex-col items-start p-3 bg-white border border-emerald-200 rounded-lg text-left shadow-xs hover:border-emerald-500 transition max-w-xs"
                  >
                    <span className="text-xs font-mono font-bold text-emerald-600">{grn.grnNumber}</span>
                    <span className="text-xs font-semibold text-slate-800 mt-1">{grn.supplierName}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PO Ref: {grn.poNumber} | Value: ₹{grn.grandTotal}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Header Metadata fields */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Supplier</label>
              <select
                id="invoice-supplier-select"
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(supp => (
                  <option key={supp.id} value={supp.id}>{supp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Supplier Invoice No.</label>
              <input
                id="invoice-number-input"
                type="text"
                placeholder="e.g. INV-100234"
                value={supplierInvoiceNumber}
                onChange={e => setSupplierInvoiceNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Invoice Date</label>
              <input
                id="invoice-date-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">System Purchase No.</label>
              <input
                type="text"
                disabled
                value="Auto Generated (PUR-XXXXXX)"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-400 font-mono"
              />
            </div>
          </div>

          {/* Row Builder Item Grid */}
          <div id="invoice-item-builder" className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-xs font-bold uppercase text-slate-600 mb-2 tracking-wider">Add Invoice Line Item</h4>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <select
                  id="invoice-item-product-select"
                  value={currentProductId}
                  onChange={e => handleProductSelection(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name} (Stock: {prod.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  id="invoice-item-qty-input"
                  type="number"
                  placeholder="Invoiced Qty"
                  value={currentQty === 0 ? '' : currentQty}
                  onChange={e => setCurrentQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white"
                />
              </div>
              <div>
                <input
                  id="invoice-item-rate-input"
                  type="number"
                  placeholder="Cost Rate"
                  value={currentRate === 0 ? '' : currentRate}
                  onChange={e => setCurrentRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white"
                />
              </div>
              <div className="flex gap-2">
                <select
                  id="invoice-item-gst-select"
                  value={currentGst}
                  onChange={e => setCurrentGst(parseInt(e.target.value))}
                  className="rounded-lg border border-slate-200 p-2 text-sm bg-white flex-1"
                >
                  <option value={0}>0% GST</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST</option>
                  <option value={28}>28% GST</option>
                </select>
                <button
                  id="btn-invoice-add-item"
                  type="button"
                  onClick={handleAddItemRow}
                  className="rounded-lg bg-emerald-600 px-4 text-white hover:bg-emerald-700 text-sm font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Invoiced Items Grid */}
          {invoiceItems.length > 0 && (
            <div id="invoice-items-table" className="overflow-hidden rounded-lg border border-slate-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Cost Rate (Excl.)</th>
                    <th className="p-3 text-center">GST %</th>
                    <th className="p-3 text-right">Taxable Subtotal</th>
                    <th className="p-3 text-right">Total (Incl. Tax)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {invoiceItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-700">{item.name}</td>
                      <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right">₹{item.purchaseRate.toFixed(2)}</td>
                      <td className="p-3 text-center">{item.gstPercent}%</td>
                      <td className="p-3 text-right">₹{item.taxableValue.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold">₹{item.total.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Ledger Calculations & Additional Charges */}
          <div className="grid gap-6 md:grid-cols-2 border-t border-slate-100 pt-6">
            {/* Additional Charges / Discount Form */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Additional Charges & Discounts</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Discount Percent (%)</label>
                  <input
                    id="discount-percent-input"
                    type="number"
                    value={discountPercent === 0 ? '' : discountPercent}
                    onChange={e => setDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Discount Amount (₹)</label>
                  <input
                    id="discount-amount-input"
                    type="number"
                    value={discountAmount === 0 ? '' : discountAmount}
                    onChange={e => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    disabled={discountPercent > 0}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Transport Charges (₹)</label>
                  <input
                    id="transport-charges-input"
                    type="number"
                    value={transportCharges === 0 ? '' : transportCharges}
                    onChange={e => setTransportCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Loading Charges (₹)</label>
                  <input
                    id="loading-charges-input"
                    type="number"
                    value={loadingCharges === 0 ? '' : loadingCharges}
                    onChange={e => setLoadingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Packing Charges (₹)</label>
                  <input
                    id="packing-charges-input"
                    type="number"
                    value={packingCharges === 0 ? '' : packingCharges}
                    onChange={e => setPackingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Other Surcharges (₹)</label>
                  <input
                    id="other-charges-input"
                    type="number"
                    value={otherCharges === 0 ? '' : otherCharges}
                    onChange={e => setOtherCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Invoice Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record internal accounts details, batch details..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                />
              </div>
            </div>

            {/* Settle / Payment summaries */}
            <div className="rounded-xl bg-slate-50/70 border border-slate-200/50 p-6 flex flex-col justify-between">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Taxable Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{calculations.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST Sum (CGST + SGST):</span>
                  <span className="font-semibold text-slate-800">₹{calculations.gstAmount.toFixed(2)}</span>
                </div>
                {calculations.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Applied:</span>
                    <span>-₹{calculations.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Round Off:</span>
                  <span className="font-semibold text-slate-800">₹{calculations.roundOff.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-slate-900 font-bold">
                  <span>Grand Total (Payable):</span>
                  <span className="text-xl">₹{calculations.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200/60 pt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Payment Mode</label>
                    <select
                      id="invoice-payment-mode"
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="w-full rounded-lg border border-slate-250 p-2 text-sm bg-white"
                    >
                      <option value="Credit">Credit (Outstanding)</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Paid Amount (₹)</label>
                    <input
                      id="invoice-paid-amount"
                      type="number"
                      disabled={paymentMode === 'Credit'}
                      value={paidAmount === 0 ? '' : paidAmount}
                      onChange={e => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full rounded-lg border border-slate-250 p-2 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs font-semibold mt-1">
                  <span className="text-slate-500">Supplier Outstanding Settle:</span>
                  <span className={`font-bold ${calculations.grandTotal - paidAmount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    ₹{(calculations.grandTotal - paidAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  id="btn-invoice-save"
                  type="button"
                  onClick={handleSaveInvoice}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 shadow-md transition"
                >
                  <Save className="h-5 w-5" />
                  Save & Post Purchase Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

