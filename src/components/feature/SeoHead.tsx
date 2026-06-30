import SITE_URL from "@/lib/siteUrl";

interface SeoHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export default function SeoHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  jsonLd,
}: SeoHeadProps) {
  // Google truncates titles around ~60 chars in search results. Only append
  // the brand suffix when there's room — long dynamic titles (job postings,
  // specific equipment pages) are already descriptive enough on their own.
  const BRAND_SUFFIX = " | TruckDriverJobs.co";
  const fullTitle = title.length + BRAND_SUFFIX.length <= 60 ? `${title}${BRAND_SUFFIX}` : title;
  // Google truncates meta descriptions around ~155-160 chars. Trim with an
  // ellipsis rather than letting the SERP snippet cut off mid-word.
  const safeDescription = description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
  const ogTitleFinal = ogTitle ?? fullTitle;
  const ogDescriptionFinal = ogDescription ?? safeDescription;
  const resolvedCanonical = canonicalUrl ?? SITE_URL;
  const jsonLdArray = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
    : [];

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={safeDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={resolvedCanonical} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={ogTitleFinal} />
      <meta property="og:description" content={ogDescriptionFinal} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:site_name" content="TruckDriverJobs.co" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitleFinal} />
      <meta name="twitter:description" content={ogDescriptionFinal} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Structured Data */}
      {jsonLdArray.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
    </>
  );
}