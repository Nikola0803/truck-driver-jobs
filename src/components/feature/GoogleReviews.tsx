export default function GoogleReviews() {
  const reviews = [
    {
      name: "Miguel Hernandez",
      location: "Houston, TX",
      avatar: "MH",
      rating: 5,
      date: "3 weeks ago",
      text: "Best trucking job board I have ever used. Applied for a regional reefer position on Monday, got a call Tuesday morning, and started orientation that Friday. My recruiter Rosa speaks Spanish which made everything so much easier for me. $3,200 a week guaranteed. Gracias!",
    },
    {
      name: "Dragan Petrovic",
      location: "Chicago, IL",
      avatar: "DP",
      rating: 5,
      date: "1 month ago",
      text: "I came to USA from Serbia 4 years ago and got my CDL. TruckDriverJobs.co found me a dedicated flatbed route paying $0.72 CPM within 2 days. The recruiter understood my accent and helped me with all the paperwork. Very professional company, been working with them for 3 years now.",
    },
    {
      name: "Robert Jenkins",
      location: "Dallas, TX",
      avatar: "RJ",
      rating: 5,
      date: "2 months ago",
      text: "Been driving trucks for 22 years. Used every job board under the sun. These guys are the real deal. No BS, no ghost jobs, no fake listings. Every position they sent me was exactly as advertised. Landed a $2,900/week dedicated Walmart route. 5 stars.",
    },
    {
      name: "Aleksandar Novak",
      location: "Detroit, MI",
      avatar: "AN",
      rating: 5,
      date: "2 months ago",
      text: "From Bosnia and been driving in US for 6 years. The team here always finds me good paying routes during slow seasons. Winter time they got me a $3,500/week dry van position when everyone else said there was nothing. Honest people. Highly recommend to all European drivers.",
    },
    {
      name: "Jose Garcia",
      location: "Phoenix, AZ",
      avatar: "JG",
      rating: 5,
      date: "3 months ago",
      text: "Mi familia y yo estamos muy agradecidos. Found a local day route paying $1,400/week home every night. My wife does not worry anymore. The recruiter called me back in 10 minutes after I applied. Fastest hiring process I have ever seen. Muchas gracias TruckDriverJobs.co!",
    },
    {
      name: "William \"Buddy\" Thompson",
      location: "Nashville, TN",
      avatar: "BT",
      rating: 4,
      date: "4 months ago",
      text: "Solid company. Been using them on and off since 2018. They placed me in 4 different positions over the years, every one better than the last. My only gripe is sometimes the high-demand jobs get filled fast, but that is just the market. Their 72-hour guarantee actually works.",
    },
  ];

  return (
    <section className="bg-brand-bg px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-sm font-bold text-brand-text">
              Google Reviews
            </span>
          </div>
          <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
            What Drivers Say on{" "}
            <span className="text-brand-orange">Google</span>
          </h2>
          <div className="mx-auto mt-3 flex items-center justify-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill={s <= 4 ? "#FABB05" : "#FABB05"}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-lg font-bold text-brand-text">4.9</span>
            <span className="text-sm text-brand-text-secondary">
              out of 5 &middot; 847 reviews
            </span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="flex flex-col rounded-xl border border-brand-border bg-brand-surface p-5 transition-all hover:border-brand-orange/20"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-bg text-xs font-bold text-brand-text">
                  {r.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-text">
                    {r.name}
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    {r.location} &middot; {r.date}
                  </p>
                </div>
                <svg
                  className="ml-auto h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>

              {/* Stars */}
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="#FABB05"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-text-secondary">
                &ldquo;{r.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="#"
            rel="nofollow"
            className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-5 py-2.5 text-sm font-medium text-brand-text-secondary transition-colors hover:border-brand-orange hover:text-brand-orange"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Read all 847 reviews on Google
            <i className="ri-external-link-line" />
          </a>
        </div>
      </div>
    </section>
  );
}