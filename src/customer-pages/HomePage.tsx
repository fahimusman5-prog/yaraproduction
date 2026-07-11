import { ArrowRight, CheckCircle2, Droplets, Leaf, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { useCatalog } from "../context/CatalogContext";

const heroImage = "/images/yara-hero-products.png";
const skinImage = "/images/home/skincare-texture-pink-cream.png";
const botanicalImage = "/images/home/science-backed-botanical-skincare.png";

export function HomePage() {
  const { products } = useCatalog();
  const collections = Array.from(new Map(products.map((product) => [product.category, product])).entries()).slice(0, 6);
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff4f6] via-yara-ivory to-[#fbf5ef] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80">
        <div className="page-shell grid min-h-[680px] items-center gap-12 py-14 md:grid-cols-2 md:py-20 lg:min-h-[760px]">
          <div className="relative z-10 max-w-xl">
            <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.16em]">
              <Sparkles className="h-3 w-3 text-yara-gold" /> Premium skincare
            </span>
            <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] sm:text-6xl lg:text-[4.8rem]">
              Reveal Your Natural Glow with <em className="text-yara-wine">YARA</em>
            </h1>
            <p className="mt-7 max-w-lg text-sm font-light leading-7 text-yara-taupe sm:text-base">
              Experience the fusion of clinical efficacy and botanical luxury. Expertly crafted for modern skin and inspired by intentional self-care.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">Shop now <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/about" className="btn-secondary">Discover our story</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[0.68rem] uppercase tracking-[0.12em] text-yara-taupe">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-yara-wine" /> Vegan formulas</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-yara-wine" /> Cruelty-free</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-yara-wine" /> Country-wide delivery</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[560px] px-3 sm:px-8">
            <div className="absolute -left-8 top-1/3 h-48 w-48 rounded-full bg-yara-rose/70 blur-3xl" />
            <div className="absolute -right-12 bottom-8 h-56 w-56 rounded-full bg-yara-gold/15 blur-3xl" />
            <div className="glass-panel relative rotate-2 rounded-[2.5rem] p-4 shadow-soft">
              <img src={heroImage} alt="YARA skincare collection displayed on a pink floral set" className="aspect-[4/5] w-full rounded-[1.8rem] object-cover object-center" />
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Find your favorites</p><h2 className="mt-3 text-3xl sm:text-4xl">Product Categories</h2></div>
          <p className="max-w-sm text-sm font-light leading-6 text-yara-taupe">Tailored solutions for every concern, from cleansing to intensive care.</p>
        </div>
        <div className="hide-scrollbar mt-10 flex gap-5 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {collections.map(([name, product]) => (
            <Link key={name} to={`/shop?category=${encodeURIComponent(product.category)}`} className="group min-w-[145px] text-center">
              <div className="aspect-square overflow-hidden rounded-full border border-yara-rose bg-yara-blush p-1.5 transition group-hover:border-yara-wine/40">
                <img src={product.image} alt="" className="h-full w-full rounded-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <p className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.14em]">{name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-yara-blush py-20 sm:py-28">
        <div className="page-shell">
          <div className="text-center"><p className="eyebrow">Our favorites</p><h2 className="mt-3 text-4xl sm:text-5xl">Best Sellers</h2></div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}</div>
          <div className="mt-10 text-center"><Link to="/shop" className="btn-secondary">Explore all products <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="page-shell grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          <img src={skinImage} alt="Luxury skincare cream texture" className="mt-10 aspect-square w-full rounded-[2rem] object-cover shadow-soft" loading="lazy" />
          <img src={botanicalImage} alt="Science-backed botanical skincare ingredients" className="aspect-square w-full rounded-[2rem] object-cover shadow-soft" loading="lazy" />
        </div>
        <div className="max-w-xl">
          <p className="eyebrow">The YARA standard</p>
          <h2 className="mt-4 text-balance text-4xl leading-tight sm:text-5xl">Science-Backed, Emotionally Nurtured.</h2>
          <p className="mt-6 text-sm font-light leading-7 text-yara-taupe">Every formula balances proven actives with sensorial botanicals—because effective skincare should feel as beautiful as it performs.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Sparkles, title: "Brightening", text: "Naturally derived actives that boost luminosity." },
              { icon: Droplets, title: "Deep hydration", text: "Multi-weight hydration for lasting comfort." },
              { icon: CheckCircle2, title: "Anti-aging", text: "Peptides and retinoid alternatives for renewal." },
              { icon: Leaf, title: "Clean formulas", text: "Vegan, cruelty-free, and thoughtfully developed." }
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3"><Icon className="mt-1 h-5 w-5 shrink-0 text-yara-wine" /><div><h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em]">{title}</h3><p className="mt-2 text-xs font-light leading-5 text-yara-taupe">{text}</p></div></div>
            ))}
          </div>
          <Link to="/about" className="btn-primary mt-9">Our approach <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="bg-[#fbf5f4] py-20 sm:py-24">
        <div className="page-shell">
          <div className="text-center"><p className="eyebrow">Real routines, real radiance</p><h2 className="mt-3 text-3xl sm:text-4xl">Loved by Skin Enthusiasts</h2></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["The Saffron Face Wash changed how my skin feels in the morning—clean, calm and never tight.", "Elena V."],
              ["I have never used a face wash that feels this luxurious. The saffron scent is subtle and dreamy.", "Sienna J."],
              ["The packaging is beautiful, but the glow is what keeps me coming back. Truly worth it.", "Marcus L."]
            ].map(([quote, name], index) => (
              <blockquote key={name} className={`rounded-[1.7rem] border border-white/80 bg-white p-7 text-center shadow-card ${index === 1 ? "ring-1 ring-yara-wine" : ""}`}>
                <div className="text-yara-gold">★★★★★</div><p className="mt-5 font-serif text-base italic leading-7">“{quote}”</p><footer className="mt-5 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-yara-taupe">{name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
