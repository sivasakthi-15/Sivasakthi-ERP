const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// Header padding
content = content.replace(
  /<div className="flex justify-between items-start gap-6 border-b-2 border-gray-900 pb-5">/,
  `<div className="flex justify-between items-start gap-4 border-b-2 border-gray-900 pb-3">`
);

// Party details padding
content = content.replace(
  /<div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-200 text-xs">/,
  `<div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-200 text-xs">`
);

// Table margin
content = content.replace(
  /<table className="print-page-products w-full text-left mt-5 border-collapse z-10 relative">/,
  `<table className="print-page-products w-full text-left mt-2 border-collapse z-10 relative">`
);

// Table headers padding
content = content.replace(/className="p-2\.5 font-black uppercase text-gray-500"/g, `className="py-1.5 px-2 font-black uppercase text-gray-500"`);
content = content.replace(/className="p-2\.5 text-center font-black uppercase text-gray-500"/g, `className="py-1.5 px-2 text-center font-black uppercase text-gray-500"`);
content = content.replace(/className="w-16 p-2\.5 text-center font-black uppercase text-gray-500"/g, `className="w-16 py-1.5 px-2 text-center font-black uppercase text-gray-500"`);
content = content.replace(/className="w-20 p-2\.5 text-right font-black uppercase text-gray-500"/g, `className="w-20 py-1.5 px-2 text-right font-black uppercase text-gray-500"`);
content = content.replace(/className="w-24 p-2\.5 text-right font-black uppercase text-gray-500"/g, `className="w-24 py-1.5 px-2 text-right font-black uppercase text-gray-500"`);
content = content.replace(/className="w-28 p-2\.5 text-right font-black uppercase text-gray-500"/g, `className="w-28 py-1.5 px-2 text-right font-black uppercase text-gray-500"`);

// Table rows padding (Product)
content = content.replace(/className="p-2\.5 font-bold text-gray-800"/g, `className="py-1.5 px-2 font-bold text-gray-800"`);
content = content.replace(/className="p-2\.5 text-center font-mono text-\[10px\] text-gray-500"/g, `className="py-1.5 px-2 text-center font-mono text-[10px] text-gray-500"`);
content = content.replace(/className="p-2\.5 text-center font-mono text-\[11px\] font-bold"/g, `className="py-1.5 px-2 text-center font-mono text-[11px] font-bold"`);
content = content.replace(/className="p-2\.5 text-right font-mono text-\[11px\]"/g, `className="py-1.5 px-2 text-right font-mono text-[11px]"`);
content = content.replace(/className="p-2\.5 text-center font-mono text-\[11px\] text-red-600"/g, `className="py-1.5 px-2 text-center font-mono text-[11px] text-red-600"`);
content = content.replace(/className="p-2\.5 text-right font-mono font-bold text-gray-900"/g, `className="py-1.5 px-2 text-right font-mono font-bold text-gray-900"`);

// Footer spacing
content = content.replace(
  /<div className="print-invoice-footer z-10 relative mt-6 border-t border-gray-200 pt-5">/,
  `<div className="print-invoice-footer z-10 relative mt-2 border-t border-gray-200 pt-3">`
);

content = content.replace(
  /<div className="grid grid-cols-2 gap-6 items-start">/,
  `<div className="grid grid-cols-2 gap-4 items-start">`
);

// Amount in words
content = content.replace(
  /<div className="mt-4 p-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-3">/,
  `<div className="mt-2 p-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-3">`
);

// Terms & Declarations
content = content.replace(
  /<div className="mt-6 grid grid-cols-2 gap-6 items-end">/,
  `<div className="mt-3 grid grid-cols-2 gap-4 items-end">`
);

// Page number
content = content.replace(
  /<div className="print-page-number-bar text-center text-\[9px\] text-gray-400 mt-5 pt-3 border-t border-gray-50 font-mono flex justify-between items-center">/,
  `<div className="print-page-number-bar text-center text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-50 font-mono flex justify-between items-center">`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated BillPreview margins and paddings");
