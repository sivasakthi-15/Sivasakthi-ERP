const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// RESTORE HEADER & CUSTOMER DETAILS
const newHeaderBlock = `              {/* Corporate Header block */}
              <div className="print-page-header z-10 relative">
                {/* Header Grid: Logo | Shop Details | Tax Box */}`;
                
const endHeaderRegex = /\{\/\* Customer & Document specifics block \*\/\}[\s\S]*?\{\/\* Product List Table \*\/\}/;

let searchStrHeader = content.substring(content.indexOf(newHeaderBlock), content.indexOf("{/* Product List Table */}"));

let oldHeader = `              {/* Corporate Header block */}
              <div className="print-page-header z-10 relative">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 border-b border-gray-900 pb-1.5 items-center px-1">
                  {/* LEFT: Larger Company Logo inside a border */}
                  <div className="flex items-center justify-start">
                    <div className="border border-gray-300 rounded-xl p-1.5 flex items-center justify-center">
                      {businessDetails.appearance?.showLogo && businessDetails.logo ? (
                        <img src={businessDetails.logo} alt="Company logo" className="h-20 w-20 object-contain" />
                      ) : (
                        <div className="h-20 w-20 bg-black text-white rounded-lg flex items-center justify-center font-bold text-2xl tracking-wider font-mono">
                          {(businessDetails.name || 'EL').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CENTER: Shop Details */}
                  <div className="text-center space-y-0.5 min-w-[320px]">
                    <h1 className="text-[22px] font-black tracking-tight text-[#0a192f] leading-tight uppercase">
                      {businessDetails.tradingName || businessDetails.name || 'ELECTRICAL ERP'}
                    </h1>
                    <div className="flex items-center justify-center gap-2 py-0.5">
                      <div className="h-[1px] w-12 bg-gray-400"></div>
                      <p className="text-[12px] text-red-600 font-bold uppercase tracking-widest leading-none">
                        INVOICE
                      </p>
                      <div className="h-[1px] w-12 bg-gray-400"></div>
                    </div>
                    <p className="text-[11px] text-[#0a192f] font-medium leading-tight">
                      {businessDetails.address || [businessDetails.doorNumber, businessDetails.street, businessDetails.area].filter(Boolean).join(', ')}, {businessDetails.city}, {businessDetails.district ? \`\${businessDetails.district}, \` : ''}{businessDetails.state} - {businessDetails.pincode}
                    </p>
                    <div className="text-[10px] text-[#0a192f] font-semibold flex items-center justify-center gap-1.5">
                      <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> {businessDetails.phone} {businessDetails.altPhone && \`| \${businessDetails.altPhone}\`}</span>
                    </div>
                    {businessDetails.appearance?.showGst !== false && businessDetails.gstNumber && <div className="text-[11px] uppercase font-bold text-[#0a192f] pt-0.5">GSTIN : {businessDetails.gstNumber}</div>}
                  </div>

                  {/* RIGHT: Document Specifications */}
                  <div className="flex flex-col items-end justify-center h-full">
                    <div className="border border-[#0a192f] rounded-lg overflow-hidden w-44 shadow-sm">
                      <div className="bg-[#0a192f] text-white text-[11px] font-bold text-center py-1 tracking-wider uppercase">
                        TAX INVOICE
                      </div>
                      <div className="p-2 space-y-1.5 text-[10px] text-[#0a192f] font-medium bg-gray-50">
                        <div className="flex justify-between">
                          <span className="w-8">No</span><span className="w-2">:</span><span className="flex-1 font-bold">{bill.billNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="w-8">Date</span><span className="w-2">:</span><span className="flex-1 font-bold">{formatDate(bill.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="w-8">Time</span><span className="w-2">:</span><span className="flex-1 font-bold">{bill.time || '10:00 AM'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer & Document specifics block */}
                <div className="grid grid-cols-2 gap-6 py-2 pb-1 text-[11px] border-b border-gray-900 px-1">
                  {/* Left: Customer */}
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-bold text-blue-700 tracking-wide uppercase mb-1.5">CUSTOMER DETAILS</h3>
                    <table className="w-full text-left text-[#0a192f]">
                      <tbody>
                        <tr>
                          <td className="w-24 align-top py-0.5">Customer Name</td>
                          <td className="w-2 align-top py-0.5">:</td>
                          <td className="font-bold py-0.5">{bill.customerName}</td>
                        </tr>
                        {bill.customerAddress && (
                          <tr>
                            <td className="w-24 align-top py-0.5">Address</td>
                            <td className="w-2 align-top py-0.5">:</td>
                            <td className="font-semibold py-0.5 whitespace-pre-wrap leading-tight">{bill.customerAddress}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Right: Transport & Dispatch */}
                  <div className="space-y-1 pl-4">
                    <h3 className="text-[11px] font-bold text-blue-700 tracking-wide uppercase mb-1.5">TRANSPORT & DISPATCH INFO</h3>
                    <table className="w-full text-left text-[#0a192f]">
                      <tbody>
                        {formatType === 'challan' ? (
                          <>
                            <tr>
                              <td className="w-28 align-top py-0.5">Vehicle Number</td>
                              <td className="w-2 align-top py-0.5">:</td>
                              <td className="font-bold py-0.5">{bill.vehicleNumber || 'TN-37-BY-1234'}</td>
                            </tr>
                            <tr>
                              <td className="w-28 align-top py-0.5">Delivery Agent</td>
                              <td className="w-2 align-top py-0.5">:</td>
                              <td className="font-bold py-0.5">{bill.deliveryPerson || 'Rajesh Kumar'}</td>
                            </tr>
                            <tr>
                              <td className="w-28 align-top py-0.5">Received By</td>
                              <td className="w-2 align-top py-0.5">:</td>
                              <td className="font-bold py-0.5">{bill.receivedBy || '_________________'}</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr>
                              <td className="w-24 align-top py-0.5">Invoice Type</td>
                              <td className="w-2 align-top py-0.5">:</td>
                              <td className="font-bold py-0.5 uppercase">{bill.billType} PRICING</td>
                            </tr>
                            <tr>
                              <td className="w-24 align-top py-0.5">Payment Terms</td>
                              <td className="w-2 align-top py-0.5">:</td>
                              <td className="font-bold py-0.5 uppercase">{bill.paymentMode}</td>
                            </tr>
                            {bill.linkedInvoiceNumber && (
                              <tr>
                                <td className="w-24 align-top py-0.5 text-amber-800">Ref Invoice</td>
                                <td className="w-2 align-top py-0.5 text-amber-800">:</td>
                                <td className="font-bold py-0.5 text-amber-800">{bill.linkedInvoiceNumber}</td>
                              </tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
\n              `;

content = content.replace(searchStrHeader, oldHeader);

// RESTORE TABLE
let oldTableStart = `              <table className="print-page-products w-full text-left mt-1 border-collapse z-10 relative">
                <thead>
                  <tr className="bg-gray-100 text-[9px] font-bold uppercase tracking-wider text-gray-600 border-y border-gray-200">
                    <th className="w-8 py-1.5 px-2 text-center">S.No</th>
                    <th className="py-1.5 px-2">Material / Item Specification</th>
                    <th className="w-16 py-1.5 px-2 text-center">HSN</th>
                    <th className="w-16 py-1.5 px-2 text-center">Quantity</th>
                    <th className="w-20 py-1.5 px-2 text-right">Unit Rate</th>
                    {bill.items.some(i => i.discountPercent > 0) && <th className="w-14 py-1.5 px-2 text-center">Disc %</th>}
                    {showTaxColumns && <th className="w-14 py-1.5 px-2 text-center">GST %</th>}
                    <th className="w-24 py-1.5 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-gray-700 divide-y divide-gray-100">`;

let newTableStart = `              <table className="print-page-products w-full text-left mt-2 border-collapse border border-gray-400 z-10 relative">
                <thead>
                  <tr className="bg-[#f0f4f8] text-[9px] font-bold uppercase tracking-wider text-[#0a192f] border-b border-gray-400">
                    <th className="w-8 py-1.5 px-2 text-center border-r border-gray-400">S.NO</th>
                    <th className="py-1.5 px-2 border-r border-gray-400">MATERIAL / ITEM SPECIFICATION</th>
                    <th className="w-16 py-1.5 px-2 text-center border-r border-gray-400">HSN</th>
                    <th className="w-16 py-1.5 px-2 text-center border-r border-gray-400">QUANTITY</th>
                    <th className="w-20 py-1.5 px-2 text-right border-r border-gray-400">UNIT RATE</th>
                    {bill.items.some(i => i.discountPercent > 0) && <th className="w-14 py-1.5 px-2 text-center border-r border-gray-400">DISC %</th>}
                    {showTaxColumns && <th className="w-14 py-1.5 px-2 text-center border-r border-gray-400">GST %</th>}
                    <th className="w-24 py-1.5 px-2 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-medium text-[#0a192f] divide-y divide-gray-300 border-b border-gray-400">`;

content = content.replace(newTableStart, oldTableStart);

content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] text-gray-700 border-r border-gray-300">\{itemSNo\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[10px] text-gray-500">{itemSNo}</td>');
content = content.replace(/<td className="py-1\.5 px-2 font-bold text-\[#0a192f\] border-r border-gray-300">/g, '<td className="py-1.5 px-2 font-bold text-gray-800">');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] text-gray-700 border-r border-gray-300">\{item\.hsnCode \|\| '8544'\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[10px] text-gray-500">{item.hsnCode || \'8544\'}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] font-bold border-r border-gray-300">\{item\.quantity\} \{item\.unit \|\| 'Nos'\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] font-bold">{item.quantity} {item.unit || \'Nos\'}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-right font-mono text-\[11px\] border-r border-gray-300">?\{\(item\.rate \?\? 0\)\.toFixed\(2\)\}<\/td>/g, '<td className="py-1.5 px-2 text-right font-mono text-[11px]">?{(item.rate ?? 0).toFixed(2)}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] text-red-600 border-r border-gray-300">\s*\{item\.discountPercent > 0 \? \`\$\{item\.discountPercent\}%\` : '-'\}\\s*<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] text-red-600">\n                            {item.discountPercent > 0 ? `${item.discountPercent}%` : \'-\'}\n                          </td>');
content = content.replace(/<td className="p-2\.5 text-center font-mono text-\[11px\] border-r border-gray-300">\{item\.gstPercent\}%<\/td>/g, '<td className="p-2.5 text-center font-mono text-[11px]">{item.gstPercent}%</td>');

let emptyRowSearch = `<tr key={\`empty-\${emptyIdx}\`} className="print-empty-row align-top border-b-0 hover:bg-gray-50/50">`;
let emptyRowReplace = `<tr key={\`empty-\${emptyIdx}\`} className="print-empty-row align-top hover:bg-gray-50/50">`;
content = content.replace(new RegExp(emptyRowSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emptyRowReplace);

content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] border-r border-gray-300">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[10px] text-gray-500">{"\\u00A0"}</td>');
content = content.replace(/<td className="py-1\.5 px-2 font-bold text-\[#0a192f\] border-r border-gray-300">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 font-bold text-gray-800">{"\\u00A0"}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] font-bold border-r border-gray-300">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] font-bold">{"\\u00A0"}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-right font-mono text-\[11px\] border-r border-gray-300">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 text-right font-mono text-[11px]">{"\\u00A0"}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] text-red-600 border-r border-gray-300">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] text-red-600">{"\\u00A0"}</td>');
content = content.replace(/<td className="p-2\.5 text-center font-mono text-\[11px\] border-r border-gray-300">\{"\\u00A0"\}<\/td>/g, '<td className="p-2.5 text-center font-mono text-[11px]">{"\\u00A0"}</td>');

// RESTORE TOTALS
const totalsStart = `                  {/* Remittance Accounts & Terms */}`;
const footerEnd = `            {/* Multi-page / Page numbering indicator */}`;

let searchStrTotals = content.substring(content.indexOf(totalsStart), content.indexOf(footerEnd));

let oldTotals = `                  {/* Remittance Accounts & Terms */}
                  <div className="space-y-4">
                    {/* Bank details card (Hide for Delivery Challan) */}
                    {formatType !== 'challan' && businessDetails.appearance?.showBankDetails !== false && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[10px] text-gray-600 space-y-1 font-mono">
                        <span className="font-bold text-gray-800 block text-[10px] uppercase tracking-wider mb-1 font-sans">Remittance Bank details</span>
                        <div>A/C Holder: <span className="font-bold text-black">{businessDetails.accountHolder || 'ELECTRICAL STORES'}</span></div>
                        <div>Bank Name: <span className="font-bold text-black">{businessDetails.bankName || 'HDFC Bank'}</span></div>
                        <div>A/C Number: <span className="font-bold text-black">{businessDetails.accountNumber || '50200012345678'}</span></div>
                        <div>IFSC Code: <span className="font-bold text-black">{businessDetails.ifscCode || 'HDFC0000123'}</span></div>
                        {businessDetails.upiId && <div className="pt-1 text-black font-bold">UPI: {businessDetails.upiId}</div>}
                      </div>
                    )}

                    {/* Simulated QR Code for Scan & Pay */}
                    {formatType !== 'challan' && businessDetails.appearance?.showQrCode !== false && businessDetails.upiId && (
                      <div className="flex items-center gap-3 bg-white p-2 border border-gray-200 rounded-lg">
                        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center p-1 rounded-md border border-gray-300">
                          <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=\${businessDetails.upiId}&pn=\${businessDetails.name}\`} alt="UPI QR" className="w-full h-full opacity-90" />
                        </div>
                        <div className="text-[9px] text-gray-500 font-medium">
                          <span className="block font-bold text-gray-700">Scan & Pay</span>
                          Any UPI App Supported
                        </div>
                      </div>
                    )}
                    
                    {formatType === 'challan' && (
                      <div className="border border-dashed border-gray-300 p-4 rounded-xl text-[11px] text-gray-500 space-y-2 leading-relaxed">
                        <span className="font-bold text-gray-800 block uppercase">Gate Pass Verification</span>
                        <div>Material Outward Checked By: _____________________</div>
                        <div>Loaded On Vehicle: {bill.vehicleNumber || 'TN-37-BY-1234'}</div>
                        <div>Gate Pass ID: GP-{(Math.random() * 1000).toFixed(0).padStart(4, '0')}</div>
                      </div>
                    )}
                  </div>

                  {/* Financial calculations */}
                  <div className="space-y-1.5 border border-gray-200 p-3 text-[11px] rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between font-mono text-gray-600">
                      <span>Item Subtotal</span>
                      <span>?{(bill.subtotal ?? 0).toFixed(2)}</span>
                    </div>
                    {bill.discountAmount > 0 && (
                      <div className="flex justify-between font-mono text-red-500">
                        <span>Flat discount ({bill.discountPercent}%)</span>
                        <span>-?{(bill.discountAmount ?? 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {showTaxColumns ? (
                      <>
                        <div className="flex justify-between font-mono text-gray-600">
                          <span>Taxable Subtotal</span>
                          <span>?{(bill.taxableAmount ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-mono text-gray-500">
                          <span>Central CGST (9%)</span>
                          <span>?{(bill.cgst ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-mono text-gray-500">
                          <span>State SGST (9%)</span>
                          <span>?{(bill.sgst ?? 0).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between font-mono text-gray-600 font-bold">
                        <span>No-Tax Base Subtotal</span>
                        <span>?{(bill.taxableAmount ?? 0).toFixed(2)}</span>
                      </div>
                    )}

                    {bill.roundOff !== 0 && (
                      <div className="flex justify-between font-mono text-gray-500">
                        <span>Round Off Adjustment</span>
                        <span>?{(bill.roundOff ?? 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-300 pt-2 flex justify-between items-end">
                      <span className="font-black text-gray-800 text-sm">Grand Total (Net)</span>
                      <span className="font-mono font-extrabold text-lg text-black">
                        ?{(bill.grandTotal ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-1.5 flex justify-between text-[11px] font-mono">
                      <span className="text-gray-500">Amount Paid:</span>
                      <span className="font-bold text-emerald-600">?{(bill.paidAmount ?? 0).toFixed(2)}</span>
                    </div>
                    {bill.balanceAmount > 0 && (
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-red-500 font-bold">Ledger Balance due:</span>
                        <span className="font-bold text-red-600">?{(bill.balanceAmount ?? 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount in words */}
                <div className="mt-4 text-[10px] text-gray-600 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-250">
                  <span className="font-bold text-gray-700">Amount in Words: </span>
                  <span className="italic font-bold text-black">{numberToWords(bill.grandTotal)}</span>
                </div>
                {businessDetails.appearance?.showFooter !== false && businessDetails.invoiceFooterMessage && (
                  <div className="mt-3 text-center text-[9px] text-gray-500">{businessDetails.invoiceFooterMessage}</div>
                )}

                {/* Declarations & terms */}
                <div className="mt-6 pt-5 border-t border-gray-150 flex justify-between items-end gap-6 text-[9px] text-gray-500">
                  <div className="max-w-md space-y-1">
                    <span className="font-bold text-gray-800 block text-[10px]">Terms &amp; Declarations</span>
                    <ul className="list-decimal pl-4 space-y-0.5 leading-relaxed font-medium">
                      {(businessDetails.termsAndConditions?.length ? businessDetails.termsAndConditions : [
                        'Goods once sold will not be returned or exchanged.',
                        'Interest at 18% will be charged if payment is not made within 15 days.',
                        'All disputes are subject to local district jurisdiction only.'
                      ]).map((term, index) => <li key={index}>{term}</li>)}
                      {businessDetails.declaration && <li>{businessDetails.declaration}</li>}
                    </ul>
                  </div>

                  <div className="text-center shrink-0 w-44">
                    <div className="h-10 border-b border-gray-300"></div>
                    {businessDetails.appearance?.showSignature !== false && businessDetails.signatureImage && <img src={businessDetails.signatureImage} alt="Authorized signature" className="mx-auto h-10 max-w-44 object-contain" />}
                    {businessDetails.appearance?.showSeal !== false && businessDetails.companySeal && <img src={businessDetails.companySeal} alt="Company seal" className="mx-auto h-10 max-w-44 object-contain" />}
                    <div className="text-[10px] font-bold text-gray-700 mt-1.5">{businessDetails.appearance?.showProprietorName !== false ? (businessDetails.proprietorName || businessDetails.authorizedSignature || 'Proprietor') : ''}</div>
                    {businessDetails.appearance?.showSignature !== false && <span className="text-[8px] text-gray-400 block font-medium">Authorized Signatory Stamp</span>}
                  </div>
                </div>
              </div>
            ) : null}

`;

content = content.replace(searchStrTotals, oldTotals);
fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Restored original UI code");
