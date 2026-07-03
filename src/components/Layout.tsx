import { useEffect, useState, type ReactNode } from "react";
import {
  Instagram,
  Mail,
  Menu,
  ShoppingBag,
  X,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createWhatsAppLink } from "../lib/format";
import yaraLogo from "../assets/yara-logo-glow.png";
import { countryDetails, useCountry } from "../context/CountryContext";
import { getLocalizedPath, localeLabels, locales, useI18n } from "../i18n";

function Header() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { country, changeCountry } = useCountry();
  const { locale, t } = useI18n();
  const navItems = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.shop"), to: "/shop" },
    { label: t("nav.ingredients"), to: "/ingredients" },
    { label: t("nav.about"), to: "/about" },
    { label: t("nav.contact"), to: "/contact" }
  ];

  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  return (
    <header className="sticky top-0 z-50 border-b border-yara-rose/40 bg-yara-ivory/95 backdrop-blur-xl">
      <div className="page-shell grid h-[72px] grid-cols-[auto_1fr_auto] items-center gap-3 lg:h-[82px]">
        <Link to="/" className="h-14 w-20 shrink-0 overflow-hidden" aria-label="YARA home">
          <img src={yaraLogo.src} alt="YARA official logo" className="h-full w-full scale-[1.6] object-contain" />
        </Link>

        <nav className="hidden items-center justify-center gap-7 lg:flex xl:gap-9" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `relative py-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] transition hover:text-yara-wine ${
                  isActive ? "text-yara-wine after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-yara-wine" : ""
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {country && <span className="hidden text-[0.54rem] font-semibold uppercase tracking-[0.08em] text-yara-wine lg:block xl:text-[0.58rem] xl:tracking-[0.1em]">{t(country === "sri-lanka" ? "region.sriLankaLabel" : "region.uaeLabel")}</span>}
          <div className="hidden items-center rounded-full border border-yara-rose bg-white/70 p-1 lg:flex" aria-label={t("nav.language")}>
            {locales.map((option) => (
              <a
                key={option}
                href={getLocalizedPath(option, location.pathname, location.search, location.hash)}
                className={`rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.08em] transition ${option === locale ? "bg-yara-wine text-white" : "text-yara-taupe hover:text-yara-wine"}`}
                hrefLang={option}
                aria-current={option === locale ? "true" : undefined}
              >
                {localeLabels[option]}
              </a>
            ))}
          </div>
          <Link to="/cart" className="relative rounded-full p-2.5" aria-label={t("nav.shoppingBag", { count: itemCount })}>
            <ShoppingBag className="h-[19px] w-[19px]" />
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-yara-wine px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button onClick={changeCountry} className="hidden rounded-full border border-yara-gold/50 px-2.5 py-2 text-[0.5rem] font-semibold uppercase tracking-[0.07em] lg:block xl:px-3 xl:text-[0.54rem] xl:tracking-[0.09em]">{t("nav.changeCountry")}</button>
          <button
            className="rounded-full p-2.5 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-yara-rose/50 bg-yara-ivory px-5 pb-7 pt-5 lg:hidden">
          <nav className="grid gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.label} to={item.to} className="border-b border-yara-rose/60 py-3 text-sm uppercase tracking-[0.16em]">
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-wrap gap-2" aria-label={t("nav.language")}>
              {locales.map((option) => (
                <a key={option} href={getLocalizedPath(option, location.pathname, location.search, location.hash)} className={`rounded-full border px-3 py-2 text-xs font-bold ${option === locale ? "border-yara-wine bg-yara-wine text-white" : "border-yara-rose text-yara-taupe"}`} hrefLang={option}>{localeLabels[option]}</a>
              ))}
            </div>
            {country && <div className="mt-3 rounded-2xl bg-yara-blush p-4"><p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-yara-wine">{t(country === "sri-lanka" ? "region.sriLankaLabel" : "region.uaeLabel")}</p><Link to="/cart" className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]"><ShoppingBag className="h-4 w-4" /> {t("nav.cart")} ({itemCount})</Link><button onClick={changeCountry} className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.1em] underline">{t("nav.changeCountry")}</button></div>}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 rounded-t-[2.5rem] bg-[#fde8ee] pt-14 sm:mt-28 sm:pt-16">
      <div className="page-shell grid gap-10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Link to="/" className="inline-block h-28 w-36 overflow-hidden" aria-label="YARA home">
            <img src={yaraLogo.src} alt="YARA official logo" className="h-full w-full scale-[1.6] object-contain" />
          </Link>
          <p className="mt-5 max-w-xs text-sm font-light leading-7 text-yara-taupe">
            {t("layout.footerText")}
          </p>
          <div className="mt-5 flex gap-3 text-yara-wine">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-yara-wine/20 p-2"><Instagram className="h-4 w-4" /></a>
            <a href="mailto:hello@yaraskincare.com" aria-label="Email YARA" className="rounded-full border border-yara-wine/20 p-2"><Mail className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h3 className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.17em]">{t("layout.explore")}</h3>
          <div className="mt-5 grid gap-3 text-sm font-light text-yara-taupe">
            <Link to="/shop">{t("layout.shopAll")}</Link><Link to="/shop?category=Skincare">{t("layout.bestsellers")}</Link><Link to="/shop?category=Gift%20Sets">{t("layout.giftSets")}</Link><Link to="/about">{t("layout.ourStory")}</Link>
          </div>
        </div>
        <div>
          <h3 className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.17em]">{t("layout.care")}</h3>
          <div className="mt-5 grid gap-3 text-sm font-light text-yara-taupe">
            <Link to="/contact">{t("layout.contactUs")}</Link><Link to="/contact">{t("layout.shippingPolicy")}</Link><Link to="/contact">{t("layout.terms")}</Link><Link to="/contact">{t("layout.privacy")}</Link>
          </div>
        </div>
        <div>
          <h3 className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.17em]">{t("layout.newsletter")}</h3>
          <p className="mt-5 text-sm font-light leading-6 text-yara-taupe">{t("layout.newsletterText")}</p>
          <form className="mt-5 flex rounded-full bg-white/75 p-1" onSubmit={(event) => event.preventDefault()}>
            <input type="email" required placeholder={t("layout.emailAddress")} aria-label={t("layout.emailAddress")} className="min-w-0 flex-1 bg-transparent px-4 text-xs" />
            <button className="rounded-full bg-yara-wine p-3 text-white" aria-label={t("layout.joinNewsletter")}><ArrowRight className="h-4 w-4" /></button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/60 py-6 text-center text-[0.65rem] uppercase tracking-[0.12em] text-yara-taupe">
        © {new Date().getFullYear()} YARA Productions. {t("layout.rights")}
      </div>
    </footer>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: "instant" }), [pathname]);
  return null;
}

function StorefrontSeo() {
  const location = useLocation();
  const { locale, t } = useI18n();

  useEffect(() => {
    const title = t("seo.title");
    const description = t("seo.description");
    document.title = title;

    let descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.name = "description";
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.content = description;

    document.querySelectorAll('link[data-yara-hreflang="true"]').forEach((node) => node.remove());
    locales.forEach((option) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = option;
      link.href = `${window.location.origin}${getLocalizedPath(option, location.pathname, location.search)}`;
      link.dataset.yaraHreflang = "true";
      document.head.appendChild(link);
    });
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = `${window.location.origin}${getLocalizedPath(locale, location.pathname, location.search)}`;
    canonical.dataset.yaraHreflang = "true";
    document.head.appendChild(canonical);
  }, [locale, location.pathname, location.search, t]);

  return null;
}

export function Layout({ children }: { children: ReactNode }) {
  const { country } = useCountry();
  const { t } = useI18n();
  if (!country) return null;
  return (
    <>
      <ScrollToTop />
      <StorefrontSeo />
      <Header />
      <main>{children}</main>
      <Footer />
      <a
        href={createWhatsAppLink(`${t("layout.chatHelp")}\n\n${t("whatsapp.country")}: ${countryDetails[country].name}\n${t("whatsapp.currency")}: ${countryDetails[country].currency}`, country)}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#20bd5a] text-white shadow-xl transition hover:-translate-y-1"
        aria-label={t("layout.chatLabel")}
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </>
  );
}
