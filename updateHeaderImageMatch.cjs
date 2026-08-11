const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

const startHeader = `              {/* Corporate Header block */}
              <div className="print-page-header z-10 relative">`;
const endHeaderRegex = /\{\/\* Customer & Document specifics block \*\/\}[\s\S]*?\{\/\* Product List Table \*\/\}/;

const newBlock = `              {/* Corporate Header block */}
              <div className="print-page-header z-10 relative">
                {/* Header Grid: Logo | Shop Details | Tax Box */}
                <div className="flex justify-between items-center border-b border-gray-900 pb-4 mb-2">
                  
                  {/* LEFT: Large Company Logo */}
                  <div className="w-[180px] flex items-center justify-start">
                    <div className="border border-gray-200 rounded-2xl p-2 bg-white flex flex-col items-center justify-center w-32 h-32 shadow-sm">
                      {businessDetails.appearance?.showLogo && businessDetails.logo ? (
                        <img src={businessDetails.logo} alt="Company logo" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-black text-white rounded-xl flex items-center justify-center font-bold text-4xl tracking-wider font-mono">
                          {(businessDetails.name || 'EL').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CENTER: Shop Details */}
                  <div className="flex-1 text-center flex flex-col items-center justify-center space-y-1.5">
                    <h1 className="text-3xl font-black tracking-tighter text-[#0a192f] uppercase leading-none">
                      {businessDetails.tradingName || businessDetails.name || 'ELECTRICAL ERP'}
                    </h1>
                    
                    <div className="flex items-center justify-center gap-3 py-1">
                      <div className="h-[2px] w-16 bg-gray-300"></div>
                      <p className="text-[14px] text-red-600 font-bold uppercase tracking-widest leading-none">
                        INVOICE
                      </p>
                      <div className="h-[2px] w-16 bg-gray-300"></div>
                    </div>
                    
                    <p className="text-[12px] text-[#0a192f] font-medium leading-relaxed max-w-[300px]">
                      {businessDetails.address || [businessDetails.doorNumber, businessDetails.street, businessDetails.area].filter(Boolean).join(', ')}, {businessDetails.city}, {businessDetails.district ? \`\${businessDetails.district}, \` : ''}{businessDetails.state} - {businessDetails.pincode}
                    </p>
                    
                    <div className="text-[12px] text-[#0a192f] font-bold flex items-center justify-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#0a192f]"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span>{businessDetails.phone} {businessDetails.altPhone && \`| \${businessDetails.altPhone}\`}</span>
                    </div>
                    
                    {businessDetails.appearance?.showGst !== false && businessDetails.gstNumber && (
                      <div className="text-[12px] uppercase font-extrabold text-[#0a192f] pt-0.5">
                        GSTIN : {businessDetails.gstNumber}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Document Specifications */}
                  <div className="w-[180px] flex items-center justify-end h-full">
                    <div className="border border-[#0a192f] rounded-lg overflow-hidden w-full shadow-sm bg-white">
                      <div className="bg-[#0a192f] text-white text-[12px] font-bold text-center py-1.5 tracking-wider uppercase">
                        TAX INVOICE
                      </div>
                      <div className="p-3 space-y-2 text-[11px] text-[#0a192f] bg-white">
                        <div className="flex">
                          <span className="w-10 text-gray-700">No</span>
                          <span className="w-3 text-center">:</span>
                          <span className="flex-1 font-bold pl-1">{bill.billNumber}</span>
                        </div>
                        <div className="flex">
                          <span className="w-10 text-gray-700">Date</span>
                          <span className="w-3 text-center">:</span>
                          <span className="flex-1 font-bold pl-1">{formatDate(bill.date)}</span>
                        </div>
                        <div className="flex">
                          <span className="w-10 text-gray-700">Time</span>
                          <span className="w-3 text-center">:</span>
                          <span className="flex-1 font-bold pl-1">{bill.time || '10:00 AM'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer & Document specifics block */}
                <div className="flex justify-between items-start gap-4 py-3 pb-2 text-[11px] border-b border-gray-900">
                  {/* Left: Customer */}
                  <div className="flex-1 space-y-1.5">
                    <h3 className="text-[12px] font-bold text-[#1a56db] tracking-wide uppercase mb-2">CUSTOMER DETAILS</h3>
                    <div className="flex text-[#0a192f]">
                      <div className="w-28 text-gray-700">Customer Name</div>
                      <div className="w-4 text-center">:</div>
                      <div className="flex-1 font-bold text-[12px]">{bill.customerName}</div>
                    </div>
                    {bill.customerAddress && (
                      <div className="flex text-[#0a192f] mt-1.5">
                        <div className="w-28 text-gray-700">Address</div>
                        <div className="w-4 text-center">:</div>
                        <div className="flex-1 font-medium whitespace-pre-wrap leading-snug text-[11px]">{bill.customerAddress}</div>
                      </div>
                    )}
                  </div>

                  {/* Right: Transport & Dispatch */}
                  <div className="flex-1 space-y-1.5 pl-8">
                    <h3 className="text-[12px] font-bold text-[#1a56db] tracking-wide uppercase mb-2">TRANSPORT & DISPATCH INFO</h3>
                    {formatType === 'challan' ? (
                      <>
                        <div className="flex text-[#0a192f]">
                          <div className="w-28 text-gray-700">Vehicle Number</div>
                          <div className="w-4 text-center">:</div>
                          <div className="flex-1 font-bold">{bill.vehicleNumber || 'TN-37-BY-1234'}</div>
                        </div>
                        <div className="flex text-[#0a192f] mt-1.5">
                          <div className="w-28 text-gray-700">Delivery Agent</div>
                          <div className="w-4 text-center">:</div>
                          <div className="flex-1 font-bold">{bill.deliveryPerson || 'Rajesh Kumar'}</div>
                        </div>
                        <div className="flex text-[#0a192f] mt-1.5">
                          <div className="w-28 text-gray-700">Received By</div>
                          <div className="w-4 text-center">:</div>
                          <div className="flex-1 font-bold">{bill.receivedBy || '_________________'}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex text-[#0a192f]">
                          <div className="w-28 text-gray-700">Invoice Type</div>
                          <div className="w-4 text-center">:</div>
                          <div className="flex-1 font-bold uppercase">{bill.billType} PRICING</div>
                        </div>
                        <div className="flex text-[#0a192f] mt-1.5">
                          <div className="w-28 text-gray-700">Payment Terms</div>
                          <div className="w-4 text-center">:</div>
                          <div className="flex-1 font-bold uppercase">{bill.paymentMode}</div>
                        </div>
                        {bill.linkedInvoiceNumber && (
                          <div className="flex text-amber-800 mt-1.5">
                            <div className="w-28 text-amber-800">Ref Invoice</div>
                            <div className="w-4 text-center">:</div>
                            <div className="flex-1 font-bold uppercase">{bill.linkedInvoiceNumber}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Product List Table */}`;

const regex = new RegExp(startHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?\\{\\/\\* Product List Table \\*\\/\\}');
if (regex.test(content)) {
  content = content.replace(regex, newBlock);
  fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
  console.log("Updated header and customer details section based on exact reference image.");
} else {
  console.log("Regex did not match");
}
