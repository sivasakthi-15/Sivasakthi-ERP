const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

const totalsStart = `                  {/* Remittance Accounts & Terms */}`;
const footerEnd = `            {/* Multi-page / Page numbering indicator */}`;

let searchStr = content.substring(content.indexOf(totalsStart), content.indexOf(footerEnd));

// We need to rewrite this entire block to match the visual redesign.

let newStr = `                  {/* Remittance Accounts & Terms */}
                  <div className="space-y-1">
                    {/* Bank details card (Hide for Delivery Challan) */}
                    {formatType !== 'challan' && businessDetails.appearance?.showBankDetails !== false && (
                      <div className="border border-blue-400 rounded p-2 text-[10px] text-[#0a192f] space-y-0.5 font-mono bg-[#f8fbff] h-full">
                        <span className="font-bold text-blue-700 block text-[11px] uppercase tracking-wider mb-1.5 font-sans">REMITTANCE BANK DETAILS</span>
                        <table className="w-full text-left font-sans">
                          <tbody>
                            <tr>
                              <td className="w-24 py-0.5 font-semibold text-gray-700">A/C Holder</td>
                              <td className="w-2 py-0.5">:</td>
                              <td className="font-bold py-0.5">{businessDetails.accountHolder || 'Ramasamy'}</td>
                            </tr>
                            <tr>
                              <td className="w-24 py-0.5 font-semibold text-gray-700">Bank Name</td>
                              <td className="w-2 py-0.5">:</td>
                              <td className="font-bold py-0.5">{businessDetails.bankName || 'TGB'}</td>
                            </tr>
                            <tr>
                              <td className="w-24 py-0.5 font-semibold text-gray-700">A/C Number</td>
                              <td className="w-2 py-0.5">:</td>
                              <td className="font-bold py-0.5">{businessDetails.accountNumber || '975502860086678'}</td>
                            </tr>
                            <tr>
                              <td className="w-24 py-0.5 font-semibold text-gray-700">IFSC Code</td>
                              <td className="w-2 py-0.5">:</td>
                              <td className="font-bold py-0.5">{businessDetails.ifscCode || 'IOBA0008753'}</td>
                            </tr>
                            {businessDetails.upiId && (
                              <tr>
                                <td className="w-24 py-0.5 font-semibold text-gray-700">UPI ID</td>
                                <td className="w-2 py-0.5">:</td>
                                <td className="font-bold py-0.5">{businessDetails.upiId}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {formatType === 'challan' && (
                      <div className="border border-dashed border-gray-300 p-3 rounded-lg text-[10px] text-gray-500 space-y-1.5 leading-relaxed h-full">
                        <span className="font-bold text-gray-700 block uppercase">Gate Pass Verification</span>
                        <div>Material Outward Checked By: _____________________</div>
                        <div>Loaded On Vehicle: {bill.vehicleNumber || 'TN-37-BY-1234'}</div>
                        <div>Gate Pass ID: GP-{(Math.random() * 1000).toFixed(0).padStart(4, '0')}</div>
                      </div>
                    )}
                  </div>

                  {/* Financial calculations */}
                  <div className="space-y-1 border border-gray-400 p-2 text-[11px] rounded bg-white">
                    <div className="flex justify-between font-mono text-gray-700">
                      <span>Item Subtotal</span>
                      <span>?{(bill.subtotal ?? 0).toFixed(2)}</span>
                    </div>
                    {bill.discountAmount > 0 && (
                      <div className="flex justify-between font-mono text-red-600">
                        <span>Flat discount ({bill.discountPercent}%)</span>
                        <span>-?{(bill.discountAmount ?? 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {showTaxColumns ? (
                      <>
                        <div className="flex justify-between font-mono text-gray-700">
                          <span>Taxable Subtotal</span>
                          <span>?{(bill.taxableAmount ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-mono text-gray-700">
                          <span>Central CGST (9%)</span>
                          <span>?{(bill.cgst ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-mono text-gray-700">
                          <span>State SGST (9%)</span>
                          <span>?{(bill.sgst ?? 0).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between font-mono text-gray-700 font-bold">
                        <span>No-Tax Base Subtotal</span>
                        <span>?{(bill.taxableAmount ?? 0).toFixed(2)}</span>
                      </div>
                    )}

                    {bill.roundOff !== 0 && (
                      <div className="flex justify-between font-mono text-gray-700">
                        <span>Round Off</span>
                        <span>?{(bill.roundOff ?? 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t-[1.5px] border-blue-900 pt-1.5 mt-1.5 flex justify-between items-center">
                      <span className="font-black text-[#0a192f] text-[13px]">Grand Total (Net)</span>
                      <span className="font-mono font-black text-[15px] text-[#0a192f]">
                        ?{(bill.grandTotal ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] font-mono mt-1">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-bold text-emerald-600">?{(bill.paidAmount ?? 0).toFixed(2)}</span>
                    </div>
                    {bill.balanceAmount > 0 && (
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-red-500 font-bold">Balance Due:</span>
                        <span className="font-bold text-red-600">?{(bill.balanceAmount ?? 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount in words */}
                <div className="mt-1.5 text-[11px] text-[#0a192f] font-sans border border-blue-400 px-2 py-1.5 bg-[#f8fbff] rounded">
                  <span className="font-bold text-blue-700 mr-2">Amount In Words :</span>
                  <span className="font-bold italic">{numberToWords(bill.grandTotal)} Rupees Only</span>
                </div>
                {businessDetails.appearance?.showFooter !== false && businessDetails.invoiceFooterMessage && (
                  <div className="mt-3 text-center text-[9px] text-gray-500">{businessDetails.invoiceFooterMessage}</div>
                )}

                </div>
              ) : null}
            </div>

            <div className="print-page-bottom mt-auto">
              {isLastPage ? (
                <div className="print-invoice-footer z-10 relative mt-1 pt-1">
                  {/* Declarations & terms */}
                <div className="mt-1 pt-1 flex justify-between items-end gap-6 text-[9px] text-[#0a192f]">
                  <div className="max-w-md space-y-1">
                    <span className="font-bold text-blue-700 block text-[10px]">Terms & Declarations</span>
                    <ul className="list-decimal pl-4 space-y-0.5 leading-tight font-medium">
                      {(businessDetails.termsAndConditions?.length ? businessDetails.termsAndConditions : [
                        'Goods once sold will not be returned or exchanged.',
                        'Interest @ 18% will be charged if payment is not made within 15 days.',
                        'All disputes are subject to Pudukkottai Jurisdiction only.',
                        'We declare that this invoice shows the actual price of goods described.'
                      ]).map((term, index) => <li key={index}>{term}</li>)}
                      {businessDetails.declaration && <li>{businessDetails.declaration}</li>}
                    </ul>
                  </div>

                  <div className="text-center shrink-0 w-48">
                    <div className="h-6 border-b-[1.5px] border-gray-400"></div>
                    {businessDetails.appearance?.showSignature !== false && businessDetails.signatureImage && <img src={businessDetails.signatureImage} alt="Authorized signature" className="mx-auto h-8 max-w-44 object-contain" />}
                    {businessDetails.appearance?.showSeal !== false && businessDetails.companySeal && <img src={businessDetails.companySeal} alt="Company seal" className="mx-auto h-8 max-w-44 object-contain" />}
                    <div className="text-[11px] font-bold text-[#0a192f] mt-1.5">{businessDetails.appearance?.showProprietorName !== false ? (businessDetails.proprietorName || businessDetails.authorizedSignature || 'K. Ramasamy') : ''}</div>
                    {businessDetails.appearance?.showSignature !== false && <span className="text-[10px] text-blue-700 block font-medium">Authorised Signatory</span>}
                  </div>
                </div>
              </div>
            ) : null}

`;

content = content.replace(searchStr, newStr);
fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated Totals and Footer styling");
