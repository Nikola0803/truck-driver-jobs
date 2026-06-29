import Anthropic from "npm:@anthropic-ai/sdk@0.24.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign, count = 3 } = await req.json();

    if (!campaign) {
      return new Response(JSON.stringify({ error: "campaign is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are an expert copywriter for a truck driver recruitment company called TruckDriverJobs.co.
You write Facebook group posts that attract qualified CDL drivers to apply for trucking jobs.
Your tone is direct, credible, and driver-friendly — no corporate fluff, no clickbait.
Each post should feel authentic, like a real recruiter talking to a driver.
Always include a clear call-to-action directing drivers to apply or reach out.
Format each post as plain text with line breaks — no markdown, no hashtag spam (max 3 relevant hashtags).`;

    const userPrompt = buildPrompt(campaign, count);

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const rawText = (message.content[0] as any).text as string;
    const posts = parseGeneratedPosts(rawText, count);

    return new Response(JSON.stringify({ posts, raw: rawText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-content error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildPrompt(campaign: any, count: number): string {
  const jobType = campaign.job_type || "CDL Class A";
  const benefits = (campaign.benefits || []).join(", ") || "competitive pay, great benefits";
  const cta = campaign.cta || "Comment INTERESTED or send us a DM to apply today";
  const locations = (campaign.locations || []).slice(0, 5).join(", ") || "nationwide";

  return `Generate ${count} different Facebook group posts to recruit ${jobType} truck drivers.

Campaign details:
- Job Type: ${jobType}
- Locations hiring: ${locations}
- Key benefits: ${benefits}
- Call to action: ${cta}
${campaign.description ? `- Additional details: ${campaign.description}` : ""}

Write ${count} distinct post variants. Make each one different in tone and angle:
1. Lead with the BENEFIT (pay/home time/lifestyle)
2. Lead with URGENCY (positions filling fast, hiring now)
3. Lead with the DRIVER'S PAIN POINT (tired of being away from family?)
${count > 3 ? "4. Conversational Q&A style post\n5. Social proof / testimonial style\n6. Comparison post (vs other carriers)" : ""}

Format each post clearly separated by ---POST---

Each post should be 3-5 paragraphs, Facebook-optimized length (150-300 words).`;
}

function parseGeneratedPosts(raw: string, expectedCount: number): string[] {
  // Try splitting by the ---POST--- delimiter
  const delimiter = "---POST---";
  if (raw.includes(delimiter)) {
    return raw
      .split(delimiter)
      .map((s) => s.trim())
      .filter((s) => s.length > 50)
      .slice(0, expectedCount);
  }

  // Fallback: split by double newlines between numbered posts (1., 2., 3.)
  const numbered = raw.split(/\n(?=\d+\.\s)/).map((s) => s.replace(/^\d+\.\s*/, "").trim()).filter((s) => s.length > 50);
  if (numbered.length >= 2) return numbered.slice(0, expectedCount);

  // Last resort: return the whole thing as a single post
  return [raw.trim()];
}
