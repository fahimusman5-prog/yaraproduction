import { ArrowRight, CheckCircle2, Globe2, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const storyImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBCZtDH4GUlG7MfFzGifgHMZQWHna7aw0R_61veAh75v_iy0jCs48XYaPyo6Kldc0WBqLLLwUghp7Wy2_1nWCuvuEmg6HbozHoqS0ZfeRPX4YLooyaWOAjoTF8n4euu7g9BvzAN5ED0vXf7ChwLpcbVG9clPJ9lWfFofkLafogichMLokqI1TRQ0NR3BCB3AEIpx81HC-FrxbrD4l6YUkZzuN_wa_iY3opsMg9HDkcr2J3HpaY13zrmeglulbYQzSeju9CS4qRSnUw7";

export function AboutPage() {
  return (
    <>
      <section className="page-shell grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
        <div className="max-w-xl">
          <p className="eyebrow">The YARA story</p>
          <h1 className="mt-4 text-balance text-5xl leading-[1.08] sm:text-6xl">Beauty with purpose, made to inspire confidence.</h1>
          <p className="mt-7 text-base font-light leading-8 text-yara-taupe">YARA began with a desire to make premium personal care feel warm, attainable, and genuinely effective. What started in Sri Lanka has grown into a beauty community serving customers across Sri Lanka and the UAE.</p>
          <Link to="/shop" className="btn-primary mt-8">Explore YARA <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="relative mx-auto max-w-lg"><div className="absolute -left-8 -top-8 h-48 w-48 rounded-full bg-yara-rose blur-3xl" /><img src={storyImage} alt="The YARA beauty community" className="relative aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-soft" /></div>
      </section>

      <section className="bg-yara-blush py-20 sm:py-28">
        <div className="page-shell text-center">
          <p className="eyebrow">Our mission</p><h2 className="mx-auto mt-4 max-w-3xl text-balance text-4xl sm:text-5xl">Help every customer feel seen, cared for, and radiant.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: HeartHandshake, title: "Customer first", text: "Thoughtful guidance and responsive support from discovery through delivery." },
              { icon: ShieldCheck, title: "Quality promise", text: "Carefully developed products, dependable standards, and honest communication." },
              { icon: Sparkles, title: "Everyday confidence", text: "Beautiful self-care designed to fit real lives and celebrate individual beauty." }
            ].map(({ icon: Icon, title, text }) => <div key={title} className="surface-card p-8"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-yara-rose text-yara-wine"><Icon className="h-6 w-6" /></span><h3 className="mt-6 text-2xl">{title}</h3><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="grid items-center gap-10 rounded-[2.5rem] border border-yara-gold/30 bg-white p-7 shadow-card sm:p-12 lg:grid-cols-[0.8fr_1.2fr]">
          <span className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-yara-rose to-[#fff7df] text-yara-wine"><Globe2 className="h-14 w-14" /></span>
          <div><p className="eyebrow">Sri Lanka & UAE</p><h2 className="mt-4 text-4xl sm:text-5xl">One YARA community, across two countries.</h2><p className="mt-6 text-sm font-light leading-7 text-yara-taupe">Our dedicated Sri Lanka and UAE/Dubai ordering options make pricing and support clear for every customer. Wherever you shop with us, you receive the same care, quality, and attention.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Country-specific pricing", "Dedicated WhatsApp support", "Clear ordering assistance", "Trusted customer care"].map((item) => <p key={item} className="flex items-center gap-3 text-sm"><CheckCircle2 className="h-5 w-5 text-yara-wine" />{item}</p>)}</div></div>
        </div>
      </section>

      <section className="page-shell"><div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-yara-wine to-[#7f153c] px-6 py-14 text-center text-white sm:px-12 sm:py-20"><h2 className="text-balance text-4xl sm:text-5xl">Made with care. Shared with confidence.</h2><p className="mx-auto mt-5 max-w-2xl text-sm font-light leading-7 text-white/75">Discover products created to make your everyday care feel beautifully considered.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/shop" className="btn-secondary border-white bg-white text-yara-wine">Shop YARA</Link><Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-white">Contact us</Link></div></div></section>
    </>
  );
}
