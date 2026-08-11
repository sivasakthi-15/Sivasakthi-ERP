const fs = require("fs");
const readline = require("readline");

async function extractFile() {
  const fileStream = fs.createReadStream("C:/Users/PRATHICKSHAN/.gemini/antigravity/brain/b5b2f690-8099-4cff-9d04-7bf4ad4f19c5/.system_generated/logs/transcript_full.jsonl");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes("Remittance Accounts & Terms")) {
      const parsed = JSON.parse(line);
      if (parsed.content && parsed.content.includes("Remittance Accounts & Terms") && parsed.content.includes("Total Lines:") && parsed.content.includes("File Path")) {
        console.log("Found in view_file!");
        let idx = parsed.content.indexOf("Remittance Accounts & Terms");
        console.log(parsed.content.substring(idx - 1000, idx + 1500));
        return;
      }
    }
  }
  
  // If not found in view_file, just print ANY occurrence that is large
  const fileStream2 = fs.createReadStream("C:/Users/PRATHICKSHAN/.gemini/antigravity/brain/b5b2f690-8099-4cff-9d04-7bf4ad4f19c5/.system_generated/logs/transcript_full.jsonl");
  const rl2 = readline.createInterface({ input: fileStream2, crlfDelay: Infinity });
  for await (const line of rl2) {
    if (line.includes("Remittance Accounts & Terms")) {
      const parsed = JSON.parse(line);
      if (parsed.content && parsed.content.includes("Remittance Accounts & Terms") && parsed.content.length > 500) {
        let idx = parsed.content.indexOf("Remittance Accounts & Terms");
        console.log("Found large occurrence:");
        console.log(parsed.content.substring(idx - 500, idx + 3000));
        return;
      }
    }
  }
  
}
extractFile();
