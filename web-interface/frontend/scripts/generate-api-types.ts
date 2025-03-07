import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

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

    console.log('Formatting generated types...');
    await execAsync('npx', ['prettier', '--write', OUTPUT_PATH]);

    console.log('Types generated and processed successfully!');
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();
