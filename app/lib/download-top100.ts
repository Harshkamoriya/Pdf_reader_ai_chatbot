import fs from "fs";
import https from "https";
import path from "path";

const INDEX_URL =
  "https://raw.githubusercontent.com/neenza/leetcode-problems/master/problems/problems.json";

const BASE =
  "https://raw.githubusercontent.com/neenza/leetcode-problems/master/problems/";

type ProblemIndexItem = {
  id: string;        // "0001"
  slug: string;      // "two-sum"
};

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(JSON.parse(body)));
      })
      .on("error", reject);
  });
}

async function downloadTop100() {
  const index = await fetchJson<ProblemIndexItem[]>(INDEX_URL);

  const top100 = index.slice(0, 100);

  const all = [];

  for (const p of top100) {
    const fileName = `${p.id}-${p.slug}.json`;
    const url = BASE + fileName;

    const data = await fetchJson<any>(url);
    all.push(data);

    console.log(`✅ Downloaded ${fileName}`);
  }

  const outputPath = path.join(
    process.cwd(),
    "top-100-leetcode.json"
  );

  fs.writeFileSync(outputPath, JSON.stringify(all, null, 2), "utf-8");

  console.log("📁 Saved top-100-leetcode.json");
}

downloadTop100().catch(console.error);
