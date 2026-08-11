const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

content = content.replace(
  /className="print-invoice-footer z-10 relative mt-2 border-t border-gray-200 pt-3"/g,
  `className="print-invoice-footer z-10 relative mt-1 border-t border-gray-200 pt-1.5"`
);

content = content.replace(
  /className="grid grid-cols-2 gap-4 items-start"/g,
  `className="grid grid-cols-2 gap-3 items-start"`
);

// Bank details outer wrapper space-y-4 -> space-y-2
content = content.replace(
  /className="space-y-4"/g,
  `className="space-y-2"`
);

// Bank details p-3 -> p-1.5
content = content.replace(
  /className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-\[10px\] text-gray-600 space-y-1 font-mono"/g,
  `className="bg-gray-50 p-1.5 rounded-lg border border-gray-200 text-[10px] text-gray-600 space-y-0.5 font-mono"`
);

// Financial calculations space-y-2 p-4 -> space-y-1 p-2
content = content.replace(
  /className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-150 text-xs"/g,
  `className="space-y-1 bg-gray-50 p-2 rounded-xl border border-gray-150 text-[11px]"`
);

// Amount in words mt-4 -> mt-1.5
content = content.replace(
  /className="mt-4 text-\[10px\] text-gray-600 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-250"/g,
  `className="mt-1.5 text-[10px] text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded-lg border border-gray-250"`
);

// Declarations mt-6 pt-5 -> mt-2 pt-2
content = content.replace(
  /className="mt-6 pt-5 border-t border-gray-150 flex justify-between items-end gap-6 text-\[9px\] text-gray-500"/g,
  `className="mt-2 pt-2 border-t border-gray-150 flex justify-between items-end gap-6 text-[9px] text-gray-500"`
);

// Declarations leading-relaxed -> leading-tight
content = content.replace(
  /className="list-decimal pl-4 space-y-0.5 leading-relaxed font-medium"/g,
  `className="list-decimal pl-4 space-y-0 leading-tight font-medium"`
);

// Signature empty box h-10 -> h-6
content = content.replace(
  /className="h-10 border-b border-gray-300"/g,
  `className="h-6 border-b border-gray-300"`
);

// Signature images h-10 -> h-8
content = content.replace(
  /className="mx-auto h-10 max-w-44 object-contain"/g,
  `className="mx-auto h-8 max-w-44 object-contain"`
);

// Page number bar mt-2 pt-2 -> mt-1 pt-1
content = content.replace(
  /className="print-page-number-bar text-center text-\[9px\] text-gray-400 mt-2 pt-2 border-t border-gray-50 font-mono flex justify-between items-center"/g,
  `className="print-page-number-bar text-center text-[9px] text-gray-400 mt-1 pt-1 border-t border-gray-50 font-mono flex justify-between items-center"`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated footer layout margins in BillPreview.tsx");
