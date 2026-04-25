import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const localEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

const envPath = fs.existsSync(localEnvPath) ? localEnvPath : rootEnvPath;

if (!fs.existsSync(envPath)) {
  console.warn(`No .env file found at ${localEnvPath} or ${rootEnvPath}. Continuing with process.env values.`);
} else {
  dotenv.config({ path: envPath });
}
