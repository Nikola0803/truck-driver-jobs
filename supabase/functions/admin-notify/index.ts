import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

interface NotifyPayload {
  event: "new_signup" | "new_application";
  data: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = (await req.json()) as NotifyPayload;
    const { event, data } = body;

    // Admin notification configuration
    // The user can configure a webhook URL to receive these notifications
    // For now, we log to the console and return the payload
    // In production, replace this with an actual email service call:
    //   - SendGrid: https://api.sendgrid.com/v3/mail/send
    //   - Resend: https://api.resend.com/emails
    //   - Mailgun: https://api.mailgun.net/v3/.../messages
    //   - Or a custom webhook endpoint

    const timestamp = new Date().toISOString();
    const subject = event === "new_signup"
      ? "New Driver Signup - TruckDriverJobs.co"
      : "New Job Application - TruckDriverJobs.co";

    const messageBody = event === "new_signup"
      ? `New driver signup:\nName: ${data.driverName || "N/A"}\nEmail: ${data.driverEmail || "N/A"}\nPhone: ${data.driverPhone || "N/A"}\nType: ${data.driverType || "N/A"}\nExperience: ${data.experience || "N/A"}\nLocation: ${data.location || "N/A"}\nTime: ${timestamp}`
      : `New job application:\nDriver: ${data.driverName || "N/A"}\nEmail: ${data.driverEmail || "N/A"}\nPhone: ${data.driverPhone || "N/A"}\nJob: ${data.jobTitle || "N/A"}\nCompany: ${data.jobCompany || "N/A"}\nExperience: ${data.experience || "N/A"}\nTime: ${timestamp}`;

    // Log to Supabase function logs (visible in dashboard)
    console.log("=== ADMIN NOTIFICATION ===");
    console.log("Subject:", subject);
    console.log("Body:", messageBody);
    console.log("Raw data:", JSON.stringify(data));
    console.log("==========================");

    // Attempt to send to a webhook if configured
    const webhookUrl = Deno.env.get("ADMIN_WEBHOOK_URL");
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, data, timestamp }),
        });
      } catch (webhookErr) {
        console.error("Webhook failed:", webhookErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, event, timestamp }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Admin notify error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
