const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// We need to update the table rendering.
// Replace the table header and body opening:
let searchStr = `              <table className="print-page-products w-full text-left mt-1 border-collapse z-10 relative">
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

let replaceStr = `              <table className="print-page-products w-full text-left mt-2 border-collapse border border-gray-400 z-10 relative">
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

content = content.replace(searchStr, replaceStr);

// Now replace the td elements inside pageItems.map
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[10px\] text-gray-500">\{itemSNo\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] text-gray-700 border-r border-gray-300">{itemSNo}</td>');
content = content.replace(/<td className="py-1\.5 px-2 font-bold text-gray-800">/g, '<td className="py-1.5 px-2 font-bold text-[#0a192f] border-r border-gray-300">');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[10px\] text-gray-500">\{item\.hsnCode \|\| '8544'\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] text-gray-700 border-r border-gray-300">{item.hsnCode || \'8544\'}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] font-bold">\{item\.quantity\} \{item\.unit \|\| 'Nos'\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] font-bold border-r border-gray-300">{item.quantity} {item.unit || \'Nos\'}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-right font-mono text-\[11px\]">?\{\(item\.rate \?\? 0\)\.toFixed\(2\)\}<\/td>/g, '<td className="py-1.5 px-2 text-right font-mono text-[11px] border-r border-gray-300">?{(item.rate ?? 0).toFixed(2)}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] text-red-600">\s*\{item\.discountPercent > 0 \? \`\$\{item\.discountPercent\}%\` : '-'\}\s*<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] text-red-600 border-r border-gray-300">\n                            {item.discountPercent > 0 ? `${item.discountPercent}%` : \'-\'}\n                          </td>');
content = content.replace(/<td className="p-2\.5 text-center font-mono text-\[11px\]">\{item\.gstPercent\}%<\/td>/g, '<td className="p-2.5 text-center font-mono text-[11px] border-r border-gray-300">{item.gstPercent}%</td>');

// Update empty rows styling as well
let emptyRowSearch = `<tr key={\`empty-\${emptyIdx}\`} className="print-empty-row align-top hover:bg-gray-50/50">`;
let emptyRowReplace = `<tr key={\`empty-\${emptyIdx}\`} className="print-empty-row align-top border-b-0 hover:bg-gray-50/50">`;
content = content.replace(new RegExp(emptyRowSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emptyRowReplace);

content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[10px\] text-gray-500">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] border-r border-gray-300">{"\\u00A0"}</td>');
content = content.replace(/<td className="py-1\.5 px-2 font-bold text-gray-800">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 font-bold text-[#0a192f] border-r border-gray-300">{"\\u00A0"}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] font-bold">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] font-bold border-r border-gray-300">{"\\u00A0"}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-right font-mono text-\[11px\]">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 text-right font-mono text-[11px] border-r border-gray-300">{"\\u00A0"}</td>');
content = content.replace(/<td className="py-1\.5 px-2 text-center font-mono text-\[11px\] text-red-600">\{"\\u00A0"\}<\/td>/g, '<td className="py-1.5 px-2 text-center font-mono text-[11px] text-red-600 border-r border-gray-300">{"\\u00A0"}</td>');
content = content.replace(/<td className="p-2\.5 text-center font-mono text-\[11px\]">\{"\\u00A0"\}<\/td>/g, '<td className="p-2.5 text-center font-mono text-[11px] border-r border-gray-300">{"\\u00A0"}</td>');


fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated Table styling");
