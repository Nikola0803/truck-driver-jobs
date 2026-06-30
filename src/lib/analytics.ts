/**
 * Lightweight site-wide analytics tracker.
 * Posts events to /api/track (public endpoint, no auth required) so
 * anonymous visitors are captured, not just logged-in users.
 */

const SESSION_KEY = "tdj_analytics_session";
const REFERRER_KEY = "tdj_analytics_referrer_sent";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getUtmParams(): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
}

/** Get the referrer to attribute this visit to — only the *first* referrer
 * of the browser session is meaningful (in-app navigation isn't a "referrer"). */
function getAttributedReferrer(): string | null {
  const alreadySent = sessionStorage.getItem(REFERRER_KEY);
  if (alreadySent) return null;
  sessionStorage.setItem(REFERRER_KEY, "1");
  return document.referrer || null;
}

export function track(eventType: string, metadata: Record<string, unknown> = {}) {
  const payload = {
    event_type: eventType,
    session_id: getSessionId(),
    path: window.location.pathname,
    referrer: getAttributedReferrer(),
    ...getUtmParams(),
    metadata,
  };

  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* analytics failures should never break the app */ });
  } catch {
    // ignore — analytics should never throw
  }
}

export function trackPageview() {
  track("pageview");
}
