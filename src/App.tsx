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

function CountryGatedSite() {
  const { country } = useCountry();
  if (!country) return <CountryLanding />;

  const Router = window.location.protocol === "file:" ? HashRouter : BrowserRouter;

  return (
    <Router>
      <CatalogProvider><CartProvider>
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
      </CartProvider></CatalogProvider>
    </Router>
  );
}

export default function App() {
  return <CountryProvider><CountryGatedSite /></CountryProvider>;
}
