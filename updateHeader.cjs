const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

const startHeader = `              {/* Corporate Header block */}
              <div className="print-page-header z-10 relative">
                <div className="flex justify-between items-start gap-4 border-b-2 border-gray-900 pb-3">`;

const endHeader = `                    </div>
                  </div>
                </div>`;

let newHeader = `              {/* Corporate Header block */}
              <div className="print-page-header z-10 relative">
                <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 border-b-2 border-gray-900 pb-3 items-center">
                  {/* LEFT: Larger Company Logo */}
                  <div className="flex items-center justify-start h-full">
                    {businessDetails.appearance?.showLogo && businessDetails.logo ? (
                      <img src={businessDetails.logo} alt="Company logo" className="h-20 w-20 rounded-lg object-contain" />
                    ) : (
                      <div className="h-20 w-20 bg-black text-white rounded-lg flex items-center justify-center font-bold text-2xl tracking-wider font-mono">
                        {(businessDetails.name || 'EL').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* CENTER: Shop Details */}
                  <div className="text-center space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-tight uppercase">
                      {businessDetails.tradingName || businessDetails.name || 'ELECTRICAL ERP'}
                    </h1>
                    <p className="text-[12px] text-gray-800 font-bold uppercase tracking-widest">
                      {subtitle}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium pt-1">
                      {businessDetails.address || [businessDetails.doorNumber, businessDetails.street, businessDetails.area].filter(Boolean).join(', ')}, {businessDetails.city}, {businessDetails.district ? \`\${businessDetails.district}, \` : ''}{businessDetails.state} - {businessDetails.pincode}
                    </p>
                    <div className="text-[11px] text-gray-600 font-medium space-y-0.5 justify-center flex flex-col items-center">
                      <div>Phone: <span className="font-semibold text-gray-900">{businessDetails.phone}</span> {businessDetails.altPhone && \`| \${businessDetails.altPhone}\`}</div>
                      {businessDetails.email && <div>Email: <span className="font-semibold text-gray-900">{businessDetails.email}</span></div>}
                      {businessDetails.appearance?.showGst !== false && businessDetails.gstNumber && <div className="text-[11px] uppercase font-bold text-black mt-1">GSTIN: {businessDetails.gstNumber}</div>}
                    </div>
                  </div>

                  {/* RIGHT: Document Specifications */}
                  <div className="text-right space-y-1.5 h-full flex flex-col justify-start items-end">
                    <span className="text-sm font-black uppercase tracking-wider bg-black text-white px-3 py-1 rounded shadow-sm animate-none">
                      {docTitle}
                    </span>
                    <div className="text-xs text-gray-700 font-mono font-medium pt-3 space-y-0.5">
                      <div>No: <span className="font-bold text-black">{bill.billNumber}</span></div>
                      <div>Date: <span className="font-bold text-black">{formatDate(bill.date)}</span></div>
                      {bill.time && <div>Time: <span className="font-bold text-black">{bill.time}</span></div>}
                      {formatType === 'quotation' && (
                        <div className="text-[10px] text-amber-800 font-sans font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded mt-2">
                          Validity: 30 Days (Till {formatDate(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())})
                        </div>
                      )}
                    </div>
                  </div>
                </div>`;

const searchRegex = /\{\/\* Corporate Header block \*\/\}\n\s+<div className="print-page-header z-10 relative">[\s\S]*?\{\/\* Customer & Document specifics block \*\/\}/;

content = content.replace(searchRegex, newHeader + '\n\n                {/* Customer & Document specifics block */}');

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated header layout");
