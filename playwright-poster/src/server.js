import express from 'express';
import { postToGroup } from './fb-poster.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

const POSTER_SECRET = process.env.POSTER_SECRET;
if (!POSTER_SECRET) {
  console.error('POSTER_SECRET env var not set — refusing to start');
  process.exit(1);
}

// ── Auth middleware ──────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const token = req.headers['x-poster-secret'];
  if (token !== POSTER_SECRET) {
    console.warn(`[auth] Rejected request from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tdj-playwright-poster' });
});

// ── POST /post — post content to a Facebook group ────────────
// Body: { group_url: string, content: string }
// Returns: { success: boolean, error?: string }
app.post('/post', async (req, res) => {
  const { group_url, content } = req.body ?? {};

  if (!group_url || !content) {
    return res.status(400).json({ error: 'group_url and content are required' });
  }
  if (typeof content !== 'string' || content.length > 5000) {
    return res.status(400).json({ error: 'content must be a string under 5000 chars' });
  }

  console.log(`[server] Posting to ${group_url} (${content.length} chars)`);

  try {
    const result = await postToGroup(group_url, content);
    res.json(result);
  } catch (err) {
    const msg = err.message ?? 'Unknown error';
    const sessionExpired = msg.includes('SESSION_EXPIRED');
    res.status(sessionExpired ? 401 : 500).json({
      success: false,
      error: msg,
      session_expired: sessionExpired,
    });
  }
});

// ── Start ────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`✅ Poster service running on port ${PORT}`);
  console.log(`   FB session: ${process.env.FB_STORAGE_STATE ? 'loaded' : '⚠️  NOT SET'}`);
});
