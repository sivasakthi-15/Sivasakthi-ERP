const fs = require("fs");
const readline = require("readline");

async function extractOriginal() {
  const fileStream = fs.createReadStream("C:/Users/PRATHICKSHAN/.gemini/antigravity/brain/b5b2f690-8099-4cff-9d04-7bf4ad4f19c5/.system_generated/logs/transcript_full.jsonl");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes("print-page-header") && line.includes("view_file")) {
      const parsed = JSON.parse(line);
      if (parsed.content && parsed.content.includes("print-page-header")) {
        console.log("Found it!");
        let idx = parsed.content.indexOf("print-page-header");
        console.log(parsed.content.substring(idx - 100, idx + 2500));
        return;
      }
    }
  }
}
extractOriginal();
