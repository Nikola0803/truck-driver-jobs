/**
 * Run once to capture your Facebook session.
 * Usage: npm run capture
 *
 * This opens a real Chrome window. Log into your DEDICATED Facebook posting
 * account, then press ENTER here. The session is saved to fb-session.json.
 *
 * IMPORTANT: Never commit fb-session.json to git. It is in .gitignore.
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });

console.log('\n═══════════════════════════════════════════════════');
console.log('  TDJ Facebook Session Capture');
console.log('═══════════════════════════════════════════════════');
console.log('\nSteps:');
console.log('  1. A Chrome window will open to facebook.com');
console.log('  2. Log in with your DEDICATED posting account');
console.log('  3. Complete any 2FA / verification steps');
console.log('  4. Once you see the Facebook home feed, press ENTER here\n');

const browser = await chromium.launch({
  headless: false,
  args: ['--start-maximized'],
});

const context = await browser.newContext({
  viewport: null,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
});

const page = await context.newPage();
await page.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded' });

await new Promise(resolve =>
  rl.question('✅ Logged in? Press ENTER to save session... ', resolve)
);
rl.close();

const state = await context.storageState();
const json = JSON.stringify(state);
writeFileSync('fb-session.json', json);

console.log('\n✅ Session saved to fb-session.json');
console.log('\nNext — add it as a Fly.io secret:\n');
console.log('  cd playwright-poster');
console.log('  fly secrets set FB_STORAGE_STATE="$(cat fb-session.json | tr -d \'\\n\')"');
console.log('\nOr set it manually in the Fly.io dashboard → Secrets.');
console.log('\n⚠️  Sessions expire after ~60–90 days. Re-run this script when posts start failing with SESSION_EXPIRED.\n');

await browser.close();
process.exit(0);
