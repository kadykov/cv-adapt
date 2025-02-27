import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const execAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCHEMA_PATH = path.resolve(
  __dirname,
  '../../backend/docs/api/openapi.json',
);
const OUTPUT_PATH = path.resolve(__dirname, '../src/lib/api/types.ts');

async function generateTypes() {
  try {
    console.log('Generating API types...');
    await execAsync('npx', [
      'openapi-typescript',
      SCHEMA_PATH,
      '--output',
      OUTPUT_PATH,
    ]);

    // Post-process: Replace double quotes with single quotes
    console.log('Post-processing generated types...');
    const content = await fs.readFile(OUTPUT_PATH, 'utf-8');
    const processedContent = content.replace(/"/g, "'");
    await fs.writeFile(OUTPUT_PATH, processedContent);

    console.log('Types generated and processed successfully!');
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();
