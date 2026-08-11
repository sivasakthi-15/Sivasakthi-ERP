const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");

content = content.replace(
  /interface BuiltPage \{[\s\S]+?\}/,
  `interface BuiltPage {
  page: HTMLElement;
  body: HTMLTableSectionElement;
  contentContainer: HTMLElement;
}`
);

content = content.replace(
  /return \{ page, body \};\s+\}/,
  `return { page, body, contentContainer: top };
}`
);

const newCountLogic = `
function countRowsThatFit(
  ctx: PageBuildContext,
  rows: HTMLTableRowElement[],
  includeHeader: boolean,
  includeFooter: boolean,
): number {
  const { doc } = ctx;
  const root = doc.getElementById('a4-print-element');
  if (!root || rows.length === 0) return 0;

  const built = buildMeasurementPage(ctx, includeHeader, includeFooter, true);
  if (!built) return 0;

  root.appendChild(built.page);
  
  let fit = 0;
  for (const row of rows) {
    built.body.appendChild(row.cloneNode(true));
    
    // Check if the flex-1 content container is overflowing!
    if (built.contentContainer.scrollHeight > built.contentContainer.clientHeight) {
      built.body.removeChild(built.body.lastElementChild!);
      break;
    }
    fit++;
  }

  root.removeChild(built.page);
  return fit;
}

function countEmptyRowsThatFit(
  ctx: PageBuildContext,
  productRows: HTMLTableRowElement[],
  includeHeader: boolean,
  includeFooter: boolean,
): number {
  const { doc, sourceTable } = ctx;
  const root = doc.getElementById('a4-print-element');
  const sourceBody = sourceTable.tBodies[0];
  if (!root || !sourceBody) return 0;

  const built = buildMeasurementPage(ctx, includeHeader, includeFooter, true);
  if (!built) return 0;

  built.body.append(...productRows.map((r) => r.cloneNode(true)));
  root.appendChild(built.page);
  
  let emptyCount = 0;
  while (true) {
    if (emptyCount > 40) break; // safety guard
    
    const emptyRow = createEmptyProductRow(sourceBody, doc);
    built.body.appendChild(emptyRow);
    
    if (built.contentContainer.scrollHeight > built.contentContainer.clientHeight) {
      built.body.removeChild(emptyRow);
      break;
    }
    emptyCount++;
  }

  root.removeChild(built.page);
  return emptyCount;
}
`;

content = content.replace(
  /function getBaselineHeight[\s\S]+?return emptyCount;\s+\}/,
  newCountLogic.trim()
);

fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
console.log("Updated a4InvoicePrintEngine to use strict flex-1 overflow detection!");
