import type { Metadata } from "next";
import { createElement } from "react";
import { footerSocialLinks } from "./social-links";

export const SITE_ORIGIN = "https://www.yaraproduct.com";
export const SITE_NAME = "YARA Productions";
export const locales = ["en", "si", "ta", "ar"] as const;
export type SeoLocale = (typeof locales)[number];

const localizedHome: Record<SeoLocale, { title: string; description: string }> = {
  en: {
    title: "YARA Productions | Premium Skincare in Sri Lanka & UAE",
    description: "Shop premium YARA Productions skincare, beauty and herbal products in Sri Lanka and the UAE. Explore face care, body care, hair care and bestselling beauty essentials.",
  },
  si: { title: "YARA Productions | ශ්‍රී ලංකාවේ සහ UAE හි සම රැකවරණය", description: "YARA Productions හි සම රැකවරණ සහ රූපලාවන්‍ය නිෂ්පාදන ශ්‍රී ලංකාවට සහ UAE වෙත මිලදී ගන්න." },
  ta: { title: "YARA Productions | இலங்கை மற்றும் UAE தோல் பராமரிப்பு", description: "YARA Productions தோல் பராமரிப்பு மற்றும் அழகு சாதனங்களை இலங்கை மற்றும் UAE-யில் வாங்குங்கள்." },
  ar: { title: "YARA Productions | عناية بالبشرة في سريلانكا والإمارات", description: "تسوق منتجات YARA Productions للعناية بالبشرة والجمال في سريلانكا والإمارات." },
};

const pageNames: Record<string, Record<SeoLocale, { title: string; description: string }>> = {
  shop: {
    en: { title: "Shop YARA Skincare Products | Sri Lanka & UAE", description: "Explore YARA Productions skincare, beauty and herbal products with delivery options for Sri Lanka and the UAE." },
    si: { title: "YARA සම රැකවරණ නිෂ්පාදන මිලදී ගන්න", description: "ශ්‍රී ලංකාව සහ UAE සඳහා YARA Productions නිෂ්පාදන එකතුව බලන්න." },
    ta: { title: "YARA தோல் பராமரிப்பு பொருட்களை வாங்குங்கள்", description: "இலங்கை மற்றும் UAE-க்கான YARA Productions தயாரிப்புகளை ஆராயுங்கள்." },
    ar: { title: "تسوق منتجات YARA للعناية بالبشرة", description: "اكتشف منتجات YARA Productions للعناية بالبشرة والجمال مع خيارات التوصيل." },
  },
  about: {
    en: { title: "About Fazeena Farook | Founder of YARA Productions", description: "Discover Fazeena Farook’s journey of continuous learning, Ayurvedic study, entrepreneurship, and the growth of YARA Productions." },
    si: { title: "YARA Productions ගැන", description: "YARA Productions හි නවීන සම රැකවරණය සහ ස්වයං රැකවරණය පිළිබඳ දැනගන්න." },
    ta: { title: "YARA Productions பற்றி", description: "YARA Productions மற்றும் எங்கள் தோல் பராமரிப்பு அணுகுமுறையைப் பற்றி அறியுங்கள்." },
    ar: { title: "عن YARA Productions", description: "تعرف على YARA Productions ونهجنا في العناية بالبشرة والجمال." },
  },
  contact: {
    en: { title: "Contact YARA Productions | Sri Lanka & UAE", description: "Contact YARA Productions for skincare product support, delivery questions and customer care in Sri Lanka and the UAE." },
    si: { title: "YARA Productions අමතන්න", description: "YARA Productions සමඟ නිෂ්පාදන සහ පාරිභෝගික සහාය පිළිබඳ සම්බන්ධ වන්න." },
    ta: { title: "YARA Productions தொடர்பு", description: "YARA Productions வாடிக்கையாளர் ஆதரவு மற்றும் தயாரிப்பு கேள்விகளுக்கு தொடர்பு கொள்ளுங்கள்." },
    ar: { title: "تواصل مع YARA Productions", description: "تواصل مع YARA Productions للحصول على دعم المنتجات وخدمة العملاء." },
  },
  ingredients: {
    en: { title: "YARA Skincare Ingredients | YARA Productions", description: "Learn about the ingredients used across YARA Productions skincare and beauty products." },
    si: { title: "YARA සම රැකවරණ අමුද්‍රව්‍ය", description: "YARA Productions නිෂ්පාදනවල භාවිතා වන අමුද්‍රව්‍ය ගැන දැනගන්න." },
    ta: { title: "YARA தோல் பராமரிப்பு பொருட்களின் மூலப்பொருட்கள்", description: "YARA Productions தயாரிப்புகளில் பயன்படுத்தப்படும் மூலப்பொருட்களை அறியுங்கள்." },
    ar: { title: "مكونات منتجات YARA للعناية بالبشرة", description: "تعرف على المكونات المستخدمة في منتجات YARA Productions." },
  },
};

export function localizedAlternates(path: string) {
  return {
    canonical: `${SITE_ORIGIN}${path}`,
    languages: Object.fromEntries([
      ...locales.map((locale) => [locale, `${SITE_ORIGIN}/${locale}${path.replace(/^\/en(?=\/|$)/, "")}`]),
      ["x-default", `${SITE_ORIGIN}/en${path.replace(/^\/en(?=\/|$)/, "")}`],
    ]),
  };
}

export function pageMetadata(locale: SeoLocale, page: string, path: string): Metadata {
  const copy = page === "home" ? localizedHome[locale] : pageNames[page]?.[locale] ?? localizedHome[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: localizedAlternates(path),
    openGraph: { type: "website", siteName: SITE_NAME, title: copy.title, description: copy.description, url: `${SITE_ORIGIN}${path}`, images: [{ url: `${SITE_ORIGIN}/opengraph-image`, alt: "YARA Productions skincare" }] },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description, images: [`${SITE_ORIGIN}/opengraph-image`] },
    robots: { index: true, follow: true },
  };
}

export function privateMetadata(title: string): Metadata {
  return { title: `${title} | YARA Productions`, robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
}

export function organizationSchema() {
  const sameAs = footerSocialLinks.flatMap((link) =>
    typeof link.href === "string" && !link.href.includes("wa.me") ? [link.href] : [],
  );
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/icon`,
    sameAs,
    areaServed: ["Sri Lanka", "United Arab Emirates"],
    contactPoint: [
      { "@type": "ContactPoint", telephone: "+94 74 126 6855", contactType: "customer support", areaServed: "LK" },
      { "@type": "ContactPoint", telephone: "+971 54 370 2924", contactType: "customer support", areaServed: "AE" },
    ],
  };
}

export function websiteSchema() {
  return { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, alternateName: "YARA", url: SITE_ORIGIN };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) };
}

export function JsonLd({ data }: { data: unknown }) {
  return createElement("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, "\\u003c") } });
}
