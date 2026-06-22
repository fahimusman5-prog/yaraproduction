import { ArrowRight, CheckCircle2, FlaskConical, Heart, Leaf, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const storyImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBCZtDH4GUlG7MfFzGifgHMZQWHna7aw0R_61veAh75v_iy0jCs48XYaPyo6Kldc0WBqLLLwUghp7Wy2_1nWCuvuEmg6HbozHoqS0ZfeRPX4YLooyaWOAjoTF8n4euu7g9BvzAN5ED0vXf7ChwLpcbVG9clPJ9lWfFofkLafogichMLokqI1TRQ0NR3BCB3AEIpx81HC-FrxbrD4l6YUkZzuN_wa_iY3opsMg9HDkcr2J3HpaY13zrmeglulbYQzSeju9CS4qRSnUw7";
const labImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBBdnYeWP2kFB0zs1WBFK_pJjdJMHS6ikfFc3JPrBhBj31Rb6IZTvM1o9bkdklrF-VunRc8RNRdGnFZZMbg5D20uVjfRmXxo7_oO8FNlypnP7no3WFSn1JtQYjGCpGgNjPghZXsK8VrIbBBOGta7ShxMeVQnbbGqQnT3CNlIVNT9cJNAqtu7UqxyFIk-Yg-Nhi4yugIxxy3tcKLCfNOwuZYGwtrh6OfLEwDfz7EGs5DpTPzYaOKabrztlFERzot0qGMqB-R97OvRS5I";

export function AboutPage() {
  return (
    <>
      <section className="page-shell grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
        <div className="max-w-xl"><p className="eyebrow">Our story</p><h1 className="mt-4 text-balance text-5xl leading-[1.08] sm:text-6xl">Skincare, made with intention.</h1><p className="mt-7 text-base font-light leading-8 text-yara-taupe">YARA was born from a simple belief: the most effective care can also be the most beautiful part of your day. We pair modern skin science with botanical traditions, creating formulas that deliver visible results without losing their soul.</p><Link to="/shop" className="btn-primary mt-8">Discover the collection <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="relative mx-auto max-w-lg"><div className="absolute -left-8 -top-8 h-48 w-48 rounded-full bg-yara-rose blur-3xl" /><img src={storyImage} alt="YARA customer applying her skincare ritual" className="relative aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-soft" /></div>
      </section>

      <section className="bg-yara-blush py-20 sm:py-28">
        <div className="page-shell text-center"><p className="eyebrow">What guides us</p><h2 className="mt-4 text-4xl sm:text-5xl">A more thoughtful kind of luxury</h2><div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: FlaskConical, title: "Proven efficacy", text: "Purposeful concentrations of researched actives, developed for visible results and daily comfort." },
            { icon: Leaf, title: "Botanical intelligence", text: "Carefully chosen plant extracts bring antioxidant support, nourishment, and sensory beauty." },
            { icon: Heart, title: "Human-centered care", text: "Every texture, scent, and step is designed to make consistency feel like a pleasure, never a chore." }
          ].map(({ icon: Icon, title, text }) => <div key={title} className="surface-card p-8"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-yara-rose text-yara-wine"><Icon className="h-6 w-6" /></span><h3 className="mt-6 text-2xl">{title}</h3><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{text}</p></div>)}
        </div></div>
      </section>

      <section id="ingredients" className="page-shell grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2">
        <div className="order-2 lg:order-1"><img src={labImage} alt="Botanical ingredients selected for YARA formulas" className="aspect-[5/4] w-full rounded-[2.3rem] object-cover shadow-card" loading="lazy" /></div>
        <div className="order-1 max-w-xl lg:order-2"><p className="eyebrow">Ingredient philosophy</p><h2 className="mt-4 text-balance text-4xl leading-tight sm:text-5xl">Every ingredient earns its place.</h2><p className="mt-6 text-sm font-light leading-7 text-yara-taupe">We formulate around skin needs, not trends. Each product balances a focused active system with gentle hydrators and soothing botanicals, then removes anything that does not serve the formula.</p><div className="mt-7 grid gap-4">
          {["Effective levels of proven actives", "Barrier-supportive hydration in every face formula", "Vegan and cruelty-free development", "Transparent ingredient communication"].map((item) => <p key={item} className="flex items-center gap-3 text-sm"><CheckCircle2 className="h-5 w-5 shrink-0 text-yara-wine" />{item}</p>)}
        </div></div>
      </section>

      <section className="page-shell"><div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-yara-wine to-[#7f153c] px-6 py-14 text-center text-white sm:px-12 sm:py-20"><Sparkles className="mx-auto h-7 w-7 text-[#f2c96d]" /><h2 className="mt-5 text-balance text-4xl sm:text-5xl">Your best ritual is the one you love returning to.</h2><p className="mx-auto mt-5 max-w-2xl text-sm font-light leading-7 text-white/75">Begin with one thoughtful formula, then build slowly. We’re here to help you find what your skin truly needs.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/shop" className="btn-secondary border-white bg-white text-yara-wine">Shop YARA</Link><Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-white">Ask a ritual expert</Link></div></div></section>
    </>
  );
}
