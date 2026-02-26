"use client";

const t = {
  en: {
    title: "You're offline",
    message: "Check your internet connection and try again.",
    retry: "Retry",
  },
  ar: {
    title: "أنت غير متصل",
    message: "تحقق من اتصالك بالإنترنت وحاول مرة أخرى.",
    retry: "إعادة المحاولة",
  },
};

export default function OfflinePage() {
  const lang: "en" | "ar" = "en";
  const labels = t[lang];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{labels.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{labels.message}</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {labels.retry}
        </button>
      </div>
    </div>
  );
}
