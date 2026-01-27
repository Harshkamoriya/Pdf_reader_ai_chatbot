import prisma from "./db";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Matches neenza/leetcode-problems JSON shape
 * All uncertain fields are optional for safety
 */
interface LeetCodeProblem {
  title: string;
  problem_id: string;
  frontend_id: string;
  difficulty: string;
  problem_slug: string;

  topics?: string[];
  description?: string;

  examples?: {
    example_text: string;
  }[];

  constraints?: string[];
  hints?: string[];

  code_snippets?: Record<string, string>;
  solution?: string;
  follow_ups?: string[];
}

async function main() {
  try {
    const filePath = path.join(process.cwd(), "top-100-leetcode.json");
    const raw = await fs.readFile(filePath, "utf-8");

    const problems: LeetCodeProblem[] = JSON.parse(raw);

    console.log(`Processing ${problems.length} problems...`);

    for (const p of problems) {
      if (!p.problem_slug || !p.title) {
        console.warn("⚠️ Skipping malformed entry");
        continue;
      }

      const slug = p.problem_slug;

      // Skip if already exists
      const exists = await prisma.question.findUnique({
        where: { leetcodeSlug: slug },
      });

      if (exists) {
        console.log(`Skip → ${p.title} (${slug})`);
        continue;
      }

      const qid = uuidv4();

      const topic = p.topics?.join(", ") || "";

      const statement =
        p.description
          ?.split("Example")[0]
          .replace(/Constraints?:?$/i, "")
          .trim() || "";

      const constraintsStr = p.constraints?.join("\n") || "";
      const examplesStr =
        p.examples?.map((e) => e.example_text).join("\n\n") || "";

      await prisma.question.create({
        data: {
          id: qid,
          title: p.title,
          topic,
          difficulty: p.difficulty,
          leetcodeSlug: slug,
          source: "LeetCode",
          problemId: p.problem_id,
          frontendId: p.frontend_id,
          hints: p.hints ?? [],
          codeSnippets: p.code_snippets ?? {},
        },
      });

      await prisma.problemContent.create({
        data: {
          questionId: qid,
          statement,
          constraints: constraintsStr,
          examples: examplesStr,
          testCases: {}, // JSON column
          followUps: p.follow_ups?.join("\n") ?? null,
          solutionText: p.solution ?? null,
        },
      });

      console.log(`Inserted → ${p.title} (${slug})`);
    }

    console.log("✅ Done.");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
