import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Heart,
  Instagram,
  Mail,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createWhatsAppLink } from "../lib/format";

const navItems = [
  { label: "Shop", to: "/shop" },
  { label: "Rituals", to: "/shop?category=Skincare" },
  { label: "Ingredients", to: "/about#ingredients" },
  { label: "About", to: "/about" }
];

function Header() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-yara-rose/40 bg-yara-ivory/95 backdrop-blur-xl">
      <div className="page-shell flex h-[72px] items-center gap-4 lg:h-[82px]">
        <Link to="/" className="font-serif text-2xl font-semibold italic text-yara-wine" aria-label="YARA home">
          YARA
        </Link>

        <nav className="ml-7 hidden items-center gap-8 lg:flex" aria-label="Main navigation">
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
          <form onSubmit={handleSearch} className="relative hidden xl:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yara-taupe" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rituals..."
              aria-label="Search products"
              className="w-56 rounded-full border border-yara-rose bg-white/60 py-2.5 pl-11 pr-4 text-xs transition focus:w-64"
            />
          </form>
          <button onClick={() => navigate("/shop")} className="rounded-full p-2.5 xl:hidden" aria-label="Search products">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Link to="/login" className="hidden rounded-full p-2.5 sm:block" aria-label="Your account">
            <UserRound className="h-[18px] w-[18px]" />
          </Link>
          <Link to="/shop" className="hidden rounded-full p-2.5 sm:block" aria-label="Saved products">
            <Heart className="h-[18px] w-[18px]" />
          </Link>
          <Link to="/cart" className="relative rounded-full p-2.5" aria-label={`Shopping bag with ${itemCount} items`}>
            <ShoppingBag className="h-[19px] w-[19px]" />
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-yara-wine px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
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
          <form onSubmit={handleSearch} className="relative mb-5">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yara-taupe" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rituals..."
              className="field pl-11"
              aria-label="Search products"
            />
          </form>
          <nav className="grid gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.label} to={item.to} className="border-b border-yara-rose/60 py-3 text-sm uppercase tracking-[0.16em]">
                {item.label}
              </Link>
            ))}
            <Link to="/login" className="flex items-center gap-2 py-3 text-sm uppercase tracking-[0.16em]">
              <UserRound className="h-4 w-4" /> Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 rounded-t-[2.5rem] bg-[#fde8ee] pt-14 sm:mt-28 sm:pt-16">
      <div className="page-shell grid gap-10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Link to="/" className="font-serif text-xl font-semibold italic text-yara-wine">YARA</Link>
          <p className="mt-5 max-w-xs text-sm font-light leading-7 text-yara-taupe">
            Modern rituals for the conscious soul. Merging high-science with the art of self-care.
          </p>
          <div className="mt-5 flex gap-3 text-yara-wine">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-yara-wine/20 p-2"><Instagram className="h-4 w-4" /></a>
            <a href="mailto:hello@yaraskincare.com" aria-label="Email YARA" className="rounded-full border border-yara-wine/20 p-2"><Mail className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h3 className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.17em]">Explore</h3>
          <div className="mt-5 grid gap-3 text-sm font-light text-yara-taupe">
            <Link to="/shop">Shop all</Link><Link to="/shop?category=Skincare">Bestsellers</Link><Link to="/shop?category=Gift%20Sets">Gift sets</Link><Link to="/about">Our story</Link>
          </div>
        </div>
        <div>
          <h3 className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.17em]">Customer care</h3>
          <div className="mt-5 grid gap-3 text-sm font-light text-yara-taupe">
            <Link to="/contact">Contact us</Link><Link to="/contact">Shipping policy</Link><Link to="/contact">Terms of service</Link><Link to="/contact">Privacy policy</Link>
          </div>
        </div>
        <div>
          <h3 className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.17em]">Newsletter</h3>
          <p className="mt-5 text-sm font-light leading-6 text-yara-taupe">Join our inner circle for early access to rituals and private offers.</p>
          <form className="mt-5 flex rounded-full bg-white/75 p-1" onSubmit={(event) => event.preventDefault()}>
            <input type="email" required placeholder="Email address" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-4 text-xs" />
            <button className="rounded-full bg-yara-wine p-3 text-white" aria-label="Join newsletter"><ArrowRight className="h-4 w-4" /></button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/60 py-6 text-center text-[0.65rem] uppercase tracking-[0.12em] text-yara-taupe">
        © {new Date().getFullYear()} YARA Productions. All rights reserved.
      </div>
    </footer>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: "instant" }), [pathname]);
  return null;
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>{children}</main>
      <Footer />
      <a
        href={createWhatsAppLink("Hello YARA, I would love help choosing my skincare ritual.")}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#20bd5a] text-white shadow-xl transition hover:-translate-y-1"
        aria-label="Chat with YARA on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </>
  );
}
