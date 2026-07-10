import { CheckCircle2, Droplets, Flower2, Leaf, ShieldCheck, Sparkles, SunMedium } from "lucide-react";
import { useI18n } from "../i18n";

const ingredientImage = "/images/home/ingredient-education-skincare.png";

export function IngredientsPage() {
  const { t, list } = useI18n();
  const translatedIngredients = list("ingredients.cards").map((item, index) => {
    const [name, benefit, text] = item.split("|");
    return { name, benefit, text, icon: [SunMedium, Sparkles, Droplets, Flower2, Leaf, ShieldCheck][index] ?? Sparkles };
  });
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-br from-yara-blush via-yara-ivory to-[#fff8e9]">
        <div className="page-shell grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl"><p className="eyebrow">{t("ingredients.eyebrow")}</p><h1 className="mt-4 text-balance text-5xl leading-[1.08] sm:text-6xl">{t("ingredients.title")}</h1><p className="mt-7 text-base font-light leading-8 text-yara-taupe">{t("ingredients.copy")}</p></div>
          <img src={ingredientImage} alt="Skincare ingredients and botanical actives" className="aspect-[5/4] w-full rounded-[2.5rem] object-cover shadow-soft" />
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center"><p className="eyebrow">{t("ingredients.keyEyebrow")}</p><h2 className="mt-4 text-4xl sm:text-5xl">{t("ingredients.keyTitle")}</h2></div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {translatedIngredients.map(({ icon: Icon, name, benefit, text }) => <article key={name} className="surface-card p-7 transition duration-300 hover:-translate-y-1 hover:shadow-soft"><span className="grid h-12 w-12 place-items-center rounded-full bg-yara-rose text-yara-wine"><Icon className="h-5 w-5" /></span><p className="eyebrow mt-6">{benefit}</p><h3 className="mt-2 text-3xl">{name}</h3><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{text}</p></article>)}
        </div>
      </section>

      <section className="bg-yara-blush py-20 sm:py-24"><div className="page-shell grid gap-12 lg:grid-cols-2"><div><p className="eyebrow">{t("ingredients.whyEyebrow")}</p><h2 className="mt-4 text-4xl sm:text-5xl">{t("ingredients.whyTitle")}</h2><p className="mt-6 text-sm font-light leading-7 text-yara-taupe">{t("ingredients.whyCopy")}</p></div><div className="grid gap-4">{list("ingredients.reasons").map((item) => <div key={item} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card"><CheckCircle2 className="h-5 w-5 shrink-0 text-yara-wine" /><p className="text-sm leading-6">{item}</p></div>)}</div></div></section>
    </>
  );
}
