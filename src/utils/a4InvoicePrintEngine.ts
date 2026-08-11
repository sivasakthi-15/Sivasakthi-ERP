// @ts-nocheck
export interface A4PageSlice {
  productRowIndices: number[];
  emptyRowCount: number;
  includeHeader: boolean;
  includeFooter: boolean;
}

export interface A4PaginationResult {
  pages: A4PageSlice[];
  totalPages: number;
}

interface PageBuildContext {
  doc: Document;
  template: HTMLElement;
  sourceTop: HTMLElement;
  sourceTable: HTMLTableElement;
    sourceTotals: HTMLElement;
    sourceFooter: HTMLElement;
  sourcePageNumber: HTMLElement;
}

interface BuiltPage {
  page: HTMLElement;
  body: HTMLTableSectionElement;
  contentContainer: HTMLElement;
}

function collectProductRows(
  sourceBody: HTMLTableSectionElement,
  doc: Document,
): HTMLTableRowElement[] {
  const rows: HTMLTableRowElement[] = [];
  for (let i = 0; i < sourceBody.rows.length; i++) {
    const row = sourceBody.rows[i];
    if (row.classList.contains('empty-product-row')) continue;
    
    // Skip ghost rows from padding
    if (row.textContent && row.textContent.trim() === '') continue;
    rows.push(row);
  }
  return rows;
}

function createEmptyProductRow(sourceBody: HTMLTableSectionElement, doc: Document): HTMLTableRowElement {
  const firstRow = sourceBody.rows[0];
  const tr = doc.createElement('tr');
  tr.className = 'empty-product-row border-b border-gray-100 last:border-b-0 print:border-gray-300';

  if (firstRow) {
    for (let i = 0; i < firstRow.cells.length; i++) {
      const td = doc.createElement('td');
      td.className = firstRow.cells[i].className;
      td.innerHTML = '&nbsp;';
      tr.appendChild(td);
    }
  } else {
    const td = doc.createElement('td');
    td.colSpan = 10;
    td.innerHTML = '&nbsp;';
    td.className = 'p-2';
    tr.appendChild(td);
  }

  return tr;
}

function buildMeasurementPage(
  ctx: PageBuildContext,
  includeHeader: boolean,
  includeFooter: boolean,
  includePageNumber: boolean,
): BuiltPage | null {
  const { doc, template, sourceTop, sourceTotals, sourceFooter, sourcePageNumber } = ctx;

  const page = template.cloneNode(false) as HTMLElement;
  page.classList.add('print-page-measure');

  const top = sourceTop.cloneNode(true) as HTMLElement;
  const table = top.querySelector<HTMLTableElement>('table');
    const body = table?.tBodies[0];

    if (!table || !body) return null;

    if (includeFooter && sourceTotals) {
      top.appendChild(sourceTotals.cloneNode(true));
    }

  body.replaceChildren();

  if (!includeHeader) {
    top.querySelector('.print-page-header')?.remove();
    Array.from(top.children).find((child) => child.classList.contains('z-10'))?.remove();
  }

  page.appendChild(top);

  const bottomContainer = doc.createElement('div');
  bottomContainer.className = 'print-page-bottom mt-auto';
  if (includeFooter) {
    bottomContainer.appendChild(sourceFooter.cloneNode(true));
  }
  if (includePageNumber) {
    bottomContainer.appendChild(sourcePageNumber.cloneNode(true));
  }
  page.appendChild(bottomContainer);

  return { page, body, contentContainer: top };
}

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
    
    const tableEl = built.contentContainer.querySelector('table');
    if (tableEl) {
      const tableRect = tableEl.getBoundingClientRect();
      const containerRect = built.contentContainer.getBoundingClientRect();
      if (tableRect.bottom > containerRect.bottom + 1) {
      built.body.removeChild(built.body.lastElementChild!);
        break;
      }
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
  return 0;
}

export function computePageSlices(
  ctx: PageBuildContext,
  productRows: HTMLTableRowElement[],
): A4PaginationResult {
  return {
    pages: [{ productRowIndices: [], emptyRowCount: 0, includeHeader: true, includeFooter: true }],
    totalPages: 1,
  };
}

export function renderPaginatedA4Document(
  printDocument: Document,
  sourceElements: {
    template: HTMLElement;
    sourceTop: HTMLElement;
    sourceTable: HTMLTableElement;
    sourceTotals: HTMLElement;
    sourceFooter: HTMLElement;
    sourcePageNumber: HTMLElement;
  },
): void {
  // Let the browser handle pagination naturally. This prevents the invoice rows
  // from being clipped or split before printing.
  void printDocument;
  void sourceElements;
}

export function paginateA4PrintDocument(printDocument: Document): void {
  // No-op: the browser print layout will paginate the single invoice page naturally.
  void printDocument;
}

