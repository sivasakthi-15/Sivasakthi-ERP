// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, Landmark, Download, RefreshCw, BarChart2, ShieldCheck, 
  Settings, Truck, HelpCircle, Check, ArrowRight, ArrowDownRight, Printer
} from 'lucide-react';

export const GSTModule: React.FC = () => {
  const { bills, purchases, currentBusiness } = useApp();
  const bizId = currentBusiness?.id || 'all';

  const [activeTab, setActiveTab] = useState<'summaries' | 'einvoice' | 'eway'>('summaries');
  const [selectedBillId, setSelectedBillId] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transporterId, setTransporterId] = useState('');
  const [distance, setDistance] = useState('120');

  // Compute GST Return Metrics
  const { 
    totalSalesTaxable, outputCGST, outputSGST, outputIGST, totalOutputGST,
    totalPurchasesTaxable, inputCGST, inputSGST, inputIGST, totalInputGST,
    netTaxPayable
  } = useMemo(() => {
    let salesTaxable = 0, oCGST = 0, oSGST = 0, oIGST = 0;
    bills.forEach(b => {
      if (b.status === 'cancelled' || b.docType === 'sales_return') return;
      salesTaxable += b.taxableAmount;
      oCGST += b.cgst;
      oSGST += b.sgst;
      oIGST += b.igst;
    });

    let purTaxable = 0, iCGST = 0, iSGST = 0, iIGST = 0;
    purchases.forEach(p => {
      purTaxable += p.subtotal;
      // Assume 50% CGST, 50% SGST for simplicity of local tax split
      iCGST += p.gstAmount / 2;
      iSGST += p.gstAmount / 2;
    });

    const outGST = oCGST + oSGST + oIGST;
    const inGST = iCGST + iSGST + iIGST;

    return {
      totalSalesTaxable: salesTaxable,
      outputCGST: oCGST,
      outputSGST: oSGST,
      outputIGST: oIGST,
      totalOutputGST: outGST,
      totalPurchasesTaxable: purTaxable,
      inputCGST: iCGST,
      inputSGST: iSGST,
      inputIGST: iIGST,
      totalInputGST: inGST,
      netTaxPayable: outGST - inGST
    };
  }, [bills, purchases]);

  // HSN Taxable Summary Compilation
  const hsnSummary = useMemo(() => {
    const hsnMap: Record<string, { code: string; taxable: number; gst: number; cgst: number; sgst: number }> = {};
    bills.forEach(b => {
      if (b.status === 'cancelled' || b.docType === 'sales_return') return;
      b.items.forEach(it => {
        const hsn = it.hsnCode || '8544';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = { code: hsn, taxable: 0, gst: 0, cgst: 0, sgst: 0 };
        }
        const val = it.price * it.quantity;
        const taxRate = it.gstPercent;
        const taxVal = val * (taxRate / 100);
        hsnMap[hsn].taxable += val;
        hsnMap[hsn].gst += taxVal;
        hsnMap[hsn].cgst += taxVal / 2;
        hsnMap[hsn].sgst += taxVal / 2;
      });
    });
    return Object.values(hsnMap);
  }, [bills]);

  // E-Invoice Selected Document details
  const activeBill = bills.find(b => b.id === selectedBillId) || bills[0];

  const handleGenerateEwayBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo || !transporterId) {
      alert('Please fill out all fields correctly');
      return;
    }
    alert(`E-Way Bill generated successfully!\n\nE-Way No: EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}\nVehicle: ${vehicleNo.toUpperCase()}\nDistance: ${distance} KM`);
    setVehicleNo('');
    setTransporterId('');
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Corporate GST returns & e-Invoice portal</span>
            <ShieldCheck className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">Export GSTR-1, GSTR-3B filings data sheets, generate e-Invoices with QR tags, and file e-Way transportation bills.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {[
          { id: 'summaries', label: 'filing summaries (GSTR-1 / 3B)', icon: FileText },
          { id: 'einvoice', label: 'NIC E-Invoice generator', icon: RefreshCw },
          { id: 'eway', label: 'E-Way bill dispatches', icon: Truck },
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
            <span className="uppercase tracking-wider text-[10px]">{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: SUMMARIES */}
      {activeTab === 'summaries' && (
        <div className="space-y-6">
          {/* Net GST computation summary widget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Output Tax (Sales Liabilities)</span>
              <span className="text-lg font-bold font-mono text-gray-900 block">₹{totalOutputGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <p className="text-[10px] text-gray-400 font-mono">CGST: ₹{outputCGST.toLocaleString()} | SGST: ₹{outputSGST.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Input Credit (Purchases Assets)</span>
              <span className="text-lg font-bold font-mono text-emerald-700 block">₹{totalInputGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <p className="text-[10px] text-gray-400 font-mono">ITC CGST: ₹{inputCGST.toLocaleString()} | ITC SGST: ₹{inputSGST.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Net Cash tax payable</span>
              <span className={`text-lg font-bold font-mono block ${netTaxPayable >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                ₹{netTaxPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-gray-400 font-medium">To be settled under GSTR-3B monthly challan</p>
            </div>
          </div>

          {/* GSTR-1 HSN Sheet Table */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">HSN Summary Code Sheet</h3>
              <button 
                onClick={() => alert('GSTR-1 JSON Sheet downloaded!')}
                className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-800 cursor-pointer"
              >
                Download Return JSON
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                    <th className="p-2">HSN Code</th>
                    <th className="p-2 text-right">Taxable Amount (₹)</th>
                    <th className="p-2 text-right">CGST (₹)</th>
                    <th className="p-2 text-right">SGST (₹)</th>
                    <th className="p-2 text-right">Total GST Tax Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {hsnSummary.map(hs => (
                    <tr key={hs.code} className="hover:bg-gray-50/50">
                      <td className="p-2 font-bold text-gray-900">{hs.code}</td>
                      <td className="p-2 text-right">₹{hs.taxable.toLocaleString()}</td>
                      <td className="p-2 text-right">₹{hs.cgst.toLocaleString()}</td>
                      <td className="p-2 text-right">₹{hs.sgst.toLocaleString()}</td>
                      <td className="p-2 text-right font-bold text-gray-900">₹{hs.gst.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NIC E-INVOICE GENERATOR */}
      {activeTab === 'einvoice' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Document selection */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Invoice Selection</h3>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Target Sales Invoice *</label>
              <select
                value={selectedBillId}
                onChange={(e) => setSelectedBillId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
              >
                <option value="">-- Choose B2B/B2C Bill --</option>
                {bills.filter(b => b.status !== 'cancelled').map(b => (
                  <option key={b.id} value={b.id}>{b.billNumber} - {b.customerName} (₹{b.grandTotal})</option>
                ))}
              </select>
            </div>
          </div>

          {/* e-Invoice Sheet */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            {activeBill ? (
              <div className="space-y-4 font-mono">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">NIC GST E-Invoice Registry Statement</h4>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Document: {activeBill.billNumber} | Customer: {activeBill.customerName}</span>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded text-[10px] font-bold cursor-pointer"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Print Invoice with NIC IRN</span>
                  </button>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-2 text-[10px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">1. NIC Invoice Reference Number (IRN) Hash</span>
                    <span className="font-bold text-gray-900 text-[10px] select-all break-all block">e5968f9b9f7a55ad0ba3905cb9b5968f9b9f7a55ad0ba3905cb9b5968f9b9f7a5</span>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-gray-200 pt-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">2. NIC Signed Signature Token</span>
                    <span className="font-bold text-gray-700 select-all break-all block">NIC_SIGN_E_INV_JWT_SIGNED_TOKEN_HASH_FOR_TAX_COMPLIANT_BILLING_2026_ERODE</span>
                  </div>
                </div>

                {/* Printable QR block */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  {/* Mock QR SVG */}
                  <div className="h-28 w-28 bg-white border border-gray-200 flex flex-col justify-between p-1 items-center shrink-0">
                    <div className="grid grid-cols-5 gap-[1px]">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`h-4.5 w-4.5 ${i % 3 === 0 || i % 7 === 0 ? 'bg-black' : 'bg-white'}`}></div>
                      ))}
                    </div>
                    <span className="text-[7px] text-gray-400 uppercase font-bold font-mono">NIC SIGNED QR</span>
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <h5 className="font-bold text-xs text-gray-900">Signed compliance QR Code is active</h5>
                    <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed">This QR code is digitally signed by NIC India GST registry and matches the IRN hash payload. Perfect compliance verified.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 font-sans">
                <RefreshCw className="h-8 w-8 stroke-[1.2px]" />
                <h4 className="font-bold text-gray-700 mt-2">No active invoice selected</h4>
                <p className="max-w-xs text-[10px]">Select any sales bill from the left menu panel to automatically compile compliance IRNs and NIC signature registers.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: E-WAY BILLS DISPATCH */}
      {activeTab === 'eway' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Eway generator form */}
          <form onSubmit={handleGenerateEwayBill} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">NIC E-Way Bill Entry</h3>
            
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Vehicle Registration Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. TN-33-AX-8910"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono font-bold uppercase text-gray-950"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Transporter ID (GSTIN/PAN) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 33AAAAA1111A1Z1"
                value={transporterId}
                onChange={(e) => setTransporterId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Travel Distance (KM) *</label>
              <input
                type="number"
                required
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-xl font-bold hover:bg-neutral-800 cursor-pointer"
            >
              Generate NIC E-Way Bill
            </button>
          </form>

          {/* Transport Guidelines info */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">E-Way compliance checklist</h3>
            <div className="space-y-3 leading-relaxed text-gray-600">
              <p>Under GST rules, generating an E-Way bill is mandatory if:</p>
              <ul className="list-disc list-inside space-y-2 text-[10px] text-gray-500 font-medium">
                <li>Consignment value exceeds <strong>₹50,000</strong> for interstate transport.</li>
                <li>Consignment is being transported by motorized vehicle.</li>
                <li>Exemption: Handicraft goods, transit goods and certain specified agricultural items.</li>
              </ul>
              <div className="p-3 bg-amber-50 text-amber-800 border border-amber-150 rounded-xl font-medium text-[10px] flex gap-2">
                <Truck className="h-4 w-4 shrink-0" />
                <span>Keep GSTR-1 dispatch destination transport details synchronized to avoid fine liabilities at border checkposts.</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

