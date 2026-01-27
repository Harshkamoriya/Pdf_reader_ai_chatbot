import fs from "fs";
import https from "https";
import path from "path";

const LIST_URL =
  "https://api.github.com/repos/neenza/leetcode-problems/contents/problems";

const RAW_BASE =
  "https://raw.githubusercontent.com/neenza/leetcode-problems/master/problems/";

async function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      { headers: { "User-Agent": "node" } },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            return reject(
              new Error(`HTTP ${res.statusCode}: ${body.slice(0, 100)}`)
            );
          }
          resolve(JSON.parse(body));
        });
      }
    ).on("error", reject);
  });
}

async function downloadTop100() {
  const files = await fetchJson<any[]>(LIST_URL);

  const jsonFiles = files
    .filter((f) => f.name.endsWith(".json"))
    .slice(0, 100);

  const all = [];

  for (const f of jsonFiles) {
    const url = RAW_BASE + f.name;
    const data = await fetchJson<any>(url);

    all.push(data);
    console.log(`✅ Downloaded ${f.name}`);
  }

  const out = path.join(process.cwd(), "top-100-leetcode.json");
  fs.writeFileSync(out, JSON.stringify(all, null, 2), "utf-8");

  console.log("📁 Saved top-100-leetcode.json");
}

downloadTop100().catch((e) => {
  console.error("❌ Error:", e.message);
});
