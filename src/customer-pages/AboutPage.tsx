import { ArrowRight, Award, BookOpen, Check, FlaskConical, Leaf, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Link } from "react-router-dom";
import { founderStory, type FounderAward, type SupportingEducationItem } from "../data/founder-story";

const reveal = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      variants={reveal}
      transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function CountryLabel({ children, inverse = false }: { children: React.ReactNode; inverse?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] ${inverse ? "text-[#f0cf82]" : "text-yara-wine"}`}>
      <span aria-hidden="true" className={`h-px w-7 ${inverse ? "bg-[#f0cf82]/70" : "bg-yara-gold"}`} />
      {children}
    </span>
  );
}

function FocusList({ items, inverse = false }: { items: readonly string[]; inverse?: boolean }) {
  return (
    <ul className="grid gap-x-7 gap-y-0 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className={`flex min-w-0 gap-3 border-t py-3.5 text-sm leading-6 ${inverse ? "border-white/15 text-white/80" : "border-yara-wine/10 text-yara-taupe"}`}>
          <span aria-hidden="true" className={`mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full ${inverse ? "bg-[#f0cf82]" : "bg-yara-gold"}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SupportingEducationRow({ item }: { item: SupportingEducationItem }) {
  return (
    <article className="grid gap-3 border-t border-yara-wine/10 py-5 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-5">
      <span aria-hidden="true" className="font-serif text-2xl text-yara-gold/80">{item.number}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h4 className="text-xl leading-tight text-yara-ink">{item.name}</h4>
          {item.country && <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-yara-wine">{item.country}</span>}
        </div>
        <p className="mt-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-yara-taupe">{item.focus}</p>
        <p className="mt-2.5 text-sm font-light leading-6 text-yara-taupe">{item.description}</p>
      </div>
    </article>
  );
}

function AwardCard({ award }: { award: FounderAward }) {
  const details = [award.year, award.country, award.organisation].filter(Boolean);
  return (
    <article className="flex h-full min-h-24 items-start gap-3 rounded-2xl border border-yara-gold/20 bg-white/75 p-4 shadow-[0_10px_28px_rgba(91,34,53,.06)] sm:p-5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-yara-blush text-yara-wine"><Award aria-hidden="true" className="h-4 w-4" /></span>
      <div className="min-w-0">
        <h3 className="font-sans text-sm font-semibold leading-5 text-yara-ink sm:text-[0.95rem]">{award.title}</h3>
        {details.length > 0 && <p className="mt-2 text-xs leading-5 text-yara-taupe">{details.join(" · ")}</p>}
        {award.certificateImage && <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl"><Image src={award.certificateImage.src} alt={award.certificateImage.alt} fill sizes="(max-width: 639px) 100vw, 25vw" className="object-cover" /></div>}
      </div>
    </article>
  );
}

export function AboutPage() {
  return (
    <div className="overflow-hidden bg-[#fffdfa] text-yara-ink">
      <section aria-labelledby="founder-hero-title" className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(250,215,222,.82),transparent_34%),radial-gradient(circle_at_90%_86%,rgba(239,210,144,.28),transparent_30%),linear-gradient(140deg,#fffdf8_0%,#fff8f4_57%,#fbeef0_100%)]">
        <div aria-hidden="true" className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-yara-gold/20 bg-white/20 blur-sm" />
        <div className="page-shell grid items-center gap-8 py-10 sm:gap-10 sm:py-14 lg:grid-cols-[.96fr_1.04fr] lg:gap-16 lg:py-20">
          <Reveal className="relative z-10 max-w-2xl">
            <p className="eyebrow flex items-center gap-3"><span className="h-px w-8 bg-yara-gold" />{founderStory.hero.label}</p>
            <h1 id="founder-hero-title" className="mt-5 text-balance text-[2.3rem] font-medium leading-[1.04] min-[375px]:text-[2.5rem] sm:mt-6 sm:text-6xl lg:text-[4.15rem]"><span className="block min-[430px]:inline">{founderStory.hero.titlePrefix} </span><span>{founderStory.hero.titleLead}</span>{" "}<em className="block text-yara-wine">{founderStory.hero.titleAccent}</em></h1>
            <p className="mt-5 max-w-xl text-base font-light leading-7 text-yara-taupe sm:mt-6 sm:text-lg sm:leading-8">{founderStory.hero.description}</p>
          </Reveal>
          <Reveal className="relative mx-auto w-full max-w-[590px]" delay={0.1}>
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-white/80 bg-yara-blush shadow-[0_26px_70px_rgba(91,34,53,.18)] sm:aspect-[6/5] sm:rounded-[2.5rem] lg:aspect-[5/5.25]"><Image src={founderStory.hero.image.src} alt={founderStory.hero.image.alt} fill priority sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover object-[center_28%]" /><div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-yara-wine/18 to-transparent" /></div>
            <div className="glass-panel absolute bottom-4 left-4 rounded-2xl px-4 py-3 shadow-card sm:bottom-6 sm:left-6 sm:px-5"><span className="block text-[0.62rem] font-semibold uppercase tracking-[.18em] text-yara-gold">{founderStory.hero.role}</span><span className="mt-1 block font-serif text-xl text-yara-wine">{founderStory.hero.name}</span></div>
          </Reveal>
          <Reveal className="lg:col-span-2" delay={0.16}>
            <dl className="grid overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/70 shadow-[0_16px_40px_rgba(91,34,53,.09)] backdrop-blur sm:grid-cols-3">
              {founderStory.stats.map((stat, index) => <div key={stat.label} className={`flex items-center justify-between gap-4 px-5 py-4 sm:block sm:px-6 sm:py-5 sm:text-center ${index > 0 ? "border-t border-yara-rose/20 sm:border-l sm:border-t-0" : ""}`}><dt className="order-2 text-[0.68rem] font-semibold uppercase tracking-[.15em] text-yara-taupe sm:mt-2">{stat.label}</dt><dd className="order-1 font-serif text-2xl text-yara-wine sm:text-3xl">{stat.value}</dd></div>)}
            </dl>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="journey-title" className="page-shell py-16 sm:py-20 lg:py-24">
        <Reveal className="max-w-2xl"><p className="eyebrow">{founderStory.journey.label}</p><h2 id="journey-title" className="mt-4 text-balance text-4xl leading-tight sm:text-5xl">{founderStory.journey.title}</h2></Reveal>
        <div className="mt-9 grid gap-4 sm:mt-11 sm:grid-cols-2 lg:gap-5">{founderStory.milestones.map((milestone, index) => <Reveal key={milestone.number} className="h-full" delay={index * 0.06}><article className="group relative h-full overflow-hidden rounded-[1.8rem] border border-yara-rose/20 bg-[linear-gradient(145deg,rgba(255,255,255,.98),rgba(255,247,246,.82))] p-6 shadow-[0_14px_34px_rgba(91,34,53,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(91,34,53,.12)] sm:p-7"><div aria-hidden="true" className="absolute -right-7 -top-10 font-serif text-[8rem] leading-none text-yara-rose/[.09]">{milestone.number}</div><div className="relative"><span className="font-serif text-5xl leading-none text-yara-gold sm:text-6xl">{milestone.number}</span><p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[.18em] text-yara-wine">{milestone.label}</p><p className="mt-3 max-w-xl text-base font-light leading-7 text-yara-taupe">{milestone.description}</p></div></article></Reveal>)}</div>
      </section>

      <section aria-labelledby="education-title" className="relative isolate overflow-hidden bg-[#fbf2f0]">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yara-gold/45 to-transparent" />
        <div className="page-shell grid gap-9 py-14 sm:gap-12 sm:py-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,.92fr)] lg:items-end lg:gap-16 lg:py-24">
          <Reveal className="min-w-0 max-w-4xl">
            <p className="eyebrow">{founderStory.education.label}</p>
            <h2 id="education-title" className="mt-4 max-w-4xl text-balance text-[2.15rem] leading-[1.08] sm:text-5xl lg:text-[3.4rem]">{founderStory.education.title}</h2>
            <p className="mt-6 max-w-[72ch] text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-lg sm:leading-8">{founderStory.education.introduction}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <aside aria-label="Fields of professional learning" className="border-y border-yara-wine/15">
              <ol>
                {founderStory.education.disciplines.map((discipline) => (
                  <li key={discipline.number} className="grid grid-cols-[2.6rem_minmax(0,1fr)] gap-3 border-b border-yara-wine/10 py-5 last:border-b-0 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-5">
                    <span aria-hidden="true" className="font-serif text-2xl text-[#8c5b16]">{discipline.number}</span>
                    <div className="min-w-0">
                      <h3 className="text-xl leading-tight text-yara-ink">{discipline.title}</h3>
                      <p className="mt-2 text-sm font-light leading-6 text-yara-taupe">{discipline.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </Reveal>
        </div>

        <div className="border-t border-yara-wine/10 bg-[#fffdfa]">
          <div className="page-shell py-14 sm:py-20 lg:py-24">
            <Reveal className="grid gap-5 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:items-end lg:gap-12">
              <div className="min-w-0">
                <p className="eyebrow">{founderStory.education.portfolio.label}</p>
                <h3 className="mt-4 text-balance text-3xl leading-tight sm:text-4xl">{founderStory.education.portfolio.title}</h3>
              </div>
              <p className="max-w-[72ch] text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">{founderStory.education.portfolio.description}</p>
            </Reveal>

            <Reveal className="mt-9 sm:mt-12" delay={0.05}>
              <article className="relative isolate overflow-hidden rounded-[1.75rem] border border-yara-gold/25 bg-[radial-gradient(circle_at_86%_15%,rgba(240,207,130,.18),transparent_25%),linear-gradient(135deg,#352029,#5b2a3a_56%,#2b1b22)] text-white shadow-[0_24px_55px_rgba(54,28,38,.18)] sm:rounded-[2.25rem]">
                <div aria-hidden="true" className="absolute -end-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
                <div className="relative grid min-w-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)]">
                  <div className="min-w-0 p-6 min-[375px]:p-7 sm:p-9 lg:p-12">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <CountryLabel inverse>{founderStory.education.university.country}</CountryLabel>
                      <span aria-label={`Study status: ${founderStory.education.university.status}`} className="inline-flex min-h-8 items-center rounded-full border border-[#f0cf82]/35 bg-[#f0cf82]/10 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-[#f4d995]">{founderStory.education.university.status}</span>
                    </div>
                    <div className="mt-9 flex items-center gap-3 text-[#f0cf82]">
                      <FlaskConical aria-hidden="true" className="h-5 w-5" />
                      <span className="text-[0.63rem] font-semibold uppercase tracking-[0.16em]">{founderStory.education.university.faculty}</span>
                    </div>
                    <h4 className="mt-4 max-w-3xl break-words text-balance text-3xl leading-[1.08] text-white sm:text-4xl lg:text-5xl">{founderStory.education.university.institution}</h4>
                    <p className="mt-4 max-w-3xl text-pretty font-serif text-lg italic leading-7 text-[#f4d995] sm:text-xl sm:leading-8">{founderStory.education.university.subtitle}</p>
                    <div className="mt-7 max-w-3xl space-y-4 text-[0.95rem] font-light leading-7 text-white/75 sm:text-base sm:leading-8">
                      {founderStory.education.university.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </div>
                  <aside className="min-w-0 border-t border-white/15 bg-white/[0.045] p-6 min-[375px]:p-7 sm:p-9 lg:border-s lg:border-t-0 lg:p-12" aria-label="Advanced cosmetic technology study areas">
                    <span aria-hidden="true" className="font-serif text-6xl leading-none text-[#f0cf82]/45">{founderStory.education.university.number}</span>
                    <p className="mt-8 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#f0cf82]">Areas of continuing study</p>
                    <div className="mt-4"><FocusList items={founderStory.education.university.focusAreas} inverse /></div>
                  </aside>
                </div>
              </article>
            </Reveal>

            <div className="mt-6 grid gap-6 lg:mt-8">
              <Reveal delay={0.04}>
                <article className="grid min-w-0 overflow-hidden rounded-[1.75rem] border border-[#dfbd78]/35 bg-[#fff9ed] shadow-[0_18px_44px_rgba(91,56,24,.08)] sm:rounded-[2rem] lg:grid-cols-[minmax(16rem,.68fr)_minmax(0,1.32fr)]">
                  <div className="relative min-w-0 overflow-hidden border-b border-[#dfbd78]/30 bg-[#f5e5ca] p-6 min-[375px]:p-7 sm:p-9 lg:border-b-0 lg:border-e lg:p-10">
                    <div aria-hidden="true" className="absolute -end-10 -top-10 font-serif text-[10rem] leading-none text-white/45">{founderStory.education.rajasthan.number}</div>
                    <div className="relative">
                      <CountryLabel>{founderStory.education.rajasthan.country}</CountryLabel>
                      <span className="mt-10 grid h-11 w-11 place-items-center rounded-full border border-[#8c5b16]/20 bg-white/55 text-[#8c5b16]"><Leaf aria-hidden="true" className="h-5 w-5" /></span>
                      <p className="mt-7 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#8c5b16]">Specialised focus</p>
                      <p className="mt-2 font-serif text-2xl leading-tight text-yara-ink">{founderStory.education.rajasthan.focus}</p>
                      <p className="mt-5 border-t border-[#8c5b16]/15 pt-4 text-xs font-medium uppercase tracking-[0.13em] text-[#5e4f4a]">{founderStory.education.rajasthan.institution}</p>
                    </div>
                  </div>
                  <div className="min-w-0 p-6 min-[375px]:p-7 sm:p-9 lg:p-12">
                    <h4 className="max-w-4xl text-balance text-3xl leading-tight sm:text-4xl">{founderStory.education.rajasthan.title}</h4>
                    <div className="mt-6 max-w-[76ch] space-y-4 text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">
                      {founderStory.education.rajasthan.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    <p className="mt-7 flex max-w-[76ch] gap-3 border-t border-[#8c5b16]/15 pt-5 text-sm italic leading-6 text-[#6f4f30] sm:text-[0.95rem]">
                      <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#8c5b16]" />
                      <span>{founderStory.education.rajasthan.confidentialNote}</span>
                    </p>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.04}>
                <article className="grid min-w-0 overflow-hidden rounded-[1.75rem] border border-yara-wine/10 bg-white shadow-[0_18px_44px_rgba(91,34,53,.07)] sm:rounded-[2rem] lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
                  <div className="min-w-0 p-6 min-[375px]:p-7 sm:p-9 lg:p-12">
                    <CountryLabel>{founderStory.education.kerala.country}</CountryLabel>
                    <p className="mt-8 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-yara-wine">{founderStory.education.kerala.focus}</p>
                    <h4 className="mt-3 max-w-4xl text-balance text-3xl leading-tight sm:text-4xl">{founderStory.education.kerala.title}</h4>
                    <div className="mt-6 max-w-[76ch] space-y-4 text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">
                      {founderStory.education.kerala.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </div>
                  <aside className="min-w-0 border-t border-yara-wine/10 bg-[#f8efeb] p-6 min-[375px]:p-7 sm:p-9 lg:border-s lg:border-t-0 lg:p-10" aria-label="Ayurvedic preparation and manufacturing methods">
                    <div className="flex items-end justify-between gap-4">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-yara-wine/15 bg-white/65 text-yara-wine"><Leaf aria-hidden="true" className="h-5 w-5" /></span>
                      <span aria-hidden="true" className="font-serif text-6xl leading-none text-yara-wine/20">{founderStory.education.kerala.number}</span>
                    </div>
                    <p className="mt-8 text-[0.64rem] font-semibold uppercase tracking-[0.19em] text-yara-wine">Practical study areas</p>
                    <div className="mt-4"><FocusList items={founderStory.education.kerala.methods} /></div>
                  </aside>
                </article>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="professional-learning-title" className="bg-[#fbf2f0] py-14 sm:py-20 lg:py-24">
        <div className="page-shell">
          <Reveal className="max-w-4xl">
            <p className="eyebrow">{founderStory.education.professionalLearning.label}</p>
            <h2 id="professional-learning-title" className="mt-4 text-balance text-3xl leading-tight sm:text-4xl lg:text-5xl">{founderStory.education.professionalLearning.title}</h2>
            <p className="mt-5 max-w-[72ch] text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">{founderStory.education.professionalLearning.description}</p>
          </Reveal>

          <div className="mt-9 grid min-w-0 gap-6 sm:mt-12 lg:grid-cols-[minmax(0,.92fr)_minmax(22rem,1.08fr)] lg:gap-8">
            <Reveal className="min-w-0 self-start" delay={0.04}>
              <article className="relative isolate min-w-0 overflow-hidden rounded-[1.75rem] border border-yara-gold/25 bg-[radial-gradient(circle_at_90%_10%,rgba(200,155,60,.2),transparent_28%),linear-gradient(145deg,#fffdf8,#fff4f1)] p-6 shadow-[0_18px_42px_rgba(91,34,53,.07)] min-[375px]:p-7 sm:rounded-[2rem] sm:p-9 lg:p-11">
                <div aria-hidden="true" className="absolute -end-12 top-16 select-none font-serif text-[5rem] leading-none text-yara-wine/[0.035] sm:text-[7rem]">{founderStory.education.professionalLearning.miyc.focus.toUpperCase()}</div>
                <div className="relative max-w-3xl">
                  <CountryLabel>{founderStory.education.professionalLearning.miyc.country}</CountryLabel>
                  <span className="mt-9 grid h-11 w-11 place-items-center rounded-full border border-yara-wine/15 bg-white/70 text-yara-wine"><FlaskConical aria-hidden="true" className="h-5 w-5" /></span>
                  <p className="mt-7 text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-yara-wine">{founderStory.education.professionalLearning.miyc.focus}</p>
                  <h3 className="mt-3 text-balance text-3xl leading-tight sm:text-4xl">{founderStory.education.professionalLearning.miyc.name}</h3>
                  <p className="mt-5 text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">{founderStory.education.professionalLearning.miyc.description}</p>
                </div>
              </article>
            </Reveal>

            <Reveal className="min-w-0" delay={0.08}>
              <div className="h-full rounded-[1.75rem] border border-white/80 bg-white/70 px-6 py-2 shadow-[0_16px_38px_rgba(91,34,53,.06)] min-[375px]:px-7 sm:rounded-[2rem] sm:px-9 sm:py-3">
                <div className="py-5">
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.19em] text-yara-wine">Supporting education register</p>
                  <h3 className="mt-2 text-2xl leading-tight">Other established learning entries</h3>
                </div>
                <div className="grid xl:grid-cols-2 xl:gap-x-8">
                  {founderStory.education.professionalLearning.institutions.map((item) => <SupportingEducationRow key={item.name} item={item} />)}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-8 sm:mt-10" delay={0.04}>
            <section aria-labelledby="master-class-title" className="border-y border-yara-gold/30 py-8 sm:py-10 lg:py-12">
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,.88fr)_minmax(0,1.12fr)] lg:items-start lg:gap-12">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 text-yara-wine"><BookOpen aria-hidden="true" className="h-5 w-5" /><span className="text-[0.63rem] font-semibold uppercase tracking-[0.17em]">Specialised programmes</span></div>
                  <h3 id="master-class-title" className="mt-4 max-w-3xl text-balance text-3xl leading-tight sm:text-4xl">{founderStory.education.professionalLearning.masterDiplomas.title}</h3>
                </div>
                <div className="min-w-0">
                  <p className="max-w-[72ch] text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">{founderStory.education.professionalLearning.masterDiplomas.description}</p>
                  <FocusList items={founderStory.education.professionalLearning.masterDiplomas.areas} />
                </div>
              </div>
            </section>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="knowledge-formulation-title" className="relative isolate overflow-hidden bg-[#342028] py-14 text-white sm:py-20 lg:py-24">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_86%_12%,rgba(240,207,130,.16),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(179,18,75,.18),transparent_30%)]" />
        <div className="page-shell relative">
          <Reveal>
            <div className="grid min-w-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] shadow-[0_26px_70px_rgba(20,10,14,.2)] sm:rounded-[2.25rem] lg:grid-cols-[minmax(19rem,.78fr)_minmax(0,1.22fr)]">
              <div className="relative min-h-[19rem] overflow-hidden sm:min-h-[25rem] lg:min-h-[38rem]">
                <Image src={founderStory.education.synthesis.image.src} alt={founderStory.education.synthesis.image.alt} fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#342028]/45 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#342028]/35" />
              </div>
              <div className="min-w-0 p-6 min-[375px]:p-7 sm:p-10 lg:p-12 xl:p-14">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#f0cf82]">{founderStory.education.synthesis.label}</p>
                <h2 id="knowledge-formulation-title" className="mt-4 max-w-4xl text-balance text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">{founderStory.education.synthesis.title}</h2>
                <div className="mt-7 max-w-[76ch] space-y-4 text-[0.95rem] font-light leading-7 text-white/75 sm:text-base sm:leading-8">
                  {founderStory.education.synthesis.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </div>
            </div>

            <ol aria-label="From international education to YARA product development" className="mt-6 grid overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] sm:grid-cols-2 lg:grid-cols-4">
              {founderStory.education.synthesis.progression.map((step, index) => (
                <li key={step} className={`min-w-0 p-5 sm:p-6 ${index > 0 ? "border-t border-white/10 lg:border-s lg:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-s" : ""} ${index === 1 ? "sm:border-t-0" : ""}`}>
                  <span aria-hidden="true" className="font-serif text-2xl text-[#f0cf82]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="mt-3 text-sm font-medium leading-6 text-white/80">{step}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="brands-title" className="page-shell py-16 sm:py-20 lg:py-24"><Reveal className="max-w-2xl"><p className="eyebrow">Brand growth &amp; international reach</p><h2 id="brands-title" className="mt-4 text-4xl leading-tight sm:text-5xl">{founderStory.brands.title}</h2><p className="mt-4 text-base font-light leading-7 text-yara-taupe sm:text-lg">{founderStory.brands.description}</p></Reveal><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{founderStory.brands.items.map((brand, index) => <Reveal key={brand.name} className="h-full" delay={index * 0.05}><article className="glass-panel flex h-full min-h-40 flex-col rounded-[1.6rem] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(91,34,53,.12)] sm:p-6"><span className="grid h-11 w-11 place-items-center rounded-full border border-yara-gold/25 bg-white/75 font-serif text-sm text-yara-wine">{brand.initials}</span><h3 className="mt-6 text-xl leading-tight">{brand.name}</h3><p className="mt-2 text-xs font-semibold uppercase tracking-[.12em] text-yara-taupe">{brand.category}</p></article></Reveal>)}</div></section>

      <section aria-labelledby="manufacturing-title" className="page-shell pb-16 sm:pb-20 lg:pb-24"><Reveal><div className="relative isolate overflow-hidden rounded-[2rem] border border-yara-gold/20 bg-[radial-gradient(circle_at_82%_18%,rgba(238,200,109,.26),transparent_28%),linear-gradient(135deg,#3b202b,#6c3645_55%,#2d1c24)] px-6 py-10 text-white shadow-[0_24px_55px_rgba(54,28,38,.18)] sm:px-10 sm:py-12 lg:px-14"><div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/15" /><div aria-hidden="true" className="absolute bottom-[-5rem] right-24 h-48 w-48 rounded-full border border-yara-gold/20" /><div className="relative max-w-3xl"><span className="inline-flex rounded-full border border-[#f2d58c]/40 bg-[#f2d58c]/10 px-3 py-2 text-[0.63rem] font-semibold uppercase tracking-[.18em] text-[#f2d58c]">{founderStory.manufacturing.status}</span><p className="mt-7 text-[0.68rem] font-semibold uppercase tracking-[.22em] text-[#f2d58c]">{founderStory.manufacturing.label}</p><h2 id="manufacturing-title" className="mt-4 text-3xl leading-tight text-white sm:text-4xl">{founderStory.manufacturing.title}</h2><p className="mt-4 text-base font-light leading-7 text-white/80 sm:text-lg sm:leading-8">{founderStory.manufacturing.description}</p><p className="mt-5 border-t border-white/15 pt-5 text-sm font-light leading-6 text-white/65 sm:text-base">{founderStory.manufacturing.note}</p></div></div></Reveal></section>

      <section aria-labelledby="awards-title" className="bg-[#fbf2f0] py-16 sm:py-20"><div className="page-shell"><Reveal className="mx-auto max-w-3xl text-center"><p className="eyebrow">{founderStory.awards.label}</p><h2 id="awards-title" className="mt-4 text-4xl leading-tight sm:text-5xl">{founderStory.awards.title}</h2><p className="mx-auto mt-4 max-w-2xl text-base font-light leading-7 text-yara-taupe sm:text-lg">{founderStory.awards.description}</p></Reveal><div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{founderStory.awards.items.map((award, index) => <Reveal key={award.title} className="h-full" delay={Math.min(index * 0.035, 0.2)}><AwardCard award={award} /></Reveal>)}</div></div></section>

      <section aria-labelledby="closing-title" className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_50%,rgba(233,140,169,.2),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(238,200,109,.23),transparent_25%),linear-gradient(135deg,#fff8f6,#fffdf8)] py-16 sm:py-20 lg:py-24"><Reveal className="page-shell mx-auto max-w-5xl text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-yara-gold/30 bg-white/75 text-yara-wine shadow-sm"><Check aria-hidden="true" className="h-5 w-5" /></span><h2 id="closing-title" className="mt-6 text-balance text-3xl leading-tight sm:text-4xl lg:text-5xl">{founderStory.closing.statement}</h2><p className="mx-auto mt-5 max-w-3xl text-base font-light leading-7 text-yara-taupe sm:text-lg sm:leading-8">{founderStory.closing.description}</p><Link to={founderStory.closing.href} className="btn-primary mt-8 w-full sm:w-auto">{founderStory.closing.cta}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Reveal></section>
    </div>
  );
}
