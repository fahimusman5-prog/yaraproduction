import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CartProvider } from "./context/CartContext";
import { AboutPage } from "./customer-pages/AboutPage";
import { CartPage } from "./customer-pages/CartPage";
import { CheckoutPage } from "./customer-pages/CheckoutPage";
import { ContactPage } from "./customer-pages/ContactPage";
import { HomePage } from "./customer-pages/HomePage";
import { LoginPage } from "./customer-pages/LoginPage";
import { ProductPage } from "./customer-pages/ProductPage";
import { ShopPage } from "./customer-pages/ShopPage";
import { CountryProvider, useCountry } from "./context/CountryContext";
import { CountryLanding } from "./components/CountryLanding";
import { IngredientsPage } from "./customer-pages/IngredientsPage";
import { CatalogProvider } from "./context/CatalogContext";
import { defaultLocale, isLocale, LocaleProvider, type Locale } from "./i18n";
import { useEffect, useState } from "react";

function CountryGatedSite() {
  const { country } = useCountry();
  return (
    <CatalogProvider><CartProvider>
      {!country ? <CountryLanding /> : (
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/ingredients" element={<IngredientsPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </CartProvider></CatalogProvider>
  );
}

function getInitialLocale(): Locale {
  if (window.location.protocol === "file:") return defaultLocale;

  const { pathname } = window.location;
  const [, firstSegment] = pathname.split("/");
  if (isLocale(firstSegment)) return firstSegment;
  return defaultLocale;
}

function hasLocalePath() {
  if (window.location.protocol === "file:") return true;
  return isLocale(window.location.pathname.split("/")[1]);
}

export default function App() {
  const Router = window.location.protocol === "file:" ? HashRouter : BrowserRouter;
  const [locale] = useState(getInitialLocale);
  const [localePathReady, setLocalePathReady] = useState(hasLocalePath);
  const routerProps = window.location.protocol === "file:" ? {} : { basename: `/${locale}` };

  useEffect(() => {
    if (localePathReady) return;
    const { pathname, search, hash } = window.location;
    const normalizedPath = pathname === "/" ? "" : pathname;
    window.history.replaceState(null, "", `/${defaultLocale}${normalizedPath}${search}${hash}`);
    setLocalePathReady(true);
  }, [localePathReady]);

  if (!localePathReady) return null;

  return (
    <LocaleProvider locale={locale}>
      <CountryProvider>
        <Router {...routerProps}>
          <CountryGatedSite />
        </Router>
      </CountryProvider>
    </LocaleProvider>
  );
}
