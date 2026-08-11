const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");

content = content.replace(/padding: 10mm !important;/g, "padding: 6mm !important;");

fs.writeFileSync("src/index.css", content, "utf8");
console.log("Updated index.css padding");
