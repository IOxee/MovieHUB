import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const DATA_DIR = path.join(process.cwd(), 'data');
const RATINGS_FILE = path.join(DATA_DIR, 'user_ratings_db.csv');
const SKIPPED_FILE = path.join(DATA_DIR, 'skipped_movies.csv');

export interface Rating {
  user_id: string; // Keeping as string to fail-safe, python used 1
  title: string;
  score: number;
  tmdb_id: number;
  media_type: string;
}

export interface Skipped {
  title: string;
}

// Ensure files exist
async function ensureDb() {
  try {
    await fs.access(RATINGS_FILE);
  } catch {
    await fs.writeFile(RATINGS_FILE, 'user_id,title,score,tmdb_id,media_type\n');
  }
  try {
    await fs.access(SKIPPED_FILE);
  } catch {
    await fs.writeFile(SKIPPED_FILE, 'title\n');
  }
}

export async function getRatings(): Promise<Rating[]> {
  await ensureDb();
  const fileContent = await fs.readFile(RATINGS_FILE, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.column === 'score' || context.column === 'tmdb_id') {
        return Number(value);
      }
      return value;
    }
  });
}

export async function saveRating(rating: Rating) {
  await ensureDb();
  const ratings = await getRatings();
  const existingIndex = ratings.findIndex(r => r.title === rating.title);
  
  if (existingIndex >= 0) {
    ratings[existingIndex] = { ...ratings[existingIndex], ...rating };
  } else {
    ratings.push(rating);
  }
  
  const output = stringify(ratings, { header: true });
  await fs.writeFile(RATINGS_FILE, output);
  return ratings.length;
}

export async function getStats() {
  const ratings = await getRatings();
  return { count: ratings.length };
}
