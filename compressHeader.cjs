const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// Header top margins
content = content.replace(
  /className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4"/g,
  `className="flex justify-between items-start border-b border-gray-200 pb-2 mb-2"`
);

content = content.replace(
  /className="text-\[10px\] text-gray-600 mt-1 leading-relaxed"/g,
  `className="text-[10px] text-gray-600 mt-0.5 leading-snug"`
);

content = content.replace(
  /className="text-\[10px\] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-3"/g,
  `className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 mb-1.5"`
);

// Customer section grids
content = content.replace(
  /className="grid grid-cols-2 gap-8"/g,
  `className="grid grid-cols-2 gap-4"`
);

content = content.replace(
  /className="text-gray-600 font-medium space-y-1"/g,
  `className="text-gray-600 font-medium space-y-0.5"`
);

content = content.replace(
  /className="print-page-products w-full text-left mt-2 border-collapse z-10 relative"/g,
  `className="print-page-products w-full text-left mt-1 border-collapse z-10 relative"`
);

// Table headers p-2 -> py-1.5 px-2
content = content.replace(
  /className="w-8 p-2 text-center"/g,
  `className="w-8 py-1.5 px-2 text-center"`
);
content = content.replace(
  /className="p-2"/g,
  `className="py-1.5 px-2"`
);
content = content.replace(
  /className="w-16 p-2 text-center"/g,
  `className="w-16 py-1.5 px-2 text-center"`
);
content = content.replace(
  /className="w-20 p-2 text-right"/g,
  `className="w-20 py-1.5 px-2 text-right"`
);
content = content.replace(
  /className="w-14 p-2 text-center"/g,
  `className="w-14 py-1.5 px-2 text-center"`
);
content = content.replace(
  /className="w-24 p-2 text-right"/g,
  `className="w-24 py-1.5 px-2 text-right"`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated header and table layout margins in BillPreview.tsx");
