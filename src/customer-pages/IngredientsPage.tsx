import Image from "next/image";
import {
  Check,
  CheckCircle2,
  Flower2,
  ShieldCheck,
  Sparkles,
  SunMedium,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "../i18n";

const ingredientImage = "/images/home/ingredient-education-skincare.png";

type Ingredient = {
  name: string;
  category: string;
  alternateName?: string;
  description: string;
  benefits: string[];
  icon: LucideIcon;
  featured?: boolean;
};

export function IngredientsPage() {
  const { t, list } = useI18n();
  const ingredients: Ingredient[] = [
    {
      name: t("ingredients.saffron.name"),
      category: t("ingredients.saffron.category"),
      description: t("ingredients.saffron.description"),
      benefits: list("ingredients.saffron.benefits"),
      icon: SunMedium,
      featured: true,
    },
    {
      name: t("ingredients.alphaArbutin.name"),
      category: t("ingredients.alphaArbutin.category"),
      description: t("ingredients.alphaArbutin.description"),
      benefits: list("ingredients.alphaArbutin.benefits"),
      icon: Sparkles,
    },
    {
      name: t("ingredients.niacinamide.name"),
      category: t("ingredients.niacinamide.category"),
      alternateName: t("ingredients.niacinamide.alternateName"),
      description: t("ingredients.niacinamide.description"),
      benefits: list("ingredients.niacinamide.benefits"),
      icon: ShieldCheck,
    },
    {
      name: t("ingredients.rose.name"),
      category: t("ingredients.rose.category"),
      description: t("ingredients.rose.description"),
      benefits: list("ingredients.rose.benefits"),
      icon: Flower2,
    },
  ];

  return (
    <>
      <section className="ingredients-hero overflow-hidden">
        <div className="page-shell grid items-center gap-12 py-14 sm:py-20 lg:min-h-[660px] lg:grid-cols-[0.94fr_1.06fr] lg:gap-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">{t("ingredients.eyebrow")}</p>
            <h1 className="mt-4 max-w-[13ch] text-balance text-[2.25rem] leading-[1.08] sm:text-5xl lg:text-6xl">
              {t("ingredients.title")}
            </h1>
            <p className="mt-6 max-w-xl text-[0.95rem] font-light leading-7 text-yara-taupe sm:mt-7 sm:text-base sm:leading-8">
              {t("ingredients.copy")}
            </p>

            <div className="mt-8 max-w-xl rounded-[1.75rem] border border-[#e7bd6b]/45 bg-white/75 p-5 shadow-card backdrop-blur-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f7e5bd] text-[#9b6517]" aria-hidden="true">
                  <SunMedium className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8c5b16]">
                    {t("ingredients.heroBadgeEyebrow")}
                  </p>
                  <p className="mt-0.5 font-serif text-2xl text-yara-ink">{t("ingredients.heroBadgeTitle")}</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-light leading-7 text-yara-taupe">
                {t("ingredients.heroBadgeCopy")}
              </p>
            </div>
          </div>

          <div className="ingredients-image-frame relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="ingredients-saffron-orb ingredients-saffron-orb-top" aria-hidden="true" />
            <div className="ingredients-saffron-orb ingredients-saffron-orb-bottom" aria-hidden="true" />
            <Image
              src={ingredientImage}
              alt={t("ingredients.imageAlt")}
              width={1254}
              height={1254}
              priority
              sizes="(max-width: 1023px) calc(100vw - 40px), (max-width: 1439px) 48vw, 650px"
              className="relative z-10 aspect-[5/4] w-full rounded-[2rem] object-cover shadow-soft sm:rounded-[2.5rem]"
            />
          </div>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="saffron-feature relative overflow-hidden rounded-[2rem] border border-[#e4bd74]/40 px-5 py-10 shadow-card sm:px-10 sm:py-12 lg:px-14">
          <div className="relative z-10 grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
            <div>
              <p className="eyebrow text-[#8c5b16]">{t("ingredients.featureEyebrow")}</p>
              <h2 className="mt-4 max-w-xl text-balance text-3xl leading-tight sm:text-5xl">
                {t("ingredients.featureTitle")}
              </h2>
              <p className="mt-5 max-w-2xl text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">
                {t("ingredients.featureCopy")}
              </p>
            </div>
            <ul className="grid gap-3" aria-label={t("ingredients.featureBenefitsLabel")}>
              {list("ingredients.featureBenefits").map((benefit) => (
                <li key={benefit} className="flex min-h-14 items-start gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 text-sm leading-6 shadow-[0_8px_24px_rgba(138,91,22,0.06)]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f1d494] text-[#85520e]" aria-hidden="true">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white/55 py-16 sm:py-24">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">{t("ingredients.keyEyebrow")}</p>
            <h2 className="mt-4 text-balance text-3xl leading-tight sm:text-5xl">{t("ingredients.keyTitle")}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base">
              {t("ingredients.keyCopy")}
            </p>
          </div>

          <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2 lg:mt-12 lg:gap-6">
            {ingredients.map(({ icon: Icon, name, category, alternateName, description, benefits, featured }) => (
              <article key={name} className={`ingredient-card flex h-full flex-col p-6 sm:p-8 ${featured ? "ingredient-card-featured" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${featured ? "bg-[#f4dca6] text-[#875715]" : "bg-yara-rose text-yara-wine"}`} aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  {featured ? <span className="rounded-full border border-[#d9ad5a]/40 bg-[#fff9ec] px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#8c5b16]">{t("ingredients.signatureLabel")}</span> : null}
                </div>
                <p className={`mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${featured ? "text-[#8c5b16]" : "text-yara-wine"}`}>{category}</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-3xl sm:text-[2rem]">{name}</h3>
                  {alternateName ? <span className="rounded-full bg-yara-blush px-3 py-1 text-xs font-semibold text-yara-wine">{alternateName}</span> : null}
                </div>
                <p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{description}</p>
                <ul className="mt-6 grid gap-3 border-t border-yara-rose/80 pt-5" aria-label={`${name} ${t("ingredients.benefitsLabel")}`}>
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm leading-6">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-[#a66a14]" : "text-yara-wine"}`} aria-hidden="true" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-yara-blush py-16 sm:py-24">
        <div className="page-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow">{t("ingredients.whyEyebrow")}</p>
            <h2 className="mt-4 max-w-xl text-balance text-3xl leading-tight sm:text-5xl">{t("ingredients.whyTitle")}</h2>
            <p className="mt-5 max-w-2xl text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">{t("ingredients.whyCopy")}</p>
          </div>
          <ul className="grid gap-4" aria-label={t("ingredients.whyPointsLabel")}>
            {list("ingredients.reasons").map((item) => (
              <li key={item} className="flex min-h-16 items-start gap-4 rounded-2xl border border-white/80 bg-white p-5 shadow-card">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-yara-wine" aria-hidden="true" />
                <span className="text-sm leading-6">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
