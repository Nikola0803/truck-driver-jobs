import { chromium } from 'playwright';

// Human-like random delay
const delay = (min = 1000, max = 3000) =>
  new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

// Try a list of selectors, return the first that works
async function tryClick(page, selectors, timeout = 6000) {
  for (const sel of selectors) {
    try {
      await page.click(sel, { timeout });
      return sel;
    } catch {
      // try next
    }
  }
  return null;
}

async function tryType(page, selectors, text, timeout = 6000) {
  for (const sel of selectors) {
    try {
      await page.click(sel, { timeout });
      await page.keyboard.type(text, { delay: 35 + Math.random() * 45 });
      return sel;
    } catch {
      // try next
    }
  }
  return null;
}

export async function postToGroup(groupUrl, content) {
  const storageStateRaw = process.env.FB_STORAGE_STATE;
  if (!storageStateRaw) throw new Error('FB_STORAGE_STATE env var not set — run npm run capture first');

  const storageState = JSON.parse(storageStateRaw);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    storageState,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/Chicago',
  });

  // Mask automation signals
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  try {
    console.log(`[poster] Navigating to ${groupUrl}`);
    await page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(2500, 4500);

    // Verify session is valid
    const cookies = await context.cookies();
    const hasSession = cookies.some(c => c.name === 'c_user' && c.domain.includes('facebook'));
    if (!hasSession) throw new Error('SESSION_EXPIRED — re-run capture-session.js and update FB_STORAGE_STATE');

    console.log('[poster] Session valid. Opening composer…');

    // Step 1: Open the post composer
    const composerOpened = await tryClick(page, [
      '[aria-label="Write something..."]',
      '[aria-label="Create a public post…"]',
      '[aria-label="Create a post"]',
      'div[role="button"]:has-text("Write something")',
      'div[role="button"]:has-text("Create a post")',
    ]);

    if (!composerOpened) {
      // Last resort: find by visible text
      const btn = page.getByText('Write something', { exact: false }).first();
      await btn.click({ timeout: 8000 });
    }

    await delay(1500, 2500);

    // Step 2: Type content into the composer text area
    const typedWith = await tryType(page, [
      'div[role="textbox"][contenteditable="true"]',
      'div[aria-label="What\'s on your mind?"][contenteditable="true"]',
      'div[data-lexical-editor="true"]',
      'div[contenteditable="true"]',
    ], content);

    if (!typedWith) throw new Error('Could not locate text input in composer');

    console.log(`[poster] Content typed (${content.length} chars)`);
    await delay(1000, 2000);

    // Step 3: Click Post button
    const postClicked = await tryClick(page, [
      'div[aria-label="Post"][role="button"]:not([aria-disabled="true"])',
      'button[aria-label="Post"]:not([disabled])',
      'div[role="button"]:has-text("Post"):not([aria-disabled])',
    ]);

    if (!postClicked) throw new Error('Could not find active Post button');

    // Wait for post to go through (Facebook takes 2-4 seconds)
    await delay(4000, 6000);

    console.log('[poster] ✅ Post submitted successfully');
    return { success: true };

  } catch (err) {
    console.error('[poster] ❌ Failed:', err.message);
    throw err;
  } finally {
    await browser.close();
  }
}
