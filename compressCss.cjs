const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");

content = content.replace(
  /padding: 6mm !important;/g,
  `padding: 4mm !important;`
);

fs.writeFileSync("src/index.css", content, "utf8");
console.log("Updated padding in index.css");
