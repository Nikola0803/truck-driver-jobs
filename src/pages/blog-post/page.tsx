import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "@/lib/db";
import { track } from "@/lib/analytics";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import SeoHead from "@/components/feature/SeoHead";
import MarkdownContent, { extractTOC } from "@/components/feature/MarkdownContent";
import SITE_URL from "@/lib/siteUrl";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: string;
  published_at: string;
  updated_at: string | null;
  image_url: string | null;
  meta_description: string | null;
}

interface RelatedPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  read_time: string;
  published_at: string;
}

function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 225));
  return `${minutes} min read`;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const viewTracked = useRef(false);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;
      const { data, error } = await db
        .from("blog_posts")
        .select("id, slug, title, excerpt, content, category, read_time, published_at, updated_at, image_url, meta_description")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        setPost(data as BlogPost);

        const { data: relData } = await db
          .from("blog_posts")
          .select("id, slug, title, category, read_time, published_at")
          .eq("category", data.category)
          .neq("slug", slug)
          .order("published_at", { ascending: false })
          .limit(3);

        if (relData && relData.length > 0) {
          setRelated(relData as RelatedPost[]);
        } else {
          const { data: anyRel } = await db
            .from("blog_posts")
            .select("id, slug, title, category, read_time, published_at")
            .neq("slug", slug)
            .order("published_at", { ascending: false })
            .limit(3);
          if (anyRel) setRelated(anyRel as RelatedPost[]);
        }
      }
      setLoading(false);
    }
    fetchPost();
  }, [slug]);

  // Track blog view analytics event
  useEffect(() => {
    if (post && !viewTracked.current) {
      viewTracked.current = true;
      track("blog_view", {
        blog_post_id: post.id,
        blog_slug: post.slug,
        blog_category: post.category,
        blog_title: post.title,
      });
    }
  }, [post]);

  const handleBlogCtaClick = () => {
    if (post) {
      // Track CTA click
      track("blog_cta_click", {
        blog_post_id: post.id,
        blog_slug: post.slug,
        blog_category: post.category,
        blog_title: post.title,
      });
      // Store referral so ApplyModal can tag the application
      try {
        sessionStorage.setItem("blog_referral", JSON.stringify({
          blog_post_id: post.id,
          blog_category: post.category,
          blog_slug: post.slug,
          timestamp: Date.now(),
        }));
      } catch { /* sessionStorage might be full */ }
    }
  };

  const toc = useMemo(() => {
    if (!post?.content) return [];
    return extractTOC(post.content);
  }, [post?.content]);

  const faqSections = useMemo(() => {
    if (!post?.content) return [];
    const items: { question: string; answer: string }[] = [];
    const lines = post.content.split('\n');
    let i = 0;
    while (i < lines.length) {
      const qMatch = lines[i].trim().match(/^### (.+\?)$/);
      if (qMatch) {
        const question = qMatch[1];
        const answerLines: string[] = [];
        i++;
        while (i < lines.length) {
          const nl = lines[i].trim();
          if (!nl || nl.startsWith('#') || nl.startsWith('---')) break;
          answerLines.push(nl);
          i++;
        }
        const answer = answerLines.join(' ').trim();
        if (answer) {
          items.push({ question, answer });
        }
      } else {
        i++;
      }
    }
    return items.slice(0, 10);
  }, [post?.content]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 font-sans text-foreground-950">
        <SeoHead title="Loading..." description="Loading article..." />
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-background-200 border-t-primary-500" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background-50 font-sans text-foreground-950">
        <SeoHead title="Article Not Found" description="This article has been removed or the link is incorrect." />
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background-100 mx-auto">
            <i className="ri-error-warning-line text-3xl text-primary-500" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-bold text-foreground-950">Article Not Found</h1>
          <p className="mt-2 text-foreground-600">This article has been removed or the link is incorrect.</p>
          <Link
            to="/blog"
            className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-bold text-background-50 transition-colors hover:bg-primary-600 whitespace-nowrap"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const displayReadTime = post.read_time || estimateReadingTime(post.content);
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const dateModified = post.updated_at || post.published_at;

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "The Dispatch", "item": `${SITE_URL}/blog` },
        { "@type": "ListItem", "position": 3, "name": post.title }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.image_url ?? undefined,
      "datePublished": post.published_at,
      "dateModified": dateModified,
      "author": {
        "@type": "Organization",
        "name": "TruckDriverJobs.co Editorial Team",
        "url": SITE_URL
      },
      "publisher": {
        "@type": "Organization",
        "name": "TruckDriverJobs.co",
        "url": SITE_URL,
        "logo": { "@type": "ImageObject", "url": `${SITE_URL}/vite.svg` }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      }
    }
  ];

  if (faqSections.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqSections.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });
  }

  return (
    <div className="min-h-screen bg-background-50 font-sans text-foreground-950">
      <SeoHead
        title={post.title}
        description={post.meta_description || post.excerpt}
        keywords={`CDL, trucking, ${post.category.toLowerCase()}, truck driver career, ${post.title.toLowerCase()}`}
        canonicalUrl={canonicalUrl}
        ogType="article"
        ogImage={post.image_url ?? undefined}
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* ARTICLE HEADER */}
      <section className="px-6 pt-8 pb-4 md:px-10 md:pt-14">
        <div className="mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-foreground-500">
              <li><Link to="/" className="transition-colors hover:text-primary-500">Home</Link></li>
              <li><span className="mx-1">/</span></li>
              <li><Link to="/blog" className="transition-colors hover:text-primary-500">The Dispatch</Link></li>
              <li><span className="mx-1">/</span></li>
              <li className="text-foreground-400 truncate max-w-[200px]" aria-current="page">{post.title}</li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
              {post.category}
            </span>
            <span className="text-xs text-foreground-500">
              <i className="ri-calendar-line mr-1" />
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </time>
            </span>
            <span className="text-xs text-foreground-500">
              <i className="ri-time-line mr-1" />
              {displayReadTime}
            </span>
            {post.updated_at && post.updated_at !== post.published_at && (
              <span className="text-xs text-foreground-400">
                <i className="ri-refresh-line mr-1" />
                Updated {new Date(post.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </span>
            )}
          </div>

          <h1 className="font-heading mt-4 text-3xl font-bold leading-tight text-foreground-950 md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-foreground-600 md:text-lg">
            {post.excerpt}
          </p>
        </div>
      </section>

      {/* HERO IMAGE */}
      {post.image_url && (
        <section className="px-6 md:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={post.image_url}
                alt={post.title}
                className="h-[280px] w-full object-cover md:h-[420px]"
              />
            </div>
          </div>
        </section>
      )}

      {/* ARTICLE LAYOUT: TOC + CONTENT */}
      <section className="px-6 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            {/* TABLE OF CONTENTS — DESKTOP SIDEBAR */}
            {toc.length > 2 && (
              <aside className="hidden lg:block lg:w-56 shrink-0">
                <div className="sticky top-24 rounded-xl border border-background-200 bg-background-50 p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground-500">
                    <i className="ri-list-unordered text-sm" />
                    On This Page
                  </h4>
                  <nav aria-label="Table of Contents">
                    <ul className="space-y-1.5">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className={`block text-sm transition-colors hover:text-primary-500 ${
                              item.level === 2
                                ? 'font-medium text-foreground-700'
                                : 'pl-3 text-foreground-500'
                            }`}
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </aside>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-1 min-w-0">
              {/* Mobile TOC accordion */}
              {toc.length > 2 && (
                <details className="mb-6 rounded-xl border border-background-200 bg-background-50 lg:hidden">
                  <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-foreground-700 select-none">
                    <i className="ri-list-unordered mr-2" />
                    On This Page
                  </summary>
                  <nav aria-label="Table of Contents" className="px-5 pb-4">
                    <ul className="space-y-1.5">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className={`block text-sm transition-colors hover:text-primary-500 ${
                              item.level === 2
                                ? 'font-medium text-foreground-700'
                                : 'pl-3 text-foreground-500'
                            }`}
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </details>
              )}

              <article className="rounded-2xl border border-background-200 bg-background-50 p-6 md:p-10">
                <MarkdownContent content={post.content} />

                {/* AUTHOR — E-E-A-T SIGNALS */}
                <div className="mt-10 border-t border-background-200 pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100">
                      <i className="ri-pencil-line text-lg text-primary-600" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground-950">
                          TruckDriverJobs.co Editorial Team
                        </p>
                        <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-700">
                          Verified Expert
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-foreground-500">
                        Published by the editorial team at TruckDriverJobs.co, the leading CDL driver recruiting platform since 2016.
                        Our content is fact-checked against FMCSA regulations, reviewed by active CDL drivers, 
                        and updated regularly to reflect the latest industry changes. 
                        <span className="block mt-1 text-foreground-400">
                          <i className="ri-check-double-line mr-1" />
                          Fact-checked &middot; Driver-reviewed &middot; Updated {new Date(dateModified).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* DISCLAIMER */}
                <div className="mt-6 rounded-lg border border-background-200 bg-background-100 px-4 py-3">
                  <p className="text-xs leading-relaxed text-foreground-400">
                    <strong className="text-foreground-500">Disclaimer:</strong> This article is for informational purposes only and does not constitute legal, tax, or financial advice. 
                    Regulations change frequently. Always verify current FMCSA rules at{' '}
                    <a href="https://www.fmcsa.dot.gov" target="_blank" rel="nofollow noopener noreferrer" className="text-primary-500 underline underline-offset-2 hover:text-primary-600">fmcsa.dot.gov</a>.
                  </p>
                </div>
              </article>

              {/* FAQ SECTION — if article has FAQ-format sections */}
              {faqSections.length > 0 && (
                <div className="mt-8 rounded-2xl border border-background-200 bg-background-50 p-6 md:p-10">
                  <h2 className="font-heading mb-6 text-xl font-bold text-foreground-950 md:text-2xl">
                    Frequently Asked Questions
                  </h2>
                  <dl className="space-y-4">
                    {faqSections.map((faq, idx) => (
                      <div key={idx} className="border-b border-background-200 pb-4 last:border-b-0 last:pb-0">
                        <dt className="text-sm font-semibold text-foreground-900">{faq.question}</dt>
                        <dd className="mt-2 text-sm leading-relaxed text-foreground-600">{faq.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* CTA Banner */}
              <div className="mt-8 rounded-2xl border border-background-200 bg-background-50 p-6 md:p-8">
                <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-bold text-foreground-950 md:text-xl">
                      Ready to Find Your Next High-Paying Job?
                    </h3>
                    <p className="mt-1 text-sm text-foreground-600">
                      Apply in 30 seconds. No resume needed. A recruiter will call you within 15 minutes.
                    </p>
                  </div>
                  <Link
                    to="/"
                    onClick={handleBlogCtaClick}
                    className="shrink-0 rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-background-50 transition-colors hover:bg-primary-600 whitespace-nowrap"
                  >
                    Find Jobs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED POSTS */}
      {related.length > 0 && (
        <section className="bg-background-100 px-6 py-12 md:px-10 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
                More from <span className="text-primary-500">The Dispatch</span>
              </h2>
              <Link
                to="/blog"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary-500 transition-colors hover:text-primary-600 whitespace-nowrap"
              >
                View All <i className="ri-arrow-right-line" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="group flex flex-col rounded-xl border border-background-200 bg-background-50 p-5 transition-all hover:-translate-y-0.5 hover:border-primary-500/30"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                      {r.category}
                    </span>
                    <span className="text-xs text-foreground-500">{r.read_time}</span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground-950 transition-colors group-hover:text-primary-500">
                    {r.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-xs text-foreground-400">
                    <i className="ri-calendar-line" />
                    <time dateTime={r.published_at}>
                      {new Date(r.published_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}