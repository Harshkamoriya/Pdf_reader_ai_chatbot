// insert-leetcode-questions.ts
// Run this script with: ts-node insert-leetcode-questions.ts
// Requirements: npm install @prisma/client axios uuid
// Make sure your Prisma client is set up and env vars like DATABASE_URL are configured in .env

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import prisma from './db';


interface LeetCodeProblem {
  title: string;
  difficulty: string;
  problem_slug: string;
  topics: string[];
  description: string;
  examples: { example_text: string }[];
  constraints: string[];
  // testCases?: Record<string, unknown>; // If present, else empty
  // Other fields ignored
}

async function fetchFileList(): Promise<string[]> {
  try {
    const response = await axios.get('https://api.github.com/repos/neenza/leetcode-problems/contents/problems', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'leetcode-importer-script' // Good practice
      }
    });
    const files: { name: string; type: string }[] = response.data;
    return files.filter(file => file.type === 'file' && file.name.endsWith('.json')).map(file => file.name);
  } catch (error) {
    console.error('Error fetching file list:', error);
    throw error;
  }
}

async function fetchProblemData(filename: string): Promise<LeetCodeProblem> {
  const rawUrl = `https://raw.githubusercontent.com/neenza/leetcode-problems/master/problems/${filename}`;
  try {
    const response = await axios.get(rawUrl);
    return response.data as LeetCodeProblem;
  } catch (error) {
    console.error(`Error fetching ${filename}:`, error);
    throw error;
  }
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const files = await fetchFileList();
    console.log(`Found ${files.length} JSON files. Inserting questions...`);

    for (const filename of files) {
      const data = await fetchProblemData(filename);

      // Map to schema
      const topic = data.topics.join(', ');
      const leetcodeSlug = data.problem_slug;
      const difficulty = data.difficulty;
      const title = data.title;
      const source = 'LeetCode';

      // Clean statement: assume description includes up to before examples/constraints placeholders
      let statement = data.description;
      // Simple clean: remove trailing "Example 1:\n..." if present
      const exampleIndex = statement.indexOf('Example 1:');
      if (exampleIndex !== -1) {
        statement = statement.substring(0, exampleIndex).trim();
      }
      // Remove "Constraints:" if at end
      statement = statement.replace(/Constraints:$/, '').trim();

      const constraintsStr = data.constraints.join('\n');
      const examplesStr = data.examples.map(e => e.example_text).join('\n\n');
      const testCases = {}; // Empty if no data; adjust if testCases in JSON

      // Check if already exists by leetcodeSlug
      const existing = await prisma.question.findUnique({
        where: { leetcodeSlug },
      });
      if (existing) {
        console.log(`Skipping duplicate: "${title}" (slug: ${leetcodeSlug})`);
        continue;
      }

      // Create Question
      const questionId = uuidv4(); // Or let Prisma default
      const createdQuestion = await prisma.question.create({
        data: {
          id: questionId,
          title,
          topic,
          difficulty,
          leetcodeSlug,
          source,
        },
      });

      // Create ProblemContent
      await prisma.problemContent.create({
        data: {
          id: uuidv4(), // Default uuid
          questionId: createdQuestion.id,
          statement,
          constraints: constraintsStr,
          examples: examplesStr,
          testCases,
        },
      });

      console.log(`Inserted question: "${title}" (ID: ${questionId})`);
    }

    console.log('All questions inserted successfully!');
  } catch (error) {
    console.error('Error during insertion:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();