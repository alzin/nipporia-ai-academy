// Creates an ADMIN account, or promotes an existing account to ADMIN.
// Usage: npm run create-admin   (asks for email, name and password in the terminal,
//        or reads ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD from the environment)
import 'reflect-metadata';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../infrastructure/database/config/database.config';

function ask(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    const rlAny = rl as any;
    rlAny._writeToOutput = (s: string) => {
      if (s.startsWith(question)) rlAny.output.write(question);
      else if (s.includes('\n')) rlAny.output.write('\n');
      else rlAny.output.write('*');
    };
  }
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); }));
}

async function main() {
  // Non-interactive mode: ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD environment variables.
  const email = (process.env.ADMIN_EMAIL || (await ask('Admin email: '))).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email');
  const name = (process.env.ADMIN_NAME || (await ask('Display name: '))).trim() || 'Admin';
  const password = process.env.ADMIN_PASSWORD || (await ask('Password (8+ characters): ', true));
  if (password.length < 8) throw new Error('Password must be at least 8 characters');

  await AppDataSource.initialize();
  const hash = await bcrypt.hash(password, 10);
  const existing = await AppDataSource.query('SELECT id FROM users WHERE lower(email) = $1', [email]);

  if (existing.length) {
    const id = existing[0].id;
    await AppDataSource.query(
      `UPDATE users SET role = 'ADMIN', password = $2, isverify = true, "isActive" = true, "verificationCode" = NULL WHERE id = $1`,
      [id, hash]
    );
    await AppDataSource.query(`UPDATE profiles SET name = $2 WHERE "userId" = $1`, [id, name]);
    console.log(`Updated existing account ${email} to ADMIN.`);
  } else {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    await AppDataSource.query(
      `INSERT INTO users (id, email, password, role, "isActive", isverify) VALUES ($1, $2, $3, 'ADMIN', true, true)`,
      [id, email, hash]
    );
    await AppDataSource.query(
      `INSERT INTO profiles (id, "userId", name) VALUES ($1, $2, $3)`,
      [`${Date.now()}-${Math.random().toString(36).substring(2, 10)}`, id, name]
    );
    console.log(`Created ADMIN account ${email}.`);
  }
  await AppDataSource.destroy();
}

main().catch(async (err) => {
  console.error('Failed:', err.message);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
