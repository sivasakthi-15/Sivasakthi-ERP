const fs = require("fs");
const readline = require("readline");

async function check() {
  const fileStream = fs.createReadStream("C:/Users/PRATHICKSHAN/.gemini/antigravity/brain/b5b2f690-8099-4cff-9d04-7bf4ad4f19c5/.system_generated/logs/transcript_full.jsonl");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes("BillPreview.tsx")) {
      const parsed = JSON.parse(line);
      if (parsed.content && parsed.content.includes("Total Lines:") && parsed.content.includes("File Path:")) {
        console.log("Viewed file snippet found: " + parsed.content.substring(0, 150));
      }
    }
  }
}
check();
