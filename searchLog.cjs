const fs = require("fs");
const readline = require("readline");

async function processLineByLine() {
  const fileStream = fs.createReadStream("C:/Users/PRATHICKSHAN/.gemini/antigravity/brain/b5b2f690-8099-4cff-9d04-7bf4ad4f19c5/.system_generated/logs/transcript_full.jsonl");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let found = false;
  for await (const line of rl) {
    if (line.includes("Remittance Accounts & Terms")) {
      const parsed = JSON.parse(line);
      if (parsed.content && parsed.content.includes("Remittance Accounts & Terms")) {
        console.log("MATCH FOUND:");
        // Extract a snippet to see what we have
        const idx = parsed.content.indexOf("Remittance Accounts & Terms");
        console.log(parsed.content.substring(idx - 100, idx + 1000));
        found = true;
        break;
      }
    }
  }
  if (!found) console.log("Not found.");
}

processLineByLine();
