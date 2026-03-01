"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";

type PricingData = {
  pricing_by_type: {
    xbox: { price_1_mad: number; price_4_mad: number | null };
    standard_ps5: { price_1_mad: number; price_4_mad: number | null };
    premium_ps5: { price_1_mad: number; price_4_mad: number | null };
  };
  membership_price_mad: number;
};

function getLang(): "en" | "ar" {
  if (typeof window === "undefined") return "en";
  const doc = document.documentElement.lang;
  const nav = navigator.language || "";
  if (doc === "ar" || nav.startsWith("ar")) return "ar";
  return "en";
}

const t = {
  pricing: { en: "Pricing", ar: "التسعير" },
  chooseExperience: { en: "Choose Your Experience", ar: "اختر تجربتك" },
  subtext: {
    en: "Flexible pricing for every type of gamer. No hidden fees, no surprises.",
    ar: "أسعار مرنة لكل نوع من اللاعبين. بدون رسوم مخفية، بدون مفاجآت.",
  },
  standard: { en: "Standard", ar: "عادي" },
  standardDesc: {
    en: "From Xbox solo sessions to group PS5 gaming.",
    ar: "من جلسات إكس بوكس الفردية إلى لعب PS5 الجماعي.",
  },
  vip: { en: "VIP PS5", ar: "PS5 VIP" },
  vipDesc: {
    en: "Premium setup with large screen and sofa for solo or group play.",
    ar: "إعداد مميز بشاشة كبيرة وأريكة للعب الفردي أو الجماعي.",
  },
  membership: { en: "Membership", ar: "العضوية" },
  membershipDesc: { en: "Exclusive perks for dedicated gamers.", ar: "مزايا حصرية للاعبين المتفانين." },
  popular: { en: "Popular", ar: "الأكثر شعبية" },
  getStarted: { en: "Get Started", ar: "ابدأ الآن" },
  loading: { en: "Loading pricing…", ar: "جاري تحميل الأسعار…" },
  error: { en: "Unable to load pricing.", ar: "تعذر تحميل الأسعار." },
  xbox1p: { en: "Xbox (1 person max)", ar: "إكس بوكس (شخص واحد كحد أقصى)" },
  standardPs5: { en: "Standard PS5", ar: "PS5 عادي" },
  standardPs5_4p: { en: "Standard PS5 (4 people)", ar: "PS5 عادي (4 أشخاص)" },
  solo: { en: "Solo", ar: "فردي" },
  fourPeople: { en: "4 people", ar: "4 أشخاص" },
  madHr: { en: "MAD/h", ar: "درهم/ساعة" },
  madMonth: { en: "MAD/month", ar: "درهم/شهر" },
  features: {
    console: { en: "Console access", ar: "الوصول إلى الكونسول" },
    monitor: { en: "4K HDR monitor", ar: "شاشة 4K HDR" },
    controller: { en: "DualSense controller", ar: "جهاز DualSense" },
    seating: { en: "Standard seating", ar: "مقاعد عادية" },
    wifi: { en: "High-speed WiFi", ar: "واي فاي عالي السرعة" },
    tv: { en: "55″ 4K TV", ar: "تلفزيون 55 بوصة 4K" },
    sofa: { en: "Comfortable 3-person sofa", ar: "أريكة مريحة لـ3 أشخاص" },
    everything: { en: "Everything in Standard", ar: "كل ما في العادي" },
    booth: { en: "Private booth experience", ar: "تجربة كابينة خاصة" },
    drinks: { en: "Complimentary drinks", ar: "مشروبات مجانية" },
    priority: { en: "Priority booking", ar: "الحجز بالأولوية" },
    freeHours: { en: "20 free PS5 VIP hours per month", ar: "20 ساعة PS5 VIP مجانية شهرياً" },
    vipAtStandard: { en: "Get VIP at standard price when available", ar: "احصل على VIP بالسعر العادي عند التوفر" },
    tournament: { en: "Tournament priority entry", ar: "دخول الأولوية للبطولات" },
    guestPasses: { en: "Guest passes (2/month)", ar: "جوازات ضيوف (2/شهر)" },
    events: { en: "Exclusive member events", ar: "فعاليات حصرية للأعضاء" },
    loyalty: { en: "Loyalty rewards program", ar: "برنامج مكافآت الولاء" },
  },
};

function buildPlans(
  data: PricingData,
  lang: "en" | "ar"
): {
  name: string;
  priceLabel: string;
  description: string;
  priceLines: string[];
  features: string[];
  featured: boolean;
}[] {
  const x = data.pricing_by_type.xbox;
  const s = data.pricing_by_type.standard_ps5;
  const p = data.pricing_by_type.premium_ps5;
  const m = data.membership_price_mad;
  const madHr = t.madHr[lang];
  const madMonth = t.madMonth[lang];

  const standardPrices = [x.price_1_mad];
  if (s.price_1_mad !== x.price_1_mad) standardPrices.push(s.price_1_mad);
  if (s.price_4_mad != null) standardPrices.push(s.price_4_mad);
  const standardMin = Math.min(...standardPrices);
  const standardMax = Math.max(...standardPrices);
  const standardLabel =
    standardMin === standardMax ? `${standardMin} ${madHr}` : `${standardMin}–${standardMax} ${madHr}`;

  const vipPrices = [p.price_1_mad];
  if (p.price_4_mad != null) vipPrices.push(p.price_4_mad);
  const vipMin = Math.min(...vipPrices);
  const vipMax = Math.max(...vipPrices);
  const vipLabel = vipMin === vipMax ? `${vipMin} ${madHr}` : `${vipMin}–${vipMax} ${madHr}`;

  const standardLines: string[] = [`${x.price_1_mad} ${madHr} — ${t.xbox1p[lang]}`];
  if (s.price_1_mad !== x.price_1_mad || x.price_4_mad == null)
    standardLines.push(`${s.price_1_mad} ${madHr} — ${t.standardPs5[lang]}`);
  if (s.price_4_mad != null)
    standardLines.push(`${s.price_4_mad} ${madHr} — ${t.standardPs5_4p[lang]}`);

  const vipLines: string[] = [`${p.price_1_mad} ${madHr} — ${t.solo[lang]}`];
  if (p.price_4_mad != null) vipLines.push(`${p.price_4_mad} ${madHr} — ${t.fourPeople[lang]}`);

  return [
    {
      name: t.standard[lang],
      priceLabel: standardLabel,
      description: t.standardDesc[lang],
      priceLines: standardLines,
      features: [
        t.features.console[lang],
        t.features.monitor[lang],
        t.features.controller[lang],
        t.features.seating[lang],
        t.features.wifi[lang],
      ],
      featured: false,
    },
    {
      name: t.vip[lang],
      priceLabel: vipLabel,
      description: t.vipDesc[lang],
      priceLines: vipLines,
      features: [
        t.features.tv[lang],
        t.features.sofa[lang],
        t.features.everything[lang],
        t.features.booth[lang],
        t.features.drinks[lang],
        t.features.priority[lang],
      ],
      featured: true,
    },
    {
      name: t.membership[lang],
      priceLabel: `${m} ${madMonth}`,
      description: t.membershipDesc[lang],
      priceLines: [],
      features: [
        t.features.freeHours[lang],
        t.features.vipAtStandard[lang],
        t.features.tournament[lang],
        t.features.guestPasses[lang],
        t.features.events[lang],
        t.features.loyalty[lang],
      ],
      featured: false,
    },
  ];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Pricing() {
  const [data, setData] = useState<PricingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "ar">("en");

  useEffect(() => {
    setLang(getLang());
    fetch("/api/pricing", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(() => setError("load"));
  }, []);

  if (error) {
    return (
      <section id="pricing" className="relative py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center text-muted-foreground">
          {t.error[lang]}
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section id="pricing" className="relative py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center text-muted-foreground">
          {t.loading[lang]}
        </div>
      </section>
    );
  }

  const plans = buildPlans(data, lang);

  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {t.pricing[lang]}
          </span>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            {t.chooseExperience[lang]}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            {t.subtext[lang]}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              className={`relative flex flex-col overflow-hidden rounded-2xl p-8 transition-all duration-500 hover:-translate-y-1 ${
                plan.featured
                  ? "glass-strong border border-primary/30 glow-orange-sm"
                  : "glass"
              }`}
            >
              {plan.featured && (
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <Star className="h-3 w-3" />
                  {t.popular[lang]}
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-black text-foreground md:text-4xl">
                  {plan.priceLabel}
                </span>
                {plan.priceLines.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {plan.priceLines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                  plan.featured
                    ? "glow-orange bg-primary text-primary-foreground hover:brightness-110"
                    : "border border-border bg-secondary text-foreground hover:border-muted-foreground"
                }`}
              >
                {t.getStarted[lang]}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
