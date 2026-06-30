import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import SeoHead from "@/components/feature/SeoHead";
import SITE_URL from "@/lib/siteUrl";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  published_at: string;
  featured: boolean;
  image_url: string | null;
}

const blogDescription = "Real talk for CDL drivers. Salary breakdowns, career guides, regulation updates, and stories from the road. No fluff. No corporate spin. Published by TruckDriverJobs.co since 2016.";
const blogKeywords = "CDL career guides, trucking blog, truck driver salary, CDL news, trucking regulations, driver lifestyle, owner-operator tips, truck driver health";

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await db
        .from("blog_posts")
        .select("id, slug, title, excerpt, category, read_time, published_at, featured, image_url")
        .order("published_at", { ascending: false });

      if (!error && data) {
        setPosts(data as BlogPost[]);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const featured = posts.filter((p) => p.featured);
  const regular = posts.filter((p) => !p.featured);

  const categoryGroups = regular.reduce<Record<string, BlogPost[]>>((acc, post) => {
    if (!acc[post.category]) acc[post.category] = [];
    acc[post.category].push(post);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background-50 font-sans text-foreground-950">
      <SeoHead
        title="The Dispatch: CDL Trucking Career Guides, Salary Breakdowns & Industry News"
        description={blogDescription}
        keywords={blogKeywords}
        canonicalUrl={`${SITE_URL}/blog`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "The Dispatch: CDL Trucking Career Guides",
            "description": blogDescription,
            "url": `${SITE_URL}/blog`,
            "publisher": {
              "@type": "Organization",
              "name": "TruckDriverJobs.co",
              "url": SITE_URL
            },
            "about": "CDL trucking careers, driver lifestyle, industry regulations, and salary guides",
            "blogPost": posts.slice(0, 20).map((p) => ({
              "@type": "BlogPosting",
              "headline": p.title,
              "description": p.excerpt,
              "url": `${SITE_URL}/blog/${p.slug}`,
              "datePublished": p.published_at,
              "image": p.image_url ?? undefined,
              "author": { "@type": "Organization", "name": "TruckDriverJobs.co Editorial Team", "url": SITE_URL }
            }))
          }
        ]}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-8 pb-16 md:px-10 md:pt-14 md:pb-24">
        <div className="absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-accent-500/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-background-200 bg-background-50 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-primary-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-600">
              Est. 2016 &middot; {posts.length}+ articles published
            </span>
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground-950 md:text-6xl">
            The <span className="text-primary-500">Dispatch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-foreground-600 md:text-lg">
            {blogDescription}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="px-6 pb-16 md:px-10 md:pb-24">
        <div className="mx-auto max-w-6xl">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-background-200 border-t-primary-500" />
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background-100 mx-auto">
                <i className="ri-article-line text-2xl text-foreground-400" />
              </div>
              <p className="mt-4 text-foreground-500">No articles yet. Check back soon, we are always working on fresh content.</p>
            </div>
          )}

          {/* FEATURED */}
          {!loading && featured.length > 0 && (
            <div className="mb-14">
              <span className="mb-5 block text-xs font-bold uppercase tracking-wider text-primary-600">
                Featured Stories
              </span>
              <div className="grid gap-6 md:grid-cols-2">
                {featured.slice(0, 2).map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-background-200 bg-background-50 transition-all hover:-translate-y-0.5 hover:border-primary-500/30"
                  >
                    {post.image_url && (
                      <div className="h-48 w-full overflow-hidden">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                          {post.category}
                        </span>
                        <span className="text-xs text-foreground-500">
                          {post.read_time}
                        </span>
                      </div>
                      <h2 className="font-heading text-xl font-bold text-foreground-950 transition-colors group-hover:text-primary-500 md:text-2xl">
                        {post.title}
                      </h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-600">
                        {post.excerpt}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-foreground-400">
                        <i className="ri-calendar-line" />
                        <time dateTime={post.published_at}>
                          {new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </time>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY GROUPED POSTS */}
          {!loading && Object.keys(categoryGroups).length > 0 && (
            <div className="space-y-12">
              {Object.entries(categoryGroups).map(([category, catPosts]) => (
                <div key={category}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground-400">
                      {category}
                    </span>
                    <span className="text-xs text-foreground-400">
                      {catPosts.length} article{catPosts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {catPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/blog/${post.slug}`}
                        className="group flex flex-col rounded-xl border border-background-200 bg-background-50 p-5 transition-all hover:-translate-y-0.5 hover:border-primary-500/30"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-background-100 px-3 py-1 text-xs font-medium text-foreground-600">
                            {post.category}
                          </span>
                          <span className="text-xs text-foreground-500">
                            {post.read_time}
                          </span>
                        </div>
                        <h3 className="font-heading text-base font-bold text-foreground-950 transition-colors group-hover:text-primary-500 md:text-lg">
                          {post.title}
                        </h3>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-600 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-foreground-400">
                          <i className="ri-calendar-line" />
                          <time dateTime={post.published_at}>
                            {new Date(post.published_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </time>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background-100 px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground-950 md:text-4xl">
            Ready to Put This Knowledge to Work?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-foreground-600 md:text-base">
            Browse 450+ active CDL positions and apply in 30 seconds. No resume. No BS.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-primary-500 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-background-50 transition-colors hover:bg-primary-600 whitespace-nowrap"
          >
            Find Jobs Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}