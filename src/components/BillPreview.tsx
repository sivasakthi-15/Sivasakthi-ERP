import { paginateA4PrintDocument } from '../utils/a4InvoicePrintEngine';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bill } from '../types';
import { Printer, FileText, ZoomIn, ZoomOut, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface BillPreviewProps {
  bill: Bill;
  onConvert?: () => void; // Optional callback to trigger reload/tab switch on conversion
}

// Helper: sanitize invoice object for logging (redacts sensitive fields but preserves logos)
const sanitizeBillForLog = (bill: any) => {
  if (!bill) return bill;
  const redacted: any = { ...bill };

  const SENSITIVE = [
    'customerMobile',
    'customerAddress',
    'customerGst',
    'paidAmount',
    'balanceAmount',
    'upi',
    'accountNumber',
    'ifscCode',
    'authorizedSignature'
  ];
  SENSITIVE.forEach(k => { if (Object.prototype.hasOwnProperty.call(redacted, k)) redacted[k] = '[REDACTED]'; });

  // Preserve business/shop logo info (these are important to diagnose layout differences)
  if (redacted.businessDetails) {
    redacted.businessDetails = {
      name: redacted.businessDetails.name,
      logo: redacted.businessDetails.logo,
      appearance: redacted.businessDetails.appearance || undefined,
      upiId: redacted.businessDetails.upiId ? '[REDACTED_UPI]' : undefined
    };
  }
  if (redacted.shop) {
    redacted.shop = {
      name: redacted.shop.name,
      logo: redacted.shop.logo
    };
  }

  // Reduce items to essential fields
  redacted.items = (redacted.items || []).map((it: any) => ({ id: it.id, name: it.name, quantity: it.quantity, rate: it.rate, total: it.total, gstPercent: it.gstPercent }));

  return redacted;
};

// Vector SVG Barcode component
const BarcodeSVG: React.FC<{ value: string }> = ({ value }) => {
  const lines = [];
  let currentPos = 10;
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    const width1 = (charCode % 3) + 1;
    const width2 = ((charCode >> 1) % 2) + 1;
    lines.push(<rect key={`l1-${i}`} x={currentPos} y={5} width={width1} height={35} fill="black" />);
    currentPos += width1 + 2;
    lines.push(<rect key={`l2-${i}`} x={currentPos} y={5} width={width2} height={35} fill="black" />);
    currentPos += width2 + 2;
  }
  return (
    <svg width={currentPos + 10} height={50} className="mx-auto select-none">
      {lines}
      <text x="50%" y={48} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="black">{value}</text>
    </svg>
  );
};

// Vector SVG QR Code component
const QRCodeSVG: React.FC<{ value: string }> = ({ value }) => {
  return (
    <svg width={70} height={70} viewBox="0 0 29 29" className="border border-gray-200 p-1 bg-white rounded shadow-sm select-none">
      <path
        d="M1,1 h7 v7 h-7 z M2,2 v5 h5 v-5 z M4,4 h1 v1 h-1 z M21,1 h7 v7 h-7 z M22,2 v5 h5 v-5 z M24,4 h1 v1 h-1 z M1,21 h7 v7 h-7 z M2,22 v5 h5 v-5 z M4,24 h1 v1 h-1 z M12,2 h2 v2 h-2 z M16,4 h2 v1 h-2 z M11,10 h3 v1 h-3 z M16,12 h2 v3 h-2 z M22,12 h4 v2 h-4 z M10,16 h2 v4 h-2 z M15,18 h4 v2 h-4 z M22,22 h3 v3 h-3 z M12,24 h4 v2 h-4 z M19,25 h2 v2 h-2 z"
        fill="black"
      />
    </svg>
  );
};

export const BillPreview: React.FC<BillPreviewProps> = ({ bill, onConvert }) => {
  // Infer active print format from the bill's document type
  const docType = bill.docType || 'invoice';
  
  // Available template selections
  const [template, setTemplate] = useState<'a4' | 'thermal' | 'a5'>('a4');
  const [formatType, setFormatType] = useState<string>(docType);
  const [zoom, setZoom] = useState(100);
  const { bills, createBill, updateProduct, products, recordPayment } = useApp();
  const [isConverted, setIsConverted] = useState(bill.isConverted || false);

  const handlePrint = async () => {
    await printA4Element();
  };

  // Convert Quotation / Challan / Proforma to Invoice
  const handleConvertToInvoice = () => {
    const updatedItems = bill.items.map(item => ({ ...item }));
    
    // Create new invoice in system
    const invoice = createBill({
      billType: bill.billType,
      date: new Date().toISOString().split('T')[0],
      customerId: bill.customerId,
      customerName: bill.customerName,
      customerMobile: bill.customerMobile,
      customerGst: bill.customerGst,
      items: updatedItems,
      gstEnabled: docType !== 'non_gst', // GST applies unless original was non_gst
      subtotal: bill.subtotal,
      discountPercent: bill.discountPercent,
      discountAmount: bill.discountAmount,
      taxableAmount: bill.taxableAmount,
      cgst: bill.cgst,
      sgst: bill.sgst,
      igst: bill.igst,
      roundOff: bill.roundOff,
      grandTotal: bill.grandTotal,
      paidAmount: bill.grandTotal, // Mark fully paid
      balanceAmount: 0,
      paymentMode: 'cash',
      status: 'saved',
      docType: 'invoice'
    });

    // Mark current document as converted
    bill.isConverted = true;
    bill.convertedToInvoiceId = invoice.id;
    setIsConverted(true);

    if (onConvert) {
      onConvert();
    }
  };

  // Log sanitized invoice object for diagnosis (new invoice preview path)
  useEffect(() => {
    try {
      console.groupCollapsed && console.groupCollapsed('BillPreview - Sanitized bill payload');
      console.log('BillPreview - sanitized:', sanitizeBillForLog(bill));
      console.groupEnd && console.groupEnd();
    } catch (e) {
      console.error('Failed to log sanitized bill in BillPreview', e);
    }
  }, [bill]);

  return (
    <div className="flex flex-col gap-4 font-sans select-none">
      {/* Settings bar */}
      <div className="bg-white border border-gray-150 p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-4 sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-3">
          {/* Page template toggle */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTemplate('a4')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                template === 'a4' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>A4 Paper</span>
            </button>
            <button
              onClick={() => setTemplate('thermal')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                template === 'thermal' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>80mm Thermal</span>
            </button>
            <button
              onClick={() => setTemplate('a5')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                template === 'a5' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>A5 Compact Bill</span>
            </button>
          </div>

          {/* Select Printing Layout format */}
          <select
            value={formatType}
            onChange={(e) => setFormatType(e.target.value)}
            className="border border-gray-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-white cursor-pointer focus:outline-none"
          >
            <option value="invoice">Format 1: Invoice (A4)</option>
            <option value="thermal">Format 2: Thermal POS Receipt</option>
            <option value="non_gst">Format 3: Non-GST Cash Bill</option>
            <option value="quotation">Format 4: Quotation Form</option>
            <option value="challan">Format 5: Delivery Challan</option>
            <option value="proforma">Format 6: Proforma Invoice</option>
            <option value="sales_return">Format 7: Sales Return Receipt</option>
            <option value="purchase_return">Format 8: Purchase Return Slip</option>
            <option value="credit_note">Format 9: Credit Note</option>
            <option value="debit_note">Format 10: Debit Note</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Conversion Actions */}
          {!isConverted && ['quotation', 'challan', 'proforma'].includes(docType) && (
            <button
              onClick={handleConvertToInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Convert to Sales Invoice</span>
            </button>
          )}

          {isConverted && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Converted to Invoice</span>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => setZoom(prev => Math.max(40, prev - 10))}
              className="p-1 hover:bg-white rounded transition-colors cursor-pointer text-gray-500"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-gray-600 w-8 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(150, prev + 10))}
              className="p-1 hover:bg-white rounded transition-colors cursor-pointer text-gray-500"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Layout</span>
          </button>
        </div>
      </div>

      {/* Invoice frame container */}
      <div className="overflow-auto bg-gray-100 p-6 rounded-xl flex justify-center shadow-inner max-h-[72vh] print:overflow-visible print:justify-start print:p-0 print:bg-white print:shadow-none print:max-h-none">
        <div 
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-100 shrink-0 print-no-scale print:scale-100"
        >
          <div className="bg-white text-black p-1 shadow-md">
            {template === 'a4' ? (
              <A4UniversalTemplate bill={bill} formatType={formatType} />
            ) : template === 'thermal' ? (
              <ThermalReceiptTemplate bill={bill} />
            ) : (
              <A5CompactTemplate bill={bill} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   A4 UNIVERSAL TEMPLATE (Handles formats 1, 3, 4, 5, 6, 7, 8, 9, 10)
============================================= */
interface A4UniversalProps {
  bill: Bill;
  formatType: string;
}

// Logo renderer: trims whitespace from uploaded logos and enlarges display without distortion
const LogoRenderer: React.FC<{ src: string; altText?: string }> = ({ src, altText }) => {
  const [displaySrc, setDisplaySrc] = useState<string>(src);

  useEffect(() => {
    let mounted = true;
    const trimImageWhitespace = (srcUrl: string): Promise<string> => {
      return new Promise((resolve) => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(srcUrl);
            ctx.drawImage(img, 0, 0);
            try {
              const data = ctx.getImageData(0, 0, w, h).data;
              let top = h, left = w, right = 0, bottom = 0;
              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  const idx = (y * w + x) * 4;
                  const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
                  const isNotWhite = a > 10 && (r < 250 || g < 250 || b < 250);
                  if (isNotWhite) {
                    if (x < left) left = x;
                    if (x > right) right = x;
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                  }
                }
              }

              if (right <= left || bottom <= top) {
                return resolve(srcUrl);
              }

              const cw = right - left + 1;
              const ch = bottom - top + 1;
              const out = document.createElement('canvas');
              out.width = cw;
              out.height = ch;
              const octx = out.getContext('2d');
              if (!octx) return resolve(srcUrl);
              octx.drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
              resolve(out.toDataURL('image/png'));
            } catch (e) {
              resolve(srcUrl);
            }
          };
          img.onerror = () => resolve(srcUrl);
          img.src = srcUrl;
        } catch (err) {
          resolve(srcUrl);
        }
      });
    };

    if (src) {
      trimImageWhitespace(src).then((res) => { if (mounted) setDisplaySrc(res); }).catch(() => { if (mounted) setDisplaySrc(src); });
    }

    return () => { mounted = false; };
  }, [src]);

  return (
    <img src={displaySrc} alt={altText || 'logo'} className="h-auto max-h-40 w-auto max-w-[14rem] object-contain shrink-0" />
  );
};

const A4UniversalTemplate: React.FC<A4UniversalProps> = ({ bill, formatType }) => {
  const { businessDetails } = useApp();

  const isCancelled = bill.status === 'cancelled';
  const isCredit = bill.status === 'credit' || bill.paymentMode === 'credit';
  
  // Format dates
  const formatDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Determine Title & Labels
  let docTitle = 'INVOICE';
  let subtitle = 'INVOICE';
  let showTaxColumns = true;
  let watermarkText = '';

  if (formatType === 'non_gst') {
    docTitle = 'CASH BILL';
    subtitle = 'Non-GST Retail Bill';
    showTaxColumns = false;
  } else if (formatType === 'quotation') {
    docTitle = 'QUOTATION / PROPOSAL';
    subtitle = 'Price Quotation';
    showTaxColumns = true;
    watermarkText = 'QUOTATION';
  } else if (formatType === 'challan') {
    docTitle = 'DELIVERY CHALLAN';
    subtitle = 'Product Dispatch & Challan';
    showTaxColumns = false;
  } else if (formatType === 'proforma') {
    docTitle = 'PROFORMA INVOICE';
    subtitle = 'Pre-sale Estimate Invoice';
    showTaxColumns = true;
  } else if (formatType === 'sales_return') {
    docTitle = 'SALES RETURN SLIP';
    subtitle = 'Customer Product Refund';
    showTaxColumns = true;
  } else if (formatType === 'purchase_return') {
    docTitle = 'PURCHASE RETURN RECEIPT';
    subtitle = 'Supplier Inventory Outward';
    showTaxColumns = true;
  } else if (formatType === 'credit_note') {
    docTitle = 'CREDIT NOTE';
    subtitle = 'Credit Adjustment / Refund Account';
    showTaxColumns = true;
  } else if (formatType === 'debit_note') {
    docTitle = 'DEBIT NOTE';
    subtitle = 'Debit Charge Adjustment';
    showTaxColumns = true;
  }

  // Double check if GST is disabled globally for the bill
  if (!bill.gstEnabled) {
    showTaxColumns = false;
  }

  // Convert numbers to text words
  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const countWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + countWords(n % 100);
      if (n < 100000) return countWords(Math.floor(n / 1000)) + 'Thousand ' + countWords(n % 1000);
      if (n < 10000000) return countWords(Math.floor(n / 100000)) + 'Lakh ' + countWords(n % 100000);
      return countWords(Math.floor(n / 10000000)) + 'Crore ' + countWords(n % 10000000);
    };

    const integerPart = Math.floor(num);
    const result = countWords(integerPart);
    return result ? result + 'Rupees Only' : 'Zero Rupees Only';
  };

  const pageItems = bill.items;
  const emptyRowsCount = 0;
  const totalPages = 1;

  // Stable pseudo-random key based on bill ID or number
  const stableSeed = bill.id ? parseInt(bill.id.slice(0, 8), 16) : 482915;
  const stableKey = (stableSeed % 1000000).toString().padStart(6, '0');

  return (
    <>
      <div id="a4-print-element" className="w-full flex flex-col gap-6 print:block print:gap-0 print:items-stretch print:justify-start">
      <div
        key="single-page"
        className="print-page w-[800px] bg-white border border-gray-200 p-8 shadow-sm flex flex-col justify-between relative text-gray-900 font-sans print:flex print:flex-col print:justify-between print:w-full print:max-w-none print:border-none print:shadow-none print:p-0 print:mb-0 print:items-stretch mb-6 last:mb-0"
      >
            {/* Watermark Overlay for Quotation / Challans */}
            {watermarkText && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
                <span className="text-gray-100 font-black text-[9rem] tracking-widest uppercase transform rotate-45 opacity-25">
                  {watermarkText}
                </span>
              </div>
            )}

            {/* PAID / CANCELLED Stamps */}
            {isCancelled && (
              <div className="absolute top-1/4 left-1/3 border-4 border-red-500 text-red-500 font-mono font-extrabold text-5xl tracking-widest px-8 py-4 rounded-xl transform -rotate-12 select-none opacity-45 z-20">
                CANCELLED
              </div>
            )}
            {isCredit && formatType === 'invoice' && (
              <div className="absolute top-1/4 left-1/3 border-4 border-amber-500 text-amber-500 font-mono font-extrabold text-5xl tracking-widest px-8 py-4 rounded-xl transform -rotate-12 select-none opacity-45 z-20">
                CREDIT SALE
              </div>
            )}

            {/* Content Top (Header and Product Table) */}
            <div className="flex-1 flex flex-col print:block">
              {/* Corporate Header block */}
              <div className="relative">
                <div className="flex justify-between items-start gap-4 border-b-2 border-gray-900 pb-2">
                  {/* LEFT: Company Logo (fixed width) */}
                  <div className="flex-none w-44 flex items-start justify-start">
                    {businessDetails.appearance?.showLogo && businessDetails.logo ? (
                      <LogoRenderer src={businessDetails.logo} altText={businessDetails.name || 'Company logo'} />
                    ) : (
                      <div className="h-28 w-28 bg-black text-white rounded-xl flex items-center justify-center font-bold text-3xl tracking-wider font-mono shrink-0">
                        {businessDetails.name ? businessDetails.name.slice(0, 2).toUpperCase() : 'EL'}
                      </div>
                    )}
                  </div>

                  {/* CENTER: Company Details (centered vertically & horizontally) */}
                  <div className="flex-1 flex flex-col justify-start items-center text-center space-y-0 pt-0.5">
                    <h1 className="text-lg font-black tracking-tight text-gray-900 leading-none">
                      {businessDetails.name || 'ELECTRICAL ERP'}
                    </h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none pt-0.5">
                      {subtitle === 'GST TAX INVOICE' ? 'INVOICE' : subtitle}
                    </p>
                    <p className="text-[11px] text-gray-600 leading-tight max-w-sm font-medium mx-auto pt-1">
                      {businessDetails.address}
                      {businessDetails.city ? `, ${businessDetails.city}` : ''}{businessDetails.state ? `, ${businessDetails.state}` : ''}{businessDetails.pincode ? ` - ${businessDetails.pincode}` : ''}
                    </p>
                    <div className="text-[11px] text-gray-600 font-medium leading-tight pt-0.5">
                      <div>Phone: <span className="font-semibold text-gray-900">{businessDetails.phone}</span> {businessDetails.altPhone && `| ${businessDetails.altPhone}`}</div>
                      {businessDetails.email && <div>Email: <span className="font-semibold text-gray-900">{businessDetails.email}</span></div>}
                      {businessDetails.gstNumber && <div className="text-[10px] uppercase font-bold text-black">GSTIN: {businessDetails.gstNumber}</div>}
                    </div>
                  </div>

                  {/* RIGHT: Document Specifications (fixed width, keep alignment) */}
                  <div className="flex-none w-44 flex flex-col items-end text-right space-y-1">
                    <span className="text-sm font-black uppercase tracking-wider bg-black text-white px-3 py-1 rounded shadow-sm animate-none">
                      {docTitle}
                    </span>
                    <div className="text-xs text-gray-700 font-mono font-medium pt-1.5 space-y-0.5">
                      <div>No: <span className="font-bold text-black">{bill.billNumber}</span></div>
                      <div>Date: <span className="font-bold text-black">{formatDate(bill.date)}</span></div>
                      {bill.time && <div>Time: <span className="font-bold text-black">{bill.time}</span></div>}
                      {formatType === 'quotation' && (
                        <div className="text-[10px] text-amber-800 font-sans font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded mt-1">
                          Validity: 30 Days (Till {formatDate(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer & Document specifics block */}
                <div className="grid grid-cols-2 gap-4 py-1.5 border-b border-gray-200 text-xs">
                    <div className="space-y-1">
                      <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Party Details</h3>
                      {bill.customerOrganizationName ? (
                        <>
                          <div className="font-bold text-gray-900 text-sm">{bill.customerOrganizationName}</div>
                          <div className="text-gray-600 font-bold text-[10px] uppercase">Attn: {bill.customerName}</div>
                        </>
                      ) : (
                        <div className="font-bold text-gray-900 text-sm">{bill.customerName}</div>
                      )}
                      <div className="text-gray-600 font-medium space-y-0.5">
                        {bill.customerAddress && (
                          <div><span className="font-semibold text-black">{bill.customerAddress}</span></div>
                        )}
                        {/** Customer GST hidden per requested change - only show name and address */}
                          </div>
                      </div>

                  <div className="text-right space-y-1">
                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Transport &amp; Dispatch Info</h3>
                    <div className="text-gray-600 font-medium">
                      {formatType === 'challan' ? (
                        <>
                          <div>Vehicle Number: <span className="font-bold text-black">{bill.vehicleNumber || 'TN-37-BY-1234'}</span></div>
                          <div>Delivery Agent: <span className="font-bold text-black">{bill.deliveryPerson || 'Rajesh Kumar'}</span></div>
                          <div>Received By: <span className="font-bold text-black">{bill.receivedBy || '_________________'}</span></div>
                        </>
                      ) : (
                        <>
                          <div>Invoice Type: <span className="font-bold text-black uppercase">{bill.billType} Pricing</span></div>
                          <div>Payment Terms: <span className="font-bold text-black uppercase">{bill.paymentMode}</span></div>
                          {bill.linkedInvoiceNumber && (
                            <div className="text-amber-800 font-bold">Ref Invoice: {bill.linkedInvoiceNumber}</div>
                          )}
                          {bill.returnReason && (
                            <div className="text-red-600 text-[10px] font-bold">Reason: {bill.returnReason}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product List Table */}
              <div className="mx-auto w-[736px] mt-5 print:w-full print:mt-2">
                <table className="w-full text-left border-collapse relative">
                <thead>
                  <tr className="bg-gray-100 text-[9px] font-bold uppercase tracking-wider text-gray-600 border-y border-gray-200">
                    <th className="w-8 p-2 text-center">S.No</th>
                    <th className="p-2">Material / Item Specification</th>
                    <th className="w-16 p-2 text-center">HSN</th>
                    <th className="w-16 p-2 text-center">Quantity</th>
                    <th className="w-20 p-2 text-right">Unit Rate</th>
                    {bill.items.some(i => i.discountPercent > 0) && <th className="w-14 p-2 text-center">Disc %</th>}
                    {showTaxColumns && <th className="w-14 p-2 text-center">GST %</th>}
                    <th className="w-24 p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-gray-700 divide-y divide-gray-100">
                  {pageItems.map((item, idx) => {
                    const itemSNo = idx + 1;
                    return (
                      <tr key={item.id} className="align-top hover:bg-gray-50/50">
                        <td className="p-2.5 text-center font-mono text-[10px] text-gray-500">{itemSNo}</td>
                        <td className="p-2.5 font-bold text-gray-800">
                          {item.name}
                          {/* Mock batch details if applicable */}
                          {itemSNo === 1 && <span className="block text-[8px] font-mono text-gray-400">Batch: B_EL_9918 &middot; Exp: 12/2029</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono text-[10px] text-gray-500">{item.hsnCode || '8544'}</td>
                        <td className="p-2.5 text-center font-mono text-[11px] font-bold">{item.quantity} {item.unit || 'Nos'}</td>
                        <td className="p-2.5 text-right font-mono text-[11px]">₹{(item.rate ?? 0).toFixed(2)}</td>
                        {bill.items.some(i => i.discountPercent > 0) && (
                          <td className="p-2.5 text-center font-mono text-[11px] text-red-600">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                          </td>
                        )}
                        {showTaxColumns && <td className="p-2.5 text-center font-mono text-[11px]">{item.gstPercent}%</td>}
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">₹{(item.total ?? 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}

                  {/* Empty Rows */}
                  {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => {
                    return (
                      <tr key={`empty-${emptyIdx}`} className="align-top hover:bg-gray-50/50">
                        <td className="p-2.5 text-center font-mono text-[10px] text-gray-500">{"\u00A0"}</td>
                        <td className="p-2.5 font-bold text-gray-800">{"\u00A0"}</td>
                        <td className="p-2.5 text-center font-mono text-[10px] text-gray-500">{"\u00A0"}</td>
                        <td className="p-2.5 text-center font-mono text-[11px] font-bold">{"\u00A0"}</td>
                        <td className="p-2.5 text-right font-mono text-[11px]">{"\u00A0"}</td>
                        {bill.items.some(i => i.discountPercent > 0) && (
                          <td className="p-2.5 text-center font-mono text-[11px] text-red-600">{"\u00A0"}</td>
                        )}
                        {showTaxColumns && (
                          <td className="p-2.5 text-center font-mono text-[11px]">{"\u00A0"}</td>
                        )}
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">{"\u00A0"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Block / Footer */}
            <div className="mt-2 border-t border-gray-200 pt-2 print:mt-1 print:pt-1 print-invoice-footer mt-auto">
                <div className="grid grid-cols-2 gap-4 items-start">
                  
                  {/* Remittance Accounts & Terms */}
                  <div className="space-y-1.5">
                    {/* Bank details card (Hide for Delivery Challan) */}
                    {formatType !== 'challan' && (
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-[10px] text-gray-600 space-y-0.5 font-mono print:bg-transparent print:border-none print:p-0">
                        <span className="font-bold text-gray-800 block text-[10px] uppercase tracking-wider mb-1 font-sans">Bank Details</span>
                        <div>A/C Name: <span className="font-bold text-black">{businessDetails.accountHolder || 'ELECTRICAL STORES'}</span></div>
                        <div>Bank: <span className="font-bold text-black">{businessDetails.bankName || 'HDFC Bank'}</span> - {businessDetails.accountNumber || '50200012345678'}</div>
                        <div>IFSC: <span className="font-bold text-black">{businessDetails.ifscCode || 'HDFC0000123'}</span></div>
                        {businessDetails.upiId && <div className="pt-0.5 text-black font-bold">UPI: {businessDetails.upiId}</div>}
                      </div>
                    )}
                    
                    {formatType === 'challan' && (
                      <div className="border border-dashed border-gray-300 p-2.5 rounded-lg text-[10px] text-gray-500 space-y-1 leading-relaxed print:border-none print:p-0">
                        <span className="font-bold text-gray-700 block uppercase">Gate Pass</span>
                        <div>Checked By: _______________</div>
                        <div>Vehicle: {bill.vehicleNumber || 'TN-37-BY-1234'}</div>
                      </div>
                    )}

                    {/* Amount in words */}
                    <div className="text-[10px] text-gray-600 font-mono bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 print:bg-transparent print:border-none print:p-0 print:pt-1">
                      <span className="font-bold text-gray-700">Amount in Words: </span>
                      <span className="italic font-bold text-black">{numberToWords(bill.grandTotal)}</span>
                    </div>

                    {/* Declarations & terms */}
                    <div className="text-[8px] text-gray-500 pt-1 font-medium">
                      <span className="font-bold text-gray-800 uppercase">Terms: </span>
                      Goods once sold will not be taken back. Interest @ 18% p.a. if not paid in 15 days. Subject to local jurisdiction.
                    </div>
                  </div>

                  {/* Financial calculations and Signature */}
                  <div className="print-invoice-totals space-y-0.5 bg-gray-50 p-4 rounded-xl border border-gray-150 text-xs print:bg-transparent print:border-none print:p-0 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between font-mono text-gray-500">
                        <span>Subtotal</span>
                        <span>₹{(bill.subtotal ?? 0).toFixed(2)}</span>
                      </div>
                      {bill.discountAmount > 0 && (
                        <div className="flex justify-between font-mono text-red-500">
                          <span>Discount ({bill.discountPercent}%)</span>
                          <span>-₹{(bill.discountAmount ?? 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {showTaxColumns ? (
                        <>
                          <div className="flex justify-between font-mono text-gray-500">
                            <span>Taxable Value</span>
                            <span>₹{(bill.taxableAmount ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-mono text-gray-500">
                            <span>CGST</span>
                            <span>₹{(bill.cgst ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-mono text-gray-500">
                            <span>SGST</span>
                            <span>₹{(bill.sgst ?? 0).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between font-mono text-gray-500 font-bold border-t border-dashed border-gray-200 pt-1">
                          <span>Taxable Value</span>
                          <span>₹{(bill.taxableAmount ?? 0).toFixed(2)}</span>
                        </div>
                      )}

                      {bill.roundOff !== 0 && (
                        <div className="flex justify-between font-mono text-gray-500">
                          <span>Round Off</span>
                          <span>₹{(bill.roundOff ?? 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-300 pt-1 flex justify-between items-end">
                        <span className="font-black text-gray-800 text-sm">Grand Total</span>
                        <span className="font-mono font-extrabold text-lg text-black">
                          ₹{(bill.grandTotal ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Authorized Signature (Moved here to eliminate empty grid gaps) */}
                    <div className="mt-4 print:mt-3 text-right self-end">
                      <div className="w-40 inline-block text-center">
                        <div className="h-8 border-b border-gray-400"></div>
                        <div className="text-[10px] font-bold text-gray-700 mt-1">{businessDetails.authorizedSignature || 'Authorized Signatory'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-page / Page numbering indicator */}
                <div className="text-center text-[9px] text-gray-400 mt-2 pt-1 border-t border-gray-100 font-mono flex justify-center items-center print:mt-1">
                  <span className="font-bold text-black">Page 1 of {totalPages}</span>
                </div>
            </div>
      </div>
    </div>
    </>
  );
};

/* ==========================================
   80mm THERMAL RECEIPT TEMPLATE
============================================= */
const ThermalReceiptTemplate: React.FC<BillPreviewProps> = ({ bill }) => {
  const { businessDetails } = useApp();
  
  const formatDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  return (
    <div id="thermal-print-element" className="w-[280px] bg-white text-black p-3 font-mono text-[10px] flex flex-col select-none leading-tight print:p-3 print:border-none print:shadow-none mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-1 mb-1">
        <h2 className="font-black text-[13px] uppercase tracking-tight leading-none pt-1">{businessDetails.name || 'ELECTRICAL ERP'}</h2>
        <p className="text-[9px] pt-1">Tel: {businessDetails.phone}</p>
        {businessDetails.gstNumber && <p className="text-[9px]">GSTIN: {businessDetails.gstNumber}</p>}
      </div>
      <div className="border-b border-dashed border-black mb-1.5 mt-1.5"></div>

      {/* Bill specifications */}
      <div className="grid grid-cols-[60px_10px_auto] gap-x-0 text-[9px] font-medium leading-snug mb-1.5">
        <div>Doc Type</div><div>:</div><div className="font-bold uppercase text-black">{bill.docType || 'INVOICE'}</div>
        <div>No</div><div>:</div><div className="font-bold text-black">{bill.billNumber}</div>
        <div>Date/Time</div><div>:</div><div>{formatDate(bill.date)} {bill.time}</div>
        <div>Customer</div><div>:</div><div className="font-bold text-black">{bill.customerName}</div>
        {bill.customerAddress && (
          <><div>Place</div><div>:</div><div className="font-bold text-black">{bill.customerAddress}</div></>
        )}
        <div>Cashier</div><div>:</div><div>Administrator</div>
      </div>
      <div className="border-b border-dashed border-black mb-1.5"></div>

      {/* Receipt Item List */}
      <table className="w-full text-left text-[10px]">
        <thead>
          <tr className="font-bold border-b border-dashed border-black">
            <th className="w-6 pb-1 align-bottom">No</th>
            <th className="pb-1 pr-1 align-bottom">Item Description</th>
            <th className="w-8 text-center pb-1 align-bottom">Qty</th>
            <th className="w-14 text-right pb-1 align-bottom">Amount</th>
          </tr>
        </thead>
        <tbody className="">
          {bill.items.map((item, index) => (
            <tr key={item.id} className="align-top">
              <td className="pt-2 pr-1">{index + 1}</td>
              <td className="pt-2 pr-1">
                {item.name}
                <span className="block text-[9px] text-gray-800 mt-0.5">@{(item.rate ?? 0).toFixed(2)}</span>
              </td>
              <td className="text-center pt-2">{item.quantity}</td>
              <td className="text-right pt-2">₹{(item.total ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-b border-dashed border-black mt-2 mb-1.5"></div>

      {/* Financials Summary */}
      <div className="text-[10px] space-y-1 font-medium mb-2">
        <div className="flex justify-between">
          <span>Items Subtotal:</span>
          <span>₹{(bill.subtotal ?? 0).toFixed(2)}</span>
        </div>
        {bill.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discounts:</span>
            <span>-₹{(bill.discountAmount ?? 0).toFixed(2)}</span>
          </div>
        )}
        {bill.gstEnabled && (
          <div className="flex justify-between">
            <span>CGST / SGST (Included):</span>
            <span>₹{((bill.cgst ?? 0) + (bill.sgst ?? 0)).toFixed(2)}</span>
          </div>
        )}
        {bill.roundOff !== 0 && (
          <div className="flex justify-between">
            <span>Round Off:</span>
            <span>₹{(bill.roundOff ?? 0).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[11px] pt-0.5">
          <span>GRAND TOTAL:</span>
          <span>₹{(bill.grandTotal ?? 0).toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between pt-0.5">
          <span>Payment Mode:</span>
          <span className="uppercase">{bill.paymentMode}</span>
        </div>

        <div className="flex justify-between">
          <span>Amount Tendered:</span>
          <span>₹{(bill.paidAmount ?? 0).toFixed(2)}</span>
        </div>
        
        {bill.balanceAmount > 0 && (
          <div className="flex justify-between font-bold border-t border-dashed border-black pt-1 mt-1">
            <span>Balance Outstanding:</span>
            <span>₹{(bill.balanceAmount ?? 0).toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-black mb-3"></div>

      {/* Barcode & QR Code for Thermal paper */}
      <div className="flex justify-center mb-3">
        <BarcodeSVG value={bill.billNumber} />
      </div>

      {/* Footer thank-you note */}
      <div className="text-center text-[9px] space-y-1 pb-2">
        <p className="font-bold text-black">♥ THANK YOU FOR VISITING! ♥</p>
        <p>Save Electricity, Save water.</p>
        <p>Invoiced securely via ERP POS Prime</p>
      </div>

      <div className="border-b border-dashed border-black"></div>

    </div>
  );
};

/* ==========================================
   A5 COMPACT BILL TEMPLATE
============================================= */
const A5CompactTemplate: React.FC<BillPreviewProps> = ({ bill }) => {
  const { businessDetails } = useApp();
  
  const formatDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  const totalItemsCount = bill.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const gstAmount = (bill.cgst ?? 0) + (bill.sgst ?? 0) + (bill.igst ?? 0);

  return (
    <div id="a5-print-element" className="w-[148mm] bg-white text-black font-sans select-none mx-auto print:border-none print:shadow-none box-border" style={{ padding: '6px 8px', fontSize: '10px', lineHeight: '1.3' }}>
      
      {/* Header – compact, single-block */}
      <div style={{ textAlign: 'center', borderBottom: '1.5px solid #111', paddingBottom: '3px', marginBottom: '3px' }}>
        <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '1.2' }}>
          {businessDetails.name || 'SHOP NAME'}
        </div>
        {businessDetails.address && (
          <div style={{ fontSize: '9px', color: '#444', lineHeight: '1.2' }}>{businessDetails.address}</div>
        )}
        <div style={{ fontSize: '9px', color: '#444', lineHeight: '1.2' }}>
          Ph: {businessDetails.phone}
          {businessDetails.gstNumber && <span style={{ marginLeft: '8px', fontWeight: 700 }}>GSTIN: {businessDetails.gstNumber}</span>}
        </div>
      </div>

      {/* Invoice meta + Customer – two columns, zero wasted space */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #aaa', paddingBottom: '3px', marginBottom: '3px', fontSize: '9px' }}>
        <div>
          <span style={{ color: '#777', fontWeight: 700, textTransform: 'uppercase', fontSize: '8px' }}>Party: </span>
          <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>{bill.customerName || 'Cash'}</span>
          {bill.customerAddress && <div style={{ color: '#555' }}>{bill.customerAddress}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><span style={{ color: '#777' }}>Invoice: </span><strong>{bill.billNumber}</strong></div>
          <div><span style={{ color: '#777' }}>Date: </span><strong>{formatDate(bill.date)}</strong>{bill.time && <span style={{ marginLeft: '6px', color: '#777' }}>Time: <strong>{bill.time}</strong></span>}</div>
        </div>
      </div>

      {/* Product Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #222', borderTop: '1px solid #222' }}>
            <th style={{ width: '22px', padding: '2px 2px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '8.5px' }}>No</th>
            <th style={{ padding: '2px 3px', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', fontSize: '8.5px' }}>Product Description</th>
            <th style={{ width: '38px', padding: '2px 2px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '8.5px' }}>Qty</th>
            <th style={{ width: '44px', padding: '2px 2px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '8.5px' }}>Rate</th>
            <th style={{ width: '50px', padding: '2px 2px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '8.5px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, index) => (
            <tr key={item.id} style={{ borderBottom: '0.5px solid #e0e0e0', verticalAlign: 'top' }}>
              <td style={{ padding: '2px 2px', textAlign: 'center', color: '#666', fontFamily: 'monospace', fontSize: '8.5px' }}>{index + 1}</td>
              <td style={{ padding: '2px 3px', fontWeight: 600, lineHeight: '1.25' }}>
                {item.name}
                {bill.gstEnabled && item.gstPercent > 0 && (
                  <span style={{ fontSize: '8px', color: '#aaa', marginLeft: '3px' }}>({item.gstPercent}%)</span>
                )}
              </td>
              <td style={{ padding: '2px 2px', textAlign: 'center', fontWeight: 700 }}>
                {item.quantity}<span style={{ fontSize: '8px', fontWeight: 400, color: '#777', marginLeft: '1px' }}>{item.unit || ''}</span>
              </td>
              <td style={{ padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace' }}>{(item.rate ?? 0).toFixed(2)}</td>
              <td style={{ padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{(item.total ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + Declaration – side by side, ultra-compact */}
      <div style={{ borderTop: '1.5px solid #222', marginTop: '3px', paddingTop: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '9px' }}>
        {/* Left: total pieces + mini declaration */}
        <div style={{ width: '48%' }}>
          <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '2px' }}>Total Pcs: <strong>{totalItemsCount}</strong></div>
          <div style={{ fontSize: '7.5px', color: '#666', lineHeight: '1.2' }}>
            <em>We declare that this invoice shows the actual price of the goods and all particulars are true and correct.</em>
          </div>
        </div>

        {/* Right: financial summary */}
        <div style={{ width: '50%', fontSize: '9px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#555' }}>Subtotal:</span>
            <span style={{ fontFamily: 'monospace' }}>₹{(bill.subtotal ?? 0).toFixed(2)}</span>
          </div>
          {bill.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c00' }}>
              <span>Discount:</span>
              <span style={{ fontFamily: 'monospace' }}>-₹{(bill.discountAmount ?? 0).toFixed(2)}</span>
            </div>
          )}
          {gstAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
              <span>GST:</span>
              <span style={{ fontFamily: 'monospace' }}>₹{gstAmount.toFixed(2)}</span>
            </div>
          )}
          {bill.roundOff !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
              <span>Round Off:</span>
              <span style={{ fontFamily: 'monospace' }}>₹{(bill.roundOff ?? 0).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '11px', borderTop: '1px solid #555', marginTop: '2px', paddingTop: '2px' }}>
            <span>Net Amount:</span>
            <span style={{ fontFamily: 'monospace' }}>₹{(bill.grandTotal ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer – single row, minimal height */}
      <div style={{ borderTop: '1px solid #ccc', marginTop: '4px', paddingTop: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '8px' }}>
        <span style={{ color: '#666', fontStyle: 'italic' }}>Thank you! Visit again.</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '0.8px solid #333', width: '100px', marginBottom: '1px' }}></div>
          <span style={{ fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
};

export const printA4Element = async () => {
  let element = document.getElementById('a4-print-element');
  let templateType = 'a4';

  if (!element) {
    element = document.getElementById('thermal-print-element');
    if (element) {
      templateType = 'thermal';
    } else {
      element = document.getElementById('a5-print-element');
      if (element) {
        templateType = 'a5';
      }
    }
  }

  if (!element) {
    alert('Print content not found.');
    return;
  }

  const printWindow = window.open(
    '',
    '_blank',
    templateType === 'thermal' ? 'width=350,height=600' : templateType === 'a5' ? 'width=650,height=900' : 'width=900,height=1200'
  );

  if (!printWindow) {
    alert('Unable to open print window.');
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(s => s.outerHTML)
    .join('');

  let pageStyle = '';
  if (templateType === 'thermal') {
    pageStyle = `body { min-height: 0 !important; width: 80mm !important; margin: 0; padding: 0; background: white !important; }`;
  } else if (templateType === 'a5') {
    pageStyle = `@page { size: A5 portrait; margin: 5mm; } body { width: 148mm !important; margin: 0 auto; padding: 0; background: white !important; }`;
  } else {
    pageStyle = `@page { margin: 0; }`;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print</title>
        ${styles}
        <style>
          @media print {
            ${pageStyle}
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            thead { display: table-header-group; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();

  if (printWindow.document.fonts && printWindow.document.fonts.ready) {
    await printWindow.document.fonts.ready;
  }

  await new Promise<void>(resolve => {
    if (printWindow.document.readyState === 'complete') {
      return resolve();
    }
    printWindow.addEventListener('load', () => resolve(), { once: true });
  });

  await new Promise(resolve => setTimeout(resolve, 250));

  if (templateType === 'thermal') {
    const printElement = printWindow.document.getElementById('thermal-print-element');
    if (printElement) {
      // Wait for any images to load
      const images = Array.from(printElement.getElementsByTagName('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      // Measure height in pixels
      const pxHeight = printElement.offsetHeight;
      // Convert to mm (px * 25.4 / 96) and add 1mm safety allowance to prevent clipping
      const mmHeight = Math.ceil((pxHeight * 25.4) / 96) + 1;
      
      const dynamicStyle = printWindow.document.createElement('style');
      dynamicStyle.innerHTML = `@media print { @page { size: 80mm ${mmHeight}mm !important; margin: 0; } }`;
      printWindow.document.head.appendChild(dynamicStyle);
    }
  }

  if (templateType === 'a4') {
    printWindow.document.body.classList.add('a4-print-measure-mode');
    paginateA4PrintDocument(printWindow.document);
    printWindow.document.body.classList.remove('a4-print-measure-mode');
  }

  printWindow.focus();
  printWindow.print();

  if ('onafterprint' in printWindow) {
    await new Promise<void>((resolve) => {
      const cleanup = () => {
        printWindow.onafterprint = null;
        resolve();
      };
      printWindow.onafterprint = cleanup;
    });
  } else {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  printWindow.close();
};
