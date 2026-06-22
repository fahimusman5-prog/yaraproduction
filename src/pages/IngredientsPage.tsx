import { CheckCircle2, Droplets, Flower2, Leaf, ShieldCheck, Sparkles, SunMedium } from "lucide-react";

const ingredientImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBBdnYeWP2kFB0zs1WBFK_pJjdJMHS6ikfFc3JPrBhBj31Rb6IZTvM1o9bkdklrF-VunRc8RNRdGnFZZMbg5D20uVjfRmXxo7_oO8FNlypnP7no3WFSn1JtQYjGCpGgNjPghZXsK8VrIbBBOGta7ShxMeVQnbbGqQnT3CNlIVNT9cJNAqtu7UqxyFIk-Yg-Nhi4yugIxxy3tcKLCfNOwuZYGwtrh6OfLEwDfz7EGs5DpTPzYaOKabrztlFERzot0qGMqB-R97OvRS5I";

const ingredients = [
  { icon: SunMedium, name: "Saffron", benefit: "Radiance & comfort", text: "A treasured botanical known for antioxidant compounds that help support a brighter, refreshed appearance." },
  { icon: Sparkles, name: "Alpha Arbutin", benefit: "Even-looking tone", text: "A focused skincare active used to reduce the visible appearance of dark spots and uneven tone." },
  { icon: Droplets, name: "Hyaluronic Acid", benefit: "Lasting hydration", text: "A moisture-binding ingredient that helps skin feel plump, supple, and comfortably hydrated." },
  { icon: Flower2, name: "Rosehip Oil", benefit: "Nourishment & glow", text: "Naturally rich in skin-supporting lipids that soften dry-feeling skin and promote a healthy-looking glow." },
  { icon: Leaf, name: "Aloe Vera", benefit: "Soothing care", text: "A gentle botanical used to comfort skin and support a calm, hydrated feel." },
  { icon: ShieldCheck, name: "Ceramides", benefit: "Barrier support", text: "Skin-identical lipids that help reinforce the moisture barrier and reduce feelings of dryness." }
];

export function IngredientsPage() {
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-br from-yara-blush via-yara-ivory to-[#fff8e9]">
        <div className="page-shell grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl"><p className="eyebrow">Ingredient education</p><h1 className="mt-4 text-balance text-5xl leading-[1.08] sm:text-6xl">Know what cares for your skin.</h1><p className="mt-7 text-base font-light leading-8 text-yara-taupe">We choose ingredients for a clear purpose: to cleanse gently, hydrate deeply, support the skin barrier, or improve the look of tone and texture.</p></div>
          <img src={ingredientImage} alt="Botanical skincare ingredients" className="aspect-[5/4] w-full rounded-[2.5rem] object-cover shadow-soft" />
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center"><p className="eyebrow">Key ingredients</p><h2 className="mt-4 text-4xl sm:text-5xl">Purposeful care, ingredient by ingredient.</h2></div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ingredients.map(({ icon: Icon, name, benefit, text }) => <article key={name} className="surface-card p-7 transition duration-300 hover:-translate-y-1 hover:shadow-soft"><span className="grid h-12 w-12 place-items-center rounded-full bg-yara-rose text-yara-wine"><Icon className="h-5 w-5" /></span><p className="eyebrow mt-6">{benefit}</p><h3 className="mt-2 text-3xl">{name}</h3><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{text}</p></article>)}
        </div>
      </section>

      <section className="bg-yara-blush py-20 sm:py-24"><div className="page-shell grid gap-12 lg:grid-cols-2"><div><p className="eyebrow">Why YARA chooses them</p><h2 className="mt-4 text-4xl sm:text-5xl">Every formula has a reason.</h2><p className="mt-6 text-sm font-light leading-7 text-yara-taupe">Our approach combines effective skincare actives with supportive hydrators and botanicals. Each ingredient is selected for its role in the complete formula—not because it is fashionable.</p></div><div className="grid gap-4">{["Focused ingredients selected for visible skincare benefits", "Hydration and barrier support balanced with active care", "Gentle textures designed for consistent use", "Clear guidance on how and when to use each product"].map((item) => <div key={item} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card"><CheckCircle2 className="h-5 w-5 shrink-0 text-yara-wine" /><p className="text-sm leading-6">{item}</p></div>)}</div></div></section>
    </>
  );
}
