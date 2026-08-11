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
        console.log("Found in view_file! Printing the chunk:");
        let lines = parsed.content.split('\n');
        let inCode = false;
        let extracted = [];
        for (let l of lines) {
          if (l.startsWith("The following code has been modified")) {
            inCode = true;
            continue;
          }
          if (inCode) {
            let match = l.match(/^\d+:\s?(.*)/);
            if (match) {
              extracted.push(match[1]);
            }
          }
        }
        console.log(extracted.join('\n'));
        return;
      }
    }
  }
}
extractFile();
