import { ArrowRight, ArrowUpRight, Building2, Globe2, Leaf, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

const founderImage = "/images/about/yara-about-portrait.png";
const academyImage = "/images/home/science-backed-botanical-skincare.png";

const ventures = [
  ["YARA Production", "Premium Ayurvedic Skincare", Leaf],
  ["YARA Arabian", "Luxury Clothing", Sparkles],
  ["YARA International Trading", "Sri Lanka", Building2],
  ["YARA Global Trading", "Dubai", Globe2],
];

const milestones = [
  "Handcrafted Herbal Soap",
  "Ayurveda Training|Rajasthan, India",
  "First Customer Success Stories",
  "Product Expansion",
  "International Trading",
  "Premium Iranian Saffron Distribution",
  "Professional Manufacturing",
  "GMP & ISO Certifications",
  "3000+ Monthly Orders",
  "Global Expansion",
];

const countries = [
  ["Sri Lanka", "74%", "68%"], ["United Arab Emirates", "58%", "47%"], ["Qatar", "61%", "45%"],
  ["United Kingdom", "45%", "32%"], ["France", "48%", "36%"], ["Japan", "84%", "43%"], ["Canada", "25%", "30%"],
];

const reveal = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reducedMotion = useReducedMotion();
  return <motion.div className={className} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} variants={reveal} transition={{ duration: reducedMotion ? 0 : 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export function AboutPage() {
  const reducedMotion = useReducedMotion();
  return (
    <main className="overflow-hidden bg-[#fffdfa] text-yara-ink">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_18%_22%,rgba(250,215,222,.75),transparent_28%),radial-gradient(circle_at_88%_74%,rgba(239,210,144,.3),transparent_27%),linear-gradient(135deg,#fffdf8_0%,#fff8f4_55%,#fbeef0_100%)]">
        <div className="page-shell grid min-h-[680px] items-center gap-12 py-16 sm:py-20 lg:min-h-[760px] lg:grid-cols-[.95fr_1.05fr] lg:py-24">
          <Reveal className="relative z-10 max-w-2xl">
            <p className="eyebrow flex items-center gap-3"><span className="h-px w-9 bg-yara-gold" /> The Founder&apos;s Story</p>
            <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.03] sm:text-6xl lg:text-7xl">Every Great Empire Begins with a <em className="text-yara-wine">Single Purpose.</em></h1>
            <p className="mt-7 max-w-xl text-base font-light leading-8 text-yara-taupe">A story of purpose, perseverance, and an enduring belief in the transformative power of nature.</p>
            <Link to="/shop" className="btn-primary mt-9">Explore our products <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <Reveal className="relative mx-auto w-full max-w-[570px] px-3 sm:px-8" delay={0.12}>
            <motion.div animate={reducedMotion ? {} : { y: [0, -12, 0], rotate: [2, 3, 2] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="glass-panel relative rounded-[2.9rem] p-3 shadow-[0_32px_80px_rgba(91,34,53,.2)] sm:p-4">
              <img src={founderImage} alt="Fazeena Farook, founder of YARA" className="aspect-[4/5] w-full rounded-[2.3rem] object-cover object-top" />
            </motion.div>
            <div aria-hidden="true" className="absolute -left-2 top-12 h-36 w-36 rounded-full border border-yara-gold/30 bg-white/30 blur-[1px]" />
            <div aria-hidden="true" className="absolute -bottom-6 right-0 h-32 w-32 rounded-full bg-yara-rose/35 blur-2xl" />
            <div className="glass-panel absolute -bottom-3 left-0 rounded-2xl px-5 py-4 text-[0.62rem] font-semibold uppercase tracking-[.18em] text-yara-wine shadow-card sm:left-4"><span className="block text-yara-gold">Est. with purpose</span><span className="mt-1 block text-yara-ink">Sri Lanka · The World</span></div>
          </Reveal>
        </div>
      </section>

      <section className="page-shell py-24 sm:py-32">
        <Reveal className="mx-auto max-w-4xl text-center"><p className="eyebrow">The beginning</p><h2 className="mt-5 text-balance text-4xl leading-tight sm:text-5xl lg:text-6xl">From One Handmade Soap to a Global Beauty Brand</h2></Reveal>
        <Reveal className="mx-auto mt-12 max-w-3xl space-y-6 text-base font-light leading-8 text-yara-taupe sm:text-lg" delay={0.1}>
          <p className="font-serif text-2xl italic leading-9 text-yara-wine">Every great empire begins with a single purpose.</p>
          <p>For <strong className="font-medium text-yara-ink">Fazeena Farook</strong>, that purpose was simple—to create a handcrafted herbal soap that could genuinely solve everyday skin concerns.</p>
          <p>What began as a single handmade product soon became the foundation of one of the region&apos;s fastest-growing Ayurvedic skincare brands.</p>
          <p>Driven by an unwavering passion for natural beauty and wellness, Fazeena travelled to <strong className="font-medium text-yara-ink">Rajasthan, India</strong>, where she immersed herself in the centuries-old science of Ayurveda. There, she studied medicinal herbs, traditional skincare practices, and natural cosmetic formulation, building the authentic knowledge that would become the heart of YARA.</p>
          <p>Returning with a clear vision, she transformed a small home-based business into a growing skincare company dedicated to creating premium Ayurvedic products that deliver real results.</p>
          <p>As customers experienced visible improvements in their skin, YARA&apos;s reputation spread through genuine recommendations and trust. Thousands of successful customer journeys became the strongest proof of the brand&apos;s quality and effectiveness.</p>
          <p>Today, YARA offers a complete collection of certified Ayurvedic skincare solutions, combining nature, tradition, and innovation to help people feel confident in their own skin.</p>
        </Reveal>
      </section>

      <section className="relative bg-[#fbf2f0] py-24 sm:py-32"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(230,180,99,.2),transparent_20%),radial-gradient(circle_at_12%_92%,rgba(233,140,169,.24),transparent_22%)]" />
        <div className="page-shell relative"><Reveal className="max-w-2xl"><p className="eyebrow">The YARA Group</p><h2 className="mt-5 text-4xl sm:text-5xl">Building Beyond Beauty</h2></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{ventures.map(([title, subtitle, Icon], index) => <Reveal key={title as string} delay={index * 0.07}><article className="glass-panel group min-h-56 rounded-[2rem] p-7 transition duration-500 hover:-translate-y-2 hover:shadow-[0_24px_50px_rgba(91,34,53,.14)]"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/75 text-yara-wine"><Icon className="h-5 w-5" /></span><h3 className="mt-10 text-2xl leading-tight">{title as string}</h3><p className="mt-3 text-xs uppercase tracking-[.14em] text-yara-taupe">{subtitle as string}</p><ArrowUpRight className="mt-6 h-4 w-4 text-yara-gold transition group-hover:translate-x-1 group-hover:-translate-y-1" /></article></Reveal>)}</div>
          <Reveal className="mx-auto mt-14 max-w-3xl space-y-5 text-base font-light leading-8 text-yara-taupe sm:text-lg"><p>Entrepreneurship soon expanded beyond skincare.</p><p>Under Fazeena&apos;s leadership, YARA evolved into a diversified international business group spanning premium beauty, fashion, and global trading.</p><p>The company also expanded into international distribution, supplying premium imported Iranian saffron to leading supermarkets and government retail chains across Dubai while continuing to grow its presence across international markets.</p><p>As the business continued to grow, so did its vision—building trusted brands that combine quality, authenticity, and long-term customer relationships.</p></Reveal>
        </div>
      </section>

      <section className="page-shell py-24 sm:py-32"><Reveal className="text-center"><p className="eyebrow">A decade in the making</p><h2 className="mt-5 text-4xl sm:text-5xl">The Journey</h2></Reveal>
        <div className="hide-scrollbar relative mt-16 flex gap-4 overflow-x-auto pb-6 lg:gap-0 lg:overflow-visible">{milestones.map((milestone, index) => { const [title, place] = milestone.split("|"); return <Reveal key={milestone} className="relative min-w-[185px] flex-1 lg:min-w-0" delay={Math.min(index * 0.045, .35)}><div className="hidden lg:block absolute left-1/2 top-5 h-px w-full bg-gradient-to-r from-yara-gold/70 to-yara-rose/40" /><div className="relative"><span className="relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full border border-yara-gold/50 bg-[#fffdfa] text-[.64rem] font-semibold text-yara-wine">{String(index + 1).padStart(2, "0")}</span><div className="mt-5 rounded-2xl border border-yara-rose/25 bg-white/75 p-4 text-center shadow-sm"><p className="text-sm font-medium leading-5">{title}</p>{place && <p className="mt-2 text-[.62rem] uppercase tracking-[.12em] text-yara-taupe">{place}</p>}</div></div></Reveal>; })}</div>
      </section>

      <section className="bg-[#23151a] py-24 text-white sm:py-32"><div className="page-shell grid items-center gap-12 lg:grid-cols-2"><Reveal className="relative order-2 lg:order-1"><div className="absolute -inset-4 rounded-[2.8rem] bg-yara-gold/20 blur-2xl" /><img src={academyImage} alt="Botanical ingredients that inspire YARA formulations" className="relative aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-2xl" /></Reveal><Reveal className="order-1 lg:order-2" delay={0.1}><p className="text-[.68rem] font-semibold uppercase tracking-[.24em] text-[#e7c46d]">A defining chapter</p><h2 className="mt-5 text-4xl leading-tight sm:text-5xl">The Turning Point</h2><p className="mt-5 font-serif text-2xl italic text-[#f4d5de]">Aroma Flare Academy</p><div className="mt-8 space-y-5 text-base font-light leading-8 text-white/70"><p>Among every milestone, one chapter transformed the future of YARA more than any other—Aroma Flare Academy.</p><p>More than an educational institution, Aroma Flare became the foundation that helped shape the company&apos;s future.</p><p>The academy provided advanced knowledge in formulation, production, quality management, and large-scale manufacturing, allowing Fazeena to transform YARA from a home-based business into a professional manufacturing enterprise.</p><p>This journey also contributed to establishing internationally recognized production standards, leading the company toward GMP and ISO certifications that reflect YARA&apos;s commitment to quality, safety, and excellence.</p></div></Reveal></div></section>

      <section className="page-shell py-24 sm:py-32"><Reveal className="mx-auto max-w-2xl text-center"><p className="eyebrow">A world of YARA</p><h2 className="mt-5 text-4xl sm:text-5xl">Growing Beyond Borders</h2></Reveal><Reveal className="mt-12" delay={0.08}><div className="relative mx-auto aspect-[16/8] max-w-5xl overflow-hidden rounded-[2.5rem] border border-yara-gold/25 bg-[radial-gradient(circle_at_50%_50%,#fffdf8_0%,#f7e8e5_100%)] shadow-card"><div aria-hidden="true" className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(141,18,59,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(141,18,59,.12)_1px,transparent_1px)] [background-size:42px_42px]" /><svg aria-hidden="true" viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full fill-[#c58a9a]/25 stroke-yara-wine/20 stroke-[2]"><path d="M79 139l79-48 86 32 20 78-47 67-95-3-56-55zM352 79l106-22 92 45 39 83-51 58-93-13-74-55zM575 135l95-54 149 18 101 81-47 72-178 8-112-47zM349 274l72-30 68 52 15 115-68 51-63-69zM661 278l102-30 101 54-37 104-115 21-80-71z" /></svg>{countries.map(([country, left, top], index) => <motion.div key={country} className="absolute z-10" style={{ left, top }} initial={{ scale: .5, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: .25 + index * .08, type: "spring", stiffness: 180 }}><span className="relative grid h-3.5 w-3.5 place-items-center rounded-full bg-yara-wine shadow-[0_0_0_5px_rgba(255,255,255,.72),0_0_22px_rgba(141,18,59,.85)]"><span className="absolute h-7 w-7 animate-ping rounded-full border border-yara-wine/50" /></span><span className="mt-2 hidden whitespace-nowrap rounded-full bg-white/90 px-2 py-1 text-[.55rem] font-semibold uppercase tracking-[.1em] text-yara-wine shadow-sm sm:block">{country}</span></motion.div>)}</div></Reveal><Reveal className="mx-auto mt-10 max-w-3xl text-center text-base font-light leading-8 text-yara-taupe sm:text-lg">Today, YARA proudly serves customers across more than ten countries, continuously expanding its international presence while remaining committed to authentic Ayurvedic skincare, premium quality, and customer satisfaction.</Reveal></section>

      <section className="bg-yara-wine py-24 text-white sm:py-28"><div className="page-shell"><Reveal className="text-center"><p className="text-[.68rem] font-semibold uppercase tracking-[.24em] text-[#f5d994]">By the numbers</p><h2 className="mt-5 text-4xl sm:text-5xl">YARA Today</h2></Reveal><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["3000+", "Monthly Orders"], ["10+", "Countries Served"], ["Thousands", "Satisfied Customers"], ["Growing", "International Presence"]].map(([stat, label], index) => <Reveal key={label} delay={index * .08}><div className="rounded-[1.8rem] border border-white/20 bg-white/10 p-7 text-center backdrop-blur"><p className="font-serif text-4xl text-[#f8df9e] sm:text-5xl">{stat}</p><p className="mt-3 text-[.65rem] font-semibold uppercase tracking-[.15em] text-white/70">{label}</p></div></Reveal>)}</div></div></section>

      <section className="relative py-28 sm:py-36"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_10%_70%,rgba(233,140,169,.2),transparent_23%),radial-gradient(circle_at_90%_20%,rgba(238,200,109,.2),transparent_23%)]" /><Reveal className="page-shell relative mx-auto max-w-5xl text-center"><Sparkles className="mx-auto h-6 w-6 text-yara-gold" /><blockquote className="mt-8 font-serif text-3xl leading-tight sm:text-5xl lg:text-6xl">“From a single handcrafted herbal soap to an internationally growing beauty brand, every achievement began with one belief—that quality, purpose, and determination can transform lives.”</blockquote><div className="mx-auto mt-12 max-w-3xl space-y-5 text-base font-light leading-8 text-yara-taupe sm:text-lg"><p>Today, YARA continues to grow with a dedicated team of professionals, skincare specialists, and manufacturing experts who share one common vision—to create products that genuinely improve lives.</p><p>Fazeena Farook&apos;s journey is a testament to resilience, continuous learning, and unwavering determination.</p><p>Her story proves that extraordinary success does not begin with massive resources—it begins with one meaningful idea, pursued with passion and consistency.</p><p className="font-serif text-2xl italic text-yara-wine">The legacy continues. And the story is only just beginning.</p></div><div className="mt-11 flex flex-wrap justify-center gap-3"><Link to="/shop" className="btn-primary">Explore our products <ArrowRight className="h-4 w-4" /></Link><Link to="/contact" className="btn-secondary">Connect with YARA</Link></div></Reveal></section>
    </main>
  );
}
