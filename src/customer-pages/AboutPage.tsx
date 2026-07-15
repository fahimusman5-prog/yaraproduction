import { ArrowRight, Award, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Link } from "react-router-dom";
import { founderStory, type FounderAward } from "../data/founder-story";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      variants={reveal}
      transition={{
        duration: reducedMotion ? 0 : 0.55,
        delay: reducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

function AwardCard({ award }: { award: FounderAward }) {
  const details = [award.year, award.country, award.organisation].filter(Boolean);

  return (
    <article className="flex h-full min-h-24 items-start gap-3 rounded-2xl border border-yara-gold/20 bg-white/75 p-4 shadow-[0_10px_28px_rgba(91,34,53,.06)] sm:p-5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-yara-blush text-yara-wine">
        <Award aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h3 className="font-sans text-sm font-semibold leading-5 text-yara-ink sm:text-[0.95rem]">
          {award.title}
        </h3>
        {details.length > 0 && (
          <p className="mt-2 text-xs leading-5 text-yara-taupe">{details.join(" · ")}</p>
        )}
        {award.certificateImage && (
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={award.certificateImage.src}
              alt={award.certificateImage.alt}
              fill
              sizes="(max-width: 639px) 100vw, 25vw"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </article>
  );
}

export function AboutPage() {
  return (
    <div className="overflow-hidden bg-[#fffdfa] text-yara-ink">
      <section
        aria-labelledby="founder-hero-title"
        className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(250,215,222,.82),transparent_34%),radial-gradient(circle_at_90%_86%,rgba(239,210,144,.28),transparent_30%),linear-gradient(140deg,#fffdf8_0%,#fff8f4_57%,#fbeef0_100%)]"
      >
        <div
          aria-hidden="true"
          className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-yara-gold/20 bg-white/20 blur-sm"
        />
        <div className="page-shell grid items-center gap-8 py-10 sm:gap-10 sm:py-14 lg:grid-cols-[.96fr_1.04fr] lg:gap-16 lg:py-20">
          <Reveal className="relative z-10 max-w-2xl">
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-8 bg-yara-gold" />
              {founderStory.hero.label}
            </p>
            <h1
              id="founder-hero-title"
              className="mt-5 text-balance text-[2.3rem] font-medium leading-[1.04] min-[375px]:text-[2.5rem] sm:mt-6 sm:text-6xl lg:text-[4.15rem]"
            >
              <span className="block min-[430px]:inline">{founderStory.hero.titlePrefix} </span>
              <span>{founderStory.hero.titleLead}</span>{" "}
              <em className="block text-yara-wine">{founderStory.hero.titleAccent}</em>
            </h1>
            <p className="mt-5 max-w-xl text-base font-light leading-7 text-yara-taupe sm:mt-6 sm:text-lg sm:leading-8">
              {founderStory.hero.description}
            </p>
          </Reveal>

          <Reveal className="relative mx-auto w-full max-w-[590px]" delay={0.1}>
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-white/80 bg-yara-blush shadow-[0_26px_70px_rgba(91,34,53,.18)] sm:aspect-[6/5] sm:rounded-[2.5rem] lg:aspect-[5/5.25]">
              <Image
                src={founderStory.hero.image.src}
                alt={founderStory.hero.image.alt}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover object-[center_28%]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-yara-wine/18 to-transparent"
              />
            </div>
            <div className="glass-panel absolute bottom-4 left-4 rounded-2xl px-4 py-3 shadow-card sm:bottom-6 sm:left-6 sm:px-5">
              <span className="block text-[0.62rem] font-semibold uppercase tracking-[.18em] text-yara-gold">
                {founderStory.hero.role}
              </span>
              <span className="mt-1 block font-serif text-xl text-yara-wine">
                {founderStory.hero.name}
              </span>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.16}>
            <dl className="grid overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/70 shadow-[0_16px_40px_rgba(91,34,53,.09)] backdrop-blur sm:grid-cols-3">
              {founderStory.stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`flex items-center justify-between gap-4 px-5 py-4 sm:block sm:px-6 sm:py-5 sm:text-center ${
                    index > 0 ? "border-t border-yara-rose/20 sm:border-l sm:border-t-0" : ""
                  }`}
                >
                  <dt className="order-2 text-[0.68rem] font-semibold uppercase tracking-[.15em] text-yara-taupe sm:mt-2">
                    {stat.label}
                  </dt>
                  <dd className="order-1 font-serif text-2xl text-yara-wine sm:text-3xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="journey-title" className="page-shell py-16 sm:py-20 lg:py-24">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{founderStory.journey.label}</p>
          <h2 id="journey-title" className="mt-4 text-balance text-4xl leading-tight sm:text-5xl">
            {founderStory.journey.title}
          </h2>
        </Reveal>
        <div className="mt-9 grid gap-4 sm:mt-11 sm:grid-cols-2 lg:gap-5">
          {founderStory.milestones.map((milestone, index) => (
            <Reveal key={milestone.number} className="h-full" delay={index * 0.06}>
              <article className="group relative h-full overflow-hidden rounded-[1.8rem] border border-yara-rose/20 bg-[linear-gradient(145deg,rgba(255,255,255,.98),rgba(255,247,246,.82))] p-6 shadow-[0_14px_34px_rgba(91,34,53,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(91,34,53,.12)] sm:p-7">
                <div
                  aria-hidden="true"
                  className="absolute -right-7 -top-10 font-serif text-[8rem] leading-none text-yara-rose/[.09]"
                >
                  {milestone.number}
                </div>
                <div className="relative">
                  <span className="font-serif text-5xl leading-none text-yara-gold sm:text-6xl">
                    {milestone.number}
                  </span>
                  <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[.18em] text-yara-wine">
                    {milestone.label}
                  </p>
                  <p className="mt-3 max-w-xl text-base font-light leading-7 text-yara-taupe">
                    {milestone.description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="brands-title" className="bg-[#fbf2f0] py-16 sm:py-20">
        <div className="page-shell">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{founderStory.brands.label}</p>
            <h2 id="brands-title" className="mt-4 text-4xl leading-tight sm:text-5xl">
              {founderStory.brands.title}
            </h2>
            <p className="mt-4 text-base font-light leading-7 text-yara-taupe sm:text-lg">
              {founderStory.brands.description}
            </p>
          </Reveal>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {founderStory.brands.items.map((brand, index) => (
              <Reveal key={brand.name} className="h-full" delay={index * 0.05}>
                <article className="glass-panel flex h-full min-h-40 flex-col rounded-[1.6rem] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(91,34,53,.12)] sm:p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-yara-gold/25 bg-white/75 font-serif text-sm text-yara-wine">
                    {brand.initials}
                  </span>
                  <h3 className="mt-6 text-xl leading-tight">{brand.name}</h3>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[.12em] text-yara-taupe">
                    {brand.category}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="awards-title" className="page-shell py-16 sm:py-20 lg:py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{founderStory.awards.label}</p>
          <h2 id="awards-title" className="mt-4 text-4xl leading-tight sm:text-5xl">
            {founderStory.awards.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-light leading-7 text-yara-taupe sm:text-lg">
            {founderStory.awards.description}
          </p>
        </Reveal>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {founderStory.awards.items.map((award, index) => (
            <Reveal key={award.title} className="h-full" delay={Math.min(index * 0.035, 0.2)}>
              <AwardCard award={award} />
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="academy-title" className="page-shell pb-16 sm:pb-20 lg:pb-24">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#28181e] px-6 py-9 text-white shadow-[0_24px_55px_rgba(54,28,38,.2)] sm:px-9 sm:py-11 lg:px-12">
            <Image
              src={founderStory.turningPoint.image.src}
              alt={founderStory.turningPoint.image.alt}
              fill
              sizes="100vw"
              className="-z-20 object-cover object-center opacity-30"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(40,24,30,.98)_0%,rgba(40,24,30,.9)_55%,rgba(40,24,30,.55)_100%)]"
            />
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[.22em] text-[#f2d58c]">
                {founderStory.turningPoint.label}
              </p>
              <h2 id="academy-title" className="mt-4 text-3xl leading-tight text-white sm:text-4xl">
                {founderStory.turningPoint.title}
              </h2>
              <p className="mt-4 text-base font-light leading-7 text-white/75 sm:text-lg sm:leading-8">
                {founderStory.turningPoint.description}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section
        aria-labelledby="closing-title"
        className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_50%,rgba(233,140,169,.2),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(238,200,109,.23),transparent_25%),linear-gradient(135deg,#fff8f6,#fffdf8)] py-16 sm:py-20 lg:py-24"
      >
        <Reveal className="page-shell mx-auto max-w-5xl text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-yara-gold/30 bg-white/75 text-yara-wine shadow-sm">
            <Check aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 id="closing-title" className="mt-6 text-balance text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {founderStory.closing.statement}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base font-light leading-7 text-yara-taupe sm:text-lg sm:leading-8">
            {founderStory.closing.description}
          </p>
          <Link to={founderStory.closing.href} className="btn-primary mt-8 w-full sm:w-auto">
            {founderStory.closing.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
