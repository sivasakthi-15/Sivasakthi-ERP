const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// Re-write the header and customer/transport block
const startHeader = `              {/* Corporate Header block */}
              <div className="print-page-header z-10 relative">`;
const endHeaderRegex = /\{\/\* Customer & Document specifics block \*\/\}[\s\S]*?\{\/\* Product List Table \*\/\}/;

const newBlock = `              {/* Corporate Header block */}
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

              {/* Product List Table */}`;

const regex = new RegExp(startHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?\\{\\/\\* Product List Table \\*\\/\\}');
if (regex.test(content)) {
  content = content.replace(regex, newBlock);
  fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
  console.log("Updated header and customer details section");
} else {
  console.log("Regex did not match");
}
