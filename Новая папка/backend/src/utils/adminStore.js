import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminsFile = path.resolve(__dirname, '../../../user-admin.txt');

export async function readAdminEmails() {
  try {
    const raw = await fs.readFile(adminsFile, 'utf8');
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function isAdminEmail(email) {
  const admins = await readAdminEmails();
  return admins.includes(String(email || '').trim().toLowerCase());
}
