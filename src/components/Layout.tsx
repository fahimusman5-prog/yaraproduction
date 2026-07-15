import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Globe2,
  Menu,
  ShoppingBag,
  X,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { CountryContactSelector } from "./CountryContactSelector";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createWhatsAppLink } from "../lib/format";
import yaraLogo from "../assets/yara-logo-glow.png";
import { countryDetails, useCountry } from "../context/CountryContext";
import { getLocalizedPath, localeLabels, locales, useI18n, type Locale } from "../i18n";
import { footerSocialLinks } from "../lib/social-links";
import { founderStory } from "../data/founder-story";

const mobileLocaleLabels: Record<Locale, string> = {
  en: "EN",
  si: "සිං",
  ta: "தமிழ்",
  ar: "AR",
};

const localeOptionNames: Record<Locale, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
  ar: "العربية",
};

function LanguageSelector({ variant }: { variant: "desktop" | "mobile" }) {
  const { locale, localeName, t } = useI18n();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstOptionRef = useRef<HTMLAnchorElement>(null);
  const wasOpenRef = useRef(false);
  const menuId = useId();
  const isMobile = variant === "mobile";

  useEffect(() => setOpen(false), [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) firstOptionRef.current?.focus();
    if (!open && wasOpenRef.current) triggerRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    const currentIndex = locales.findIndex((option) => option === event.currentTarget.dataset.locale);
    const nextIndex = event.key === "ArrowDown" ? (currentIndex + 1) % locales.length : event.key === "ArrowUp" ? (currentIndex - 1 + locales.length) % locales.length : event.key === "Home" ? 0 : event.key === "End" ? locales.length - 1 : null;

    if (nextIndex === null) return;
    event.preventDefault();
    selectorRef.current?.querySelector<HTMLAnchorElement>(`a[data-locale="${locales[nextIndex]}"]`)?.focus();
  };

  if (!isMobile) {
    return (
      <div className="glass-panel hidden items-center rounded-full p-1 lg:flex" aria-label={t("nav.language")}>
        {locales.map((option) => (
          <a
            key={option}
            href={getLocalizedPath(option, location.pathname, location.search, location.hash)}
            className={`rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.08em] transition duration-200 ${option === locale ? "bg-yara-wine text-white shadow-sm" : "text-yara-taupe hover:bg-white/70 hover:text-yara-wine"}`}
            hrefLang={option}
            aria-current={option === locale ? "true" : undefined}
          >
            {localeLabels[option]}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div ref={selectorRef} className="relative z-[55] lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="glass-control flex min-h-11 items-center gap-1.5 whitespace-nowrap px-2.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.04em] text-yara-wine shadow-[0_8px_20px_rgba(135,66,87,0.12)] min-[360px]:gap-2 min-[360px]:px-3 min-[390px]:text-[0.72rem]"
        aria-label={`${t("nav.language")}: ${localeName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        <Globe2 className="h-3.5 w-3.5 shrink-0 min-[360px]:h-4 min-[360px]:w-4" aria-hidden="true" />
        <span>{mobileLocaleLabels[locale]}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        <span className="sr-only">{localeName}</span>
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label={t("nav.language")}
        className={`glass-panel absolute right-0 top-[calc(100%+0.55rem)] w-40 overflow-hidden rounded-2xl border border-yara-gold/35 bg-[#fffafb]/95 p-1.5 shadow-[0_18px_42px_rgba(86,45,56,0.18)] backdrop-blur-xl transition duration-200 ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"}`}
      >
        {locales.map((option, index) => {
          const active = option === locale;
          return (
            <a
              key={option}
              ref={index === 0 ? firstOptionRef : undefined}
              data-locale={option}
              href={getLocalizedPath(option, location.pathname, location.search, location.hash)}
              hrefLang={option}
              role="menuitem"
              aria-current={active ? "true" : undefined}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              onKeyDown={handleMenuKeyDown}
              className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? "bg-yara-wine text-white shadow-sm" : "text-yara-ink hover:bg-white/75 focus-visible:bg-white/75"}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.08em]">{mobileLocaleLabels[option]}</span>
                <span className={active ? "text-white/80" : "text-yara-taupe"}>{localeOptionNames[option]}</span>
              </span>
              {active && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </a>
          );
        })}
      </div>
    </div>
  );
}

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
    <header className="sticky top-0 z-50 border-b border-white/70 bg-yara-ivory/85 shadow-[0_8px_30px_rgba(86,45,56,0.06)] backdrop-blur-xl">
      <div className="page-shell grid h-[72px] grid-cols-[auto_1fr_auto] items-center gap-3 lg:h-[82px]">
        <Link to="/" className="h-14 w-20 shrink-0 overflow-hidden" aria-label="YARA">
          <img src={yaraLogo.src} alt="YARA official logo" className="h-full w-full scale-[1.6] object-contain" />
        </Link>

        <nav className="hidden items-center justify-center gap-7 lg:flex xl:gap-9" aria-label={t("nav.mainNavigation")}>
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
          <LanguageSelector variant="desktop" />
          <LanguageSelector variant="mobile" />
          <CountryContactSelector variant="desktop" />
          <Link to="/cart" className="glass-icon relative h-10 w-10 text-yara-wine" aria-label={t("nav.shoppingBag", { count: itemCount })}>
            <ShoppingBag className="h-[19px] w-[19px]" />
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-yara-wine px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button onClick={changeCountry} className="glass-control hidden min-h-10 px-3 py-2 text-[0.5rem] font-semibold uppercase tracking-[0.07em] text-yara-wine lg:block xl:text-[0.54rem] xl:tracking-[0.09em]">{t("nav.changeCountry")}</button>
          <button
            className="glass-icon h-10 w-10 text-yara-wine lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/70 bg-yara-ivory/95 px-5 pb-7 pt-5 shadow-[0_16px_40px_rgba(86,45,56,0.08)] backdrop-blur-xl lg:hidden">
          <nav className="grid gap-1" aria-label={t("nav.mobileNavigation")}>
            {navItems.map((item) => (
              <Link key={item.label} to={item.to} className="border-b border-yara-rose/60 py-3 text-sm uppercase tracking-[0.16em]">
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-wrap gap-2" aria-label={t("nav.language")}>
              {locales.map((option) => (
                <a key={option} href={getLocalizedPath(option, location.pathname, location.search, location.hash)} className={`glass-control px-3 py-2 text-xs font-bold ${option === locale ? "bg-yara-wine text-white" : "text-yara-taupe"}`} hrefLang={option}>{localeLabels[option]}</a>
              ))}
            </div>
            <CountryContactSelector variant="mobile" />
            {country && <div className="glass-panel mt-3 rounded-2xl p-4"><p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-yara-wine">{t(country === "sri-lanka" ? "region.sriLankaLabel" : "region.uaeLabel")}</p><Link to="/cart" className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]"><ShoppingBag className="h-4 w-4" /> {t("nav.cart")} ({itemCount})</Link><button onClick={changeCountry} className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.1em] underline">{t("nav.changeCountry")}</button></div>}
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
          <Link to="/" className="inline-block h-28 w-36 overflow-hidden" aria-label="YARA">
            <img src={yaraLogo.src} alt="YARA official logo" className="h-full w-full scale-[1.6] object-contain" />
          </Link>
          <p className="mt-5 max-w-xs text-sm font-light leading-7 text-yara-taupe">
            {t("layout.footerText")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-yara-wine">
            {footerSocialLinks.map(({ name, href, icon: Icon, ariaLabel }) => href ? (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} title={ariaLabel} className="glass-icon h-11 w-11 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_10px_22px_rgba(135,66,87,0.18)]"><Icon className="h-5 w-5" /></a>
            ) : (
              <button key={name} type="button" disabled aria-label="YARA Facebook page is not yet available" title="YARA Facebook page is not yet available" className="glass-icon h-11 w-11 cursor-not-allowed opacity-45"><Icon className="h-5 w-5" /></button>
            ))}
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
          <form className="glass-panel mt-5 flex rounded-full p-1" onSubmit={(event) => event.preventDefault()}>
            <input type="email" required placeholder={t("layout.emailAddress")} aria-label={t("layout.emailAddress")} className="min-w-0 flex-1 bg-transparent px-4 text-xs" />
            <button className="glass-icon h-10 w-10 bg-yara-wine text-white" aria-label={t("layout.joinNewsletter")}><ArrowRight className="h-4 w-4" /></button>
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
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function StorefrontSeo() {
  const location = useLocation();
  const { locale, t } = useI18n();

  useEffect(() => {
    const isAboutPage = location.pathname === "/about";
    const title = isAboutPage ? founderStory.seo.title : t("seo.title");
    const description = isAboutPage ? founderStory.seo.description : t("seo.description");
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
        className="glass-icon fixed bottom-5 right-5 z-40 h-14 w-14 bg-[#20bd5a] text-white shadow-[0_14px_30px_rgba(25,130,75,0.28)]"
        aria-label={t("layout.chatLabel")}
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </>
  );
}
