import { ArrowRight, CheckCircle2, Droplets, Leaf, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { useCatalog } from "../context/CatalogContext";

const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuB0-W5LBkKAWq2piAK6Qb8YLROXHF1gkAu7dFGPEAbGYnm2uGslWtIsymMKAeOTDEW_JuV8f2M-4BJ4n8j_deoLTzzUBHIyFDdHRpC5DAUsNHIQ17VAYbzP4AoBM4ccbPt_tqv1ky_yj8x9dWVXq2nfrFzIzdWFzbUeYSxFL06rSKLmrZUHynKfgqbvK4S3WpbUu2Gdl90je11Hd2B_MnbKhCtX2KweqthcFPw5tSzryJqWUQWJEjm7kS34XxFy-gBsiLbTfRfZw8GH";
const skinImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCo-q9f2ZATD_ugKCOYwKtG9wKJn4JuJfxN_lptWTtp2h6IesOoOMK5Zvb7p9S1MiDtBsfMiTVzAL-UZTZhMOk3U1MDXUr8QAbQUoKdrQikvSD327KliWhpJnB1rG1EqTW5gnSYcNTrTnQqDqLenGKISCuzr6KNI-KM4FcCjMZTR5uSxepSH9Rf3VKiqA8Kh71yxJT8fjVTt9TqymipcIxLNjanZx95Bh0-cEqw5tQhVq9LoSn4vJ1e8unmzmuHOfiEUSCvGz7raF_x";
const botanicalImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBBdnYeWP2kFB0zs1WBFK_pJjdJMHS6ikfFc3JPrBhBj31Rb6IZTvM1o9bkdklrF-VunRc8RNRdGnFZZMbg5D20uVjfRmXxo7_oO8FNlypnP7no3WFSn1JtQYjGCpGgNjPghZXsK8VrIbBBOGta7ShxMeVQnbbGqQnT3CNlIVNT9cJNAqtu7UqxyFIk-Yg-Nhi4yugIxxy3tcKLCfNOwuZYGwtrh6OfLEwDfz7EGs5DpTPzYaOKabrztlFERzot0qGMqB-R97OvRS5I";

const instagramImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQDQ-bXHjYtKzlrJjyK1Rv8rkouhUavXzrCTKOkmqXJaNub880KJOAX5-15nqJxZo3oBHEYEcpGvxI7JjnsY5xU9Yexbl8TlO50HWWWF6NC5CKW3ppaP207NkV6HTdDviKKo3c7LjpJZxTsDdNyl9zEtQExjhkVXdVJ4s-ccXEhY6Ou2Tym7DF1gENg2VDCiYlkPvLaDgpvbc8loDFpkm2CIpsiaSGFtfkJ1JN1YeqNgrLDjqmOO7zFgOWKafmKs2aDpMxlsgeipI4",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBCZtDH4GUlG7MfFzGifgHMZQWHna7aw0R_61veAh75v_iy0jCs48XYaPyo6Kldc0WBqLLLwUghp7Wy2_1nWCuvuEmg6HbozHoqS0ZfeRPX4YLooyaWOAjoTF8n4euu7g9BvzAN5ED0vXf7ChwLpcbVG9clPJ9lWfFofkLafogichMLokqI1TRQ0NR3BCB3AEIpx81HC-FrxbrD4l6YUkZzuN_wa_iY3opsMg9HDkcr2J3HpaY13zrmeglulbYQzSeju9CS4qRSnUw7",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBL-I6W9jxy5uvlLfVWsjGwBKaxogxz7JWeqdvkNtDiNiuNENF_-x-Ol84xa4bwEdVqLUGPOb9gLAMGT3m-CxWHj8bvY5D-BUeA_xDlleiby9thR66xOj4BJoLrfujVRlXbXud12_PpnvUEQsPBEOKFETrqKJW9FLbMXnUGWpjNQBAlMs162ZY9i2ePUMShEZ53i5D-TT70sjQZ12H_QnN-6hlx6PwR649W8_9U5LmzsHfon2spLZFa8gGoi5oqLfgUVcRkIzEu6mRN",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB9nIAqcPCzyZpClcBtFhBvG5F0LFkzfU5Djs5xr-EOW3wjlLjG5p8nGIjUZY30VWngXZy-VheNTCuGnIIC4GyPND4-oHmMjwvxYKPLNwdrBFKZ36-G3HGnA9uss5pUqtfu66ZBx8bVNTKkx0LjLFqgBANozyHhoVsDHDIkjR-htpri0Ko1WghsifPT3IS1lA0BMmdlgzE3vKU2ACb7qPL-A9XeFZE6Mxs4nJtXUijpBDfsx6Xz0zjRbMWl9WIse2cgpBQZYBFwoMxJ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBE3V509E9vk6BMaLKQrOTznHPbc6p3tZPWlXMXLus8KL8CG7tdACI3xcZVclFnmcdKBI5CyFqJnH8pEwJTtNRgHt_AeaE7tl-rdrud_Zl_uf-FZJSyaMO22FLJtIrXVTQPM1nGd7hztsfUVF7wSCOYdGamFz3uCmdCIZ-HKB3FK5poN0XDiN4T1OrznpkUo4Vk6UXkyqlszMU3txLs_8PGxLG9_MYQdMyHyP7qx5R9BB1At9-rtvBli-5VMwk6D2AzKy_xFq5Kj5-U"
];

export function HomePage() {
  const { products } = useCatalog();
  const collections = products.slice(0, 6).map((product) => ({ name: product.category, product }));
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-br from-[#fff4f6] via-yara-ivory to-[#fbf5ef]">
        <div className="page-shell grid min-h-[680px] items-center gap-12 py-14 md:grid-cols-2 md:py-20 lg:min-h-[760px]">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-yara-gold/40 bg-[#fff7df] px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.16em]">
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
            <div className="relative rotate-2 rounded-[2.5rem] bg-white/70 p-4 shadow-soft backdrop-blur">
              <img src={heroImage} alt="YARA skincare collection displayed on rose satin" className="aspect-[4/5] w-full rounded-[1.8rem] object-cover" />
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
          {collections.map(({ name, product }) => (
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
          <img src={skinImage} alt="Healthy glowing skin" className="mt-10 aspect-[4/5] w-full rounded-[2rem] object-cover shadow-card" loading="lazy" />
          <img src={botanicalImage} alt="Botanical skincare ingredients" className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-card" loading="lazy" />
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
              <blockquote key={name} className={`rounded-[1.7rem] bg-white p-7 text-center shadow-card ${index === 1 ? "ring-1 ring-yara-wine" : ""}`}>
                <div className="text-yara-gold">★★★★★</div><p className="mt-5 font-serif text-base italic leading-7">“{quote}”</p><footer className="mt-5 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-yara-taupe">{name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Follow YARA</p><h2 className="mt-3 text-3xl">On the ’Gram <em className="text-yara-wine">@YARALuxe</em></h2></div><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hidden text-xs uppercase tracking-[0.15em] text-yara-wine sm:block">Follow us</a></div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">{instagramImages.map((image, index) => <img key={image} src={image} alt={`YARA skincare inspiration ${index + 1}`} className="aspect-square w-full rounded-2xl object-cover" loading="lazy" />)}</div>
      </section>
    </>
  );
}
