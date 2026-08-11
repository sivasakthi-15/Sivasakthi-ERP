const fs = require("fs");
const readline = require("readline");

async function extractFile() {
  const fileStream = fs.createReadStream("C:/Users/PRATHICKSHAN/.gemini/antigravity/brain/b5b2f690-8099-4cff-9d04-7bf4ad4f19c5/.system_generated/logs/transcript_full.jsonl");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes("Corporate Header block") && line.includes("view_file")) {
      const parsed = JSON.parse(line);
      if (parsed.content && parsed.content.includes("Corporate Header block") && parsed.content.includes("Total Lines:") && parsed.content.includes("450 to 600")) {
        console.log("Found original header!");
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
        fs.writeFileSync("original_header.txt", extracted.join('\n'));
        console.log("Written to original_header.txt");
        return;
      }
    }
  }
}
extractFile();
