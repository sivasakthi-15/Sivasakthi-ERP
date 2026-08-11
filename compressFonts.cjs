const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

content = content.replace(
  /className="mt-1.5 text-\[10px\] text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded-lg border border-gray-250"/g,
  `className="mt-1.5 text-[9px] text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded-lg border border-gray-250"`
);

content = content.replace(
  /className="mt-2 pt-2 border-t border-gray-150 flex justify-between items-end gap-6 text-\[9px\] text-gray-500"/g,
  `className="mt-1.5 pt-1.5 border-t border-gray-150 flex justify-between items-end gap-6 text-[8px] text-gray-500"`
);

content = content.replace(
  /className="font-bold text-gray-800 block text-\[10px\]"/g,
  `className="font-bold text-gray-800 block text-[9px]"`
);

content = content.replace(
  /className="text-\[10px\] font-bold text-gray-700 mt-1.5"/g,
  `className="text-[9px] font-bold text-gray-700 mt-1"`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Compressed footer font sizes");
