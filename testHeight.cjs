const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(`
    <style>
      .a4-print-measure-mode .print-page,
      .a4-print-measure-mode .print-page-measure {
        display: flex !important;
        flex-direction: column !important;
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        min-height: 297mm !important;
        padding: 10mm !important;
        box-sizing: border-box !important;git rm -r --cached .
        overflow: hidden !important;
        background: white !important;
      }
      .a4-print-measure-mode .print-page > .flex-1 {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      .print-page-measure {
        visibility: hidden !important;
        position: absolute !important;
        pointer-events: none !important;
        left: 0 !important;
        top: 0 !important;
      }
    </style>
    <body class="a4-print-measure-mode">
      <div id="test" class="print-page print-page-measure">
        <div class="flex-1">
          <div id="content" style="height: 100mm; background: red;"></div>
        </div>
      </div>
    </body>
  `);

  let res = await page.evaluate(() => {
    let el = document.getElementById("test");
    let c = document.getElementById("content");
    let initial = { sh: el.scrollHeight, ch: el.clientHeight };
    c.style.height = "500mm";
    let final = { sh: el.scrollHeight, ch: el.clientHeight };
    return { initial, final };
  });
  console.log(res);
  await browser.close();
})();
