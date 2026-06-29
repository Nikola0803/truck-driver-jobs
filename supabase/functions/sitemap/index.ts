import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BASE_URL = "https://example.com";

const STATIC_URLS = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/blog", changefreq: "weekly", priority: "0.8" },
  { loc: "/for-fleets", changefreq: "monthly", priority: "0.9" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("VITE_PUBLIC_SUPABASE_URL") ?? "",
      Deno.env.get("VITE_PUBLIC_SUPABASE_ANON_KEY") ?? "",
    );

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .order("published_at", { ascending: false });

    if (error) {
      return new Response(`Sitemap generation error: ${error.message}`, {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const u of STATIC_URLS) {
      xml += "  <url>\n";
      xml += `    <loc>${escapeXml(BASE_URL + u.loc)}</loc>\n`;
      xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
      xml += `    <priority>${u.priority}</priority>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += "  </url>\n";
    }

    for (const post of posts ?? []) {
      const lastmod = post.updated_at ? formatDate(post.updated_at) : today;
      xml += "  <url>\n";
      xml += `    <loc>${escapeXml(BASE_URL + "/blog/" + post.slug)}</loc>\n`;
      xml += "    <changefreq>monthly</changefreq>\n";
      xml += "    <priority>0.6</priority>\n";
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += "  </url>\n";
    }

    xml += "</urlset>";

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
});
