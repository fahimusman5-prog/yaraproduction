"use client";

import { BrowserRouter, HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CartProvider } from "./context/CartContext";
import { AboutPage } from "./customer-pages/AboutPage";
import { CartPage } from "./customer-pages/CartPage";
import { CheckoutPage } from "./customer-pages/CheckoutPage";
import { ContactPage } from "./customer-pages/ContactPage";
import { HomePage } from "./customer-pages/HomePage";
import { LoginPage } from "./customer-pages/LoginPage";
import { AccountPage } from "./customer-pages/AccountPage";
import { ResetPasswordPage } from "./customer-pages/ResetPasswordPage";
import { ConfirmationPage } from "./customer-pages/ConfirmationPage";
import { ProductPage } from "./customer-pages/ProductPage";
import { ShopPage } from "./customer-pages/ShopPage";
import { SkinConcernPage } from "./customer-pages/SkinConcernPage";
import { CountryProvider, useCountry } from "./context/CountryContext";
import { CountryLanding } from "./components/CountryLanding";
import { IngredientsPage } from "./customer-pages/IngredientsPage";
import { CatalogProvider } from "./context/CatalogContext";
import { PrivacyPolicyPage } from "./customer-pages/PrivacyPolicyPage";
import { RefundPolicyPage } from "./customer-pages/RefundPolicyPage";
import { TermsAndConditionsPage } from "./customer-pages/TermsAndConditionsPage";
import { CancellationPolicyPage, CookiePolicyPage, PaymentPolicyPage, ShippingPolicyPage } from "./customer-pages/OperationalPolicyPages";
import { defaultLocale, isLocale, LocaleProvider, type Locale } from "./i18n";
import { useEffect, useState } from "react";
import { AnalyticsTracker } from "./components/AnalyticsTracker";

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
            <Route path="/skin-concerns/:slug" element={<SkinConcernPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/confirmation-error" element={<ConfirmationPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/return-policy" element={<RefundPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/terms-of-service" element={<TermsAndConditionsPage />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
            <Route path="/payment-policy" element={<PaymentPolicyPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
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

function AuthErrorFragmentHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorCode = params.get("error_code") ?? (params.get("error") === "access_denied" ? "access_denied" : null);
    if (!errorCode) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    navigate(`/auth/confirmation-error?code=${encodeURIComponent(errorCode)}`, { replace: true });
  }, [navigate]);
  return null;
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
          <AuthErrorFragmentHandler />
          <AnalyticsTracker />
          <CountryGatedSite />
        </Router>
      </CountryProvider>
    </LocaleProvider>
  );
}
