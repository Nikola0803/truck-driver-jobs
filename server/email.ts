/**
 * Email service — Resend REST API (no extra package needed).
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * Required env vars:
 *   RESEND_API_KEY   — from resend.com/api-keys
 *   RESEND_FROM      — verified sender, e.g. "TruckDriverJobs.co <noreply@truckdriverjobs.co>"
 *                      OR use "onboarding@resend.dev" while testing (sends to your own email only)
 */

const RESEND_URL = "https://api.resend.com/emails";

function getKey(): string | null {
  return process.env.RESEND_API_KEY ?? null;
}

function getFrom(): string {
  return process.env.RESEND_FROM ?? "TruckDriverJobs.co <onboarding@resend.dev>";
}

async function send(to: string | string[], subject: string, html: string): Promise<void> {
  const key = getKey();
  if (!key) {
    console.warn("[Email] RESEND_API_KEY not set — skipping:", subject);
    return;
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: getFrom(), to, subject, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[Email] Send failed (${res.status}):`, body.slice(0, 200));
    } else {
      const { id } = (await res.json()) as { id: string };
      console.log(`[Email] Sent "${subject}" → ${Array.isArray(to) ? to.join(", ") : to} (id: ${id})`);
    }
  } catch (e) {
    console.error("[Email] Network error:", e);
  }
}

// ── Shared styles ────────────────────────────────────────────────────────────

function wrap(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>TruckDriverJobs.co</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <!-- Header -->
      <tr>
        <td style="background:#f97316;border-radius:12px 12px 0 0;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:8px;padding:6px 10px;font-size:18px;">🚛</span>
                <span style="color:#fff;font-size:18px;font-weight:700;margin-left:10px;vertical-align:middle;">TruckDriverJobs.co</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
          ${content}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:20px 0;text-align:center;color:#999;font-size:12px;line-height:1.6;">
          TruckDriverJobs.co · CDL Job Matching Platform<br/>
          <a href="https://truckdriverjobs.co" style="color:#f97316;">truckdriverjobs.co</a>
          &nbsp;·&nbsp;
          <a href="https://truckdriverjobs.co/privacy" style="color:#999;">Privacy Policy</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function badge(text: string, color = "#f97316"): string {
  return `<span style="display:inline-block;background:${color}20;color:${color};border:1px solid ${color}40;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;">${text}</span>`;
}

function jobRow(job: { title?: string; company?: string; location?: string; equipment?: string; route_type?: string; pay_rate?: string; external_apply_url?: string; source_url?: string }): string {
  const link = job.external_apply_url || job.source_url || "https://truckdriverjobs.co/jobs";
  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
      <a href="${link}" style="text-decoration:none;">
        <strong style="color:#1a1a1a;font-size:14px;">${job.title ?? "CDL Driver"}</strong>
      </a><br/>
      <span style="color:#666;font-size:13px;">${job.company ?? ""} · ${job.location ?? "United States"}</span><br/>
      <div style="margin-top:5px;">
        ${job.equipment ? badge(job.equipment, "#6366f1") + " " : ""}
        ${job.route_type ? badge(job.route_type, "#0891b2") + " " : ""}
        ${job.pay_rate ? badge(job.pay_rate, "#f97316") : ""}
      </div>
    </td>
  </tr>`;
}

// ── 1. Admin — new lead from /match ─────────────────────────────────────────

export async function sendAdminLeadAlert(opts: {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  cdlClass: string;
  experience: string;
  routeType?: string;
  equipment?: string;
  homeTime?: string;
  states?: string[];
  matchedJobs: Array<{ title?: string; company?: string; location?: string; equipment?: string; route_type?: string; pay_rate?: string }>;
  leadId: number | null;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@truckdriverjobs.co";
  const jobsHtml = opts.matchedJobs.slice(0, 8).map(jobRow).join("");
  const statesText = opts.states?.length ? opts.states.join(", ") : "Nationwide";
  const prefs = [opts.routeType, opts.equipment, opts.homeTime].filter(Boolean).join(" · ");

  await send(
    adminEmail,
    `🚛 New Lead — ${opts.driverName} (${opts.cdlClass}) applied to ${opts.matchedJobs.length} jobs`,
    wrap(`
      <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a1a;">New Lead Submitted</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">Submitted via AI Match wizard</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;padding:16px;margin-bottom:24px;">
        <tr>
          <td style="padding:4px 0;">
            <strong style="color:#1a1a1a;font-size:15px;">${opts.driverName}</strong>
            ${opts.leadId ? `<span style="color:#999;font-size:12px;margin-left:8px;">Lead #${opts.leadId}</span>` : ""}
          </td>
        </tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#444;">📞 <a href="tel:${opts.driverPhone}" style="color:#f97316;">${opts.driverPhone}</a></td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#444;">✉️ <a href="mailto:${opts.driverEmail}" style="color:#f97316;">${opts.driverEmail}</a></td></tr>
        <tr><td style="padding:8px 0 4px;font-size:13px;color:#666;">CDL-${opts.cdlClass} · ${opts.experience}${prefs ? " · " + prefs : ""}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#666;">📍 ${statesText}</td></tr>
      </table>

      <h3 style="margin:0 0 12px;font-size:15px;color:#1a1a1a;">Applied to ${opts.matchedJobs.length} Position${opts.matchedJobs.length !== 1 ? "s" : ""}</h3>
      <table width="100%" cellpadding="0" cellspacing="0">${jobsHtml}</table>

      <div style="margin-top:24px;text-align:center;">
        <a href="https://truckdriverjobs.co/admin/drivers"
           style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;padding:12px 24px;font-size:14px;font-weight:700;">
          View in Admin Dashboard →
        </a>
      </div>
    `, `${opts.driverName} applied to ${opts.matchedJobs.length} CDL jobs`)
  );
}

// ── 2. Driver — confirmation after /match apply ──────────────────────────────

export async function sendDriverConfirmation(opts: {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  matchedJobs: Array<{ title?: string; company?: string; location?: string; equipment?: string; route_type?: string; pay_rate?: string; external_apply_url?: string; source_url?: string }>;
}): Promise<void> {
  if (!opts.driverEmail) return;
  const firstName = opts.driverName.split(" ")[0];
  const jobsHtml = opts.matchedJobs.slice(0, 8).map(jobRow).join("");

  await send(
    opts.driverEmail,
    `✅ You applied to ${opts.matchedJobs.length} CDL jobs — expect a call soon`,
    wrap(`
      <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a1a;">You're In, ${firstName}! 🎉</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">Your applications have been submitted. A recruiter will call or text <strong>${opts.driverPhone}</strong> within <strong style="color:#f97316;">15 minutes</strong>.</p>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#92400e;">
          <strong>📞 What to expect:</strong><br/>
          Our recruiter will confirm your CDL details and preferences, then match you with the best carrier from your list below. Most drivers get placed within 24–72 hours.
        </p>
      </div>

      <h3 style="margin:0 0 12px;font-size:15px;color:#1a1a1a;">Your ${opts.matchedJobs.length} Applications</h3>
      <table width="100%" cellpadding="0" cellspacing="0">${jobsHtml}</table>

      <div style="margin-top:24px;text-align:center;">
        <a href="https://truckdriverjobs.co/jobs"
           style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;padding:12px 24px;font-size:14px;font-weight:700;">
          Browse More Jobs
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;">
        You received this because you applied via TruckDriverJobs.co.<br/>
        Reply to this email to unsubscribe from future messages.
      </p>
    `, `Your CDL applications are submitted — expect a call to ${opts.driverPhone} within 15 min`)
  );
}

// ── 3. Admin — Quick Apply from job detail page ──────────────────────────────

export async function sendQuickApplyAlert(opts: {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  experience: string;
  hasCdl: boolean;
  jobTitle: string;
  jobCompany: string;
  jobId: number | string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@truckdriverjobs.co";

  await send(
    adminEmail,
    `🚛 Quick Apply — ${opts.applicantName} → ${opts.jobTitle} at ${opts.jobCompany}`,
    wrap(`
      <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a1a;">Quick Apply Submitted</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">Via job detail page</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;padding:16px;margin-bottom:24px;">
        <tr><td style="padding:4px 0;"><strong style="font-size:15px;color:#1a1a1a;">${opts.applicantName}</strong></td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#444;">📞 <a href="tel:${opts.applicantPhone}" style="color:#f97316;">${opts.applicantPhone}</a></td></tr>
        ${opts.applicantEmail ? `<tr><td style="padding:4px 0;font-size:14px;color:#444;">✉️ <a href="mailto:${opts.applicantEmail}" style="color:#f97316;">${opts.applicantEmail}</a></td></tr>` : ""}
        <tr><td style="padding:8px 0 4px;font-size:13px;color:#666;">CDL: ${opts.hasCdl ? "✅ Yes" : "❌ No"} · ${opts.experience}</td></tr>
      </table>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#166534;">
          <strong>Applied to:</strong><br/>
          ${opts.jobTitle} at <strong>${opts.jobCompany}</strong>
          <br/><span style="font-size:12px;color:#999;">Job ID: ${opts.jobId}</span>
        </p>
      </div>

      <div style="text-align:center;">
        <a href="https://truckdriverjobs.co/admin/drivers"
           style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;padding:12px 24px;font-size:14px;font-weight:700;">
          View Applications →
        </a>
      </div>
    `, `${opts.applicantName} applied to ${opts.jobTitle} at ${opts.jobCompany}`)
  );
}

// ── 4. Daily new jobs digest ─────────────────────────────────────────────────

export async function sendDailyDigest(opts: {
  recipientEmail: string;
  recipientName?: string;
  newJobs: Array<{ title?: string; company?: string; location?: string; equipment?: string; route_type?: string; pay_rate?: string; external_apply_url?: string; source_url?: string }>;
  totalJobs: number;
}): Promise<void> {
  if (!opts.recipientEmail || opts.newJobs.length === 0) return;
  const firstName = opts.recipientName?.split(" ")[0] ?? "there";
  const jobsHtml = opts.newJobs.slice(0, 10).map(jobRow).join("");
  const more = opts.newJobs.length > 10 ? opts.newJobs.length - 10 : 0;

  await send(
    opts.recipientEmail,
    `🚛 ${opts.newJobs.length} new CDL jobs added today — TruckDriverJobs.co`,
    wrap(`
      <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a1a;">Fresh CDL Jobs, ${firstName}</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">
        <strong>${opts.newJobs.length} new positions</strong> were added in the last 24 hours.
        We now have <strong>${opts.totalJobs.toLocaleString()} active jobs</strong> on the platform.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">${jobsHtml}</table>

      ${more > 0 ? `<p style="text-align:center;color:#666;font-size:13px;margin:16px 0;">+${more} more jobs available</p>` : ""}

      <div style="margin-top:24px;text-align:center;">
        <a href="https://truckdriverjobs.co/jobs"
           style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;padding:14px 32px;font-size:15px;font-weight:700;">
          View All ${opts.totalJobs.toLocaleString()} Jobs →
        </a>
      </div>

      <div style="margin-top:20px;text-align:center;">
        <a href="https://truckdriverjobs.co/match"
           style="display:inline-block;background:#fff;color:#f97316;text-decoration:none;border:2px solid #f97316;border-radius:8px;padding:10px 24px;font-size:13px;font-weight:700;">
          🤖 Use AI to Find Your Perfect Match
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;">
        You're receiving this because you applied for a CDL job on TruckDriverJobs.co.<br/>
        Reply "unsubscribe" to stop receiving these emails.
      </p>
    `, `${opts.newJobs.length} new CDL jobs added today on TruckDriverJobs.co`)
  );
}
