import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export const locales = ["en", "si", "ta", "ar"] as const;
export type Locale = (typeof locales)[number];
type Direction = "ltr" | "rtl";
type TranslationTree = {
  [key: string]: string | string[] | TranslationTree;
};

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  si: "සිං",
  ta: "தமிழ்",
  ar: "عربى",
};

const localeNames: Record<Locale, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
  ar: "العربية",
};

export const localeDirections: Record<Locale, Direction> = {
  en: "ltr",
  si: "ltr",
  ta: "ltr",
  ar: "rtl",
};

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

const en = {
  seo: {
    title: "YARA | Luxury Skincare",
    description:
      "Shop YARA luxury skincare with Sri Lanka and UAE pricing, secure checkout, and WhatsApp ordering.",
  },
  nav: {
    home: "Home",
    shop: "Shop",
    ingredients: "Ingredients",
    about: "About",
    contact: "Contact",
    cart: "Cart",
    language: "Language",
    shoppingBag: "Shopping bag with {count} items",
    changeCountry: "Change Country",
  },
  common: {
    shopNow: "Shop now",
    discoverStory: "Discover our story",
    exploreProducts: "Explore all products",
    addToCart: "Add to cart",
    addedToBag: "Added to bag",
    buyNow: "Buy now",
    whatsappOrder: "WhatsApp order",
    orderOnWhatsApp: "Order on WhatsApp",
    continueShopping: "Continue shopping",
    viewProduct: "View {name}",
    subscribe: "Subscribe",
    reviews: "reviews",
    quantity: "Qty",
    subtotal: "Subtotal",
    shipping: "Shipping",
    productTotal: "Product total",
    orderSummary: "Order Summary",
    confirmedWhenOrdering: "Confirmed when ordering",
    secureCheckout: "Secure checkout",
    countryWideDelivery: "Country-wide delivery",
    inStock: "In stock & ready to ship",
    securePayments: "Secure payments · Easy support · Thoughtful delivery",
    resetFilters: "Reset filters",
  },
  region: {
    sriLanka: "Sri Lanka",
    uae: "UAE / Dubai",
    sriLankaLabel: "Sri Lanka · LKR",
    uaeLabel: "UAE / Dubai · AED",
  },
  countryLanding: {
    eyebrow: "Your glow begins here",
    title: "Choose Your Country",
    description:
      "Select your country to continue shopping with the right prices and ordering options.",
    sriLankaDescription: "View products with LKR pricing.",
    uaeDescription: "View products with AED pricing.",
    sriLankaButton: "Continue to Sri Lanka",
    uaeButton: "Continue to UAE",
    footnote: "Luxury skincare, thoughtfully delivered",
  },
  layout: {
    footerText:
      "Modern skincare for the conscious soul. Merging high-science with the art of self-care.",
    explore: "Explore",
    shopAll: "Shop all",
    bestsellers: "Bestsellers",
    giftSets: "Gift sets",
    ourStory: "Our story",
    care: "Customer care",
    contactUs: "Contact us",
    shippingPolicy: "Shipping policy",
    terms: "Terms of service",
    privacy: "Privacy policy",
    newsletter: "Newsletter",
    newsletterText: "Join our inner circle for early access to products and private offers.",
    emailAddress: "Email address",
    joinNewsletter: "Join newsletter",
    rights: "All rights reserved.",
    chatHelp:
      "Hello YARA, I would love help choosing my skincare products.",
    chatLabel: "Chat with YARA on WhatsApp",
  },
  home: {
    heroEyebrow: "Premium skincare",
    heroTitle: "Reveal Your Natural Glow with",
    heroCopy:
      "Experience the fusion of clinical efficacy and botanical luxury. Expertly crafted for modern skin and inspired by intentional self-care.",
    vegan: "Vegan formulas",
    crueltyFree: "Cruelty-free",
    delivery: "Country-wide delivery",
    categoriesEyebrow: "Find your favorites",
    categoriesTitle: "Product Categories",
    categoriesCopy: "Tailored solutions for every concern, from cleansing to intensive care.",
    favoritesEyebrow: "Our favorites",
    favoritesTitle: "Best Sellers",
    standardEyebrow: "The YARA standard",
    standardTitle: "Science-Backed, Emotionally Nurtured.",
    standardCopy:
      "Every formula balances proven actives with sensorial botanicals because effective skincare should feel as beautiful as it performs.",
    approach: "Our approach",
    routineEyebrow: "Real routines, real radiance",
    routineTitle: "Loved by Skin Enthusiasts",
    followEyebrow: "Follow YARA",
    followUs: "Follow us",
    features: [
      "Brightening|Naturally derived actives that boost luminosity.",
      "Deep hydration|Multi-weight hydration for lasting comfort.",
      "Anti-aging|Peptides and retinoid alternatives for renewal.",
      "Clean formulas|Vegan, cruelty-free, and thoughtfully developed.",
    ],
  },
  shop: {
    eyebrow: "The YARA collection",
    title: "Shop YARA",
    copy: "Browse our complete collection and find the products that suit your skincare and beauty needs.",
    category: "Category",
    all: "All",
    concern: "Skin concern",
    innerCircle: "Join the Inner Circle",
    innerCircleCopy: "Early access to products and private offers.",
    resultsFor: "Results for “{query}”",
    showing: "Showing {count} product{plural}",
    filters: "Filters",
    sort: "Sort products",
    recommended: "Recommended",
    priceLow: "Price: Low to high",
    priceHigh: "Price: High to low",
    topRated: "Top rated",
    noProduct: "No product found",
    noProductCopy: "Try a different category or search phrase.",
    refine: "Refine products",
    viewProducts: "View {count} products",
    clearSearch: "Clear search",
  },
  product: {
    notFound: "Product not found",
    notFoundTitle: "This product has wandered off.",
    returnToShop: "Return to shop",
    addFavorite: "Add {name} to favorites",
    removeFavorite: "Remove {name} from favorites",
    addNamedToCart: "Add {name} to cart",
    vegan: "Vegan",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    benefits: "Benefits",
    howToUse: "How to use",
    ingredients: "Full ingredients",
    pairEyebrow: "Pair it beautifully",
    pairTitle: "Complete Your Routine",
  },
  cart: {
    emptyEyebrow: "Your favorites await",
    emptyTitle: "Your bag is beautifully empty.",
    emptyCopy: "Explore our formulas and find products that feel entirely your own.",
    discover: "Discover the collection",
    eyebrow: "Your selections",
    title: "Shopping Bag",
    remove: "Remove {name}",
  },
  checkout: {
    emptyEyebrow: "Nothing to check out yet",
    emptyTitle: "Your order starts in the shop.",
    browse: "Browse products",
    eyebrow: "Protected & private",
    title: "Secure Checkout",
    copy: "Completing your self-care journey",
    contact: "Contact Information",
    keepUpdated: "Keep me updated with exclusive products and offers",
    shippingAddress: "Shipping Address",
    firstName: "First name",
    lastName: "Last name",
    street: "Street address",
    city: "City",
    postal: "Postal code",
    phone: "Phone number",
    payment: "Payment Method",
    payhere: "Pay securely with PayHere",
    payhereCopy: "Card details are entered only on PayHere's secure hosted checkout.",
    cod: "Cash on delivery",
    preparing: "Preparing secure checkout...",
    confirm: "Confirm order",
    encrypted: "Encrypted checkout · Order support",
    error: "Unable to place order.",
  },
  about: {
    eyebrow: "The YARA story",
    title: "Beauty with purpose, made to inspire confidence.",
    copy:
      "YARA began with a desire to make premium personal care feel warm, attainable, and genuinely effective. What started in Sri Lanka has grown into a beauty community serving customers across Sri Lanka and the UAE.",
    explore: "Explore YARA",
    mission: "Our mission",
    missionTitle: "Help every customer feel seen, cared for, and radiant.",
    regionEyebrow: "Sri Lanka & UAE",
    regionTitle: "One YARA community, across two countries.",
    regionCopy:
      "Our dedicated Sri Lanka and UAE/Dubai ordering options make pricing and support clear for every customer. Wherever you shop with us, you receive the same care, quality, and attention.",
    promiseTitle: "Made with care. Shared with confidence.",
    promiseCopy: "Discover products created to make your everyday care feel beautifully considered.",
    values: [
      "Customer first|Thoughtful guidance and responsive support from discovery through delivery.",
      "Quality promise|Carefully developed products, dependable standards, and honest communication.",
      "Everyday confidence|Beautiful self-care designed to fit real lives and celebrate individual beauty.",
    ],
    regionPoints: [
      "Country-specific pricing",
      "Dedicated WhatsApp support",
      "Clear ordering assistance",
      "Trusted customer care",
    ],
  },
  ingredients: {
    eyebrow: "Ingredient education",
    title: "Know what cares for your skin.",
    copy:
      "We choose ingredients for a clear purpose: to cleanse gently, hydrate deeply, support the skin barrier, or improve the look of tone and texture.",
    keyEyebrow: "Key ingredients",
    keyTitle: "Purposeful care, ingredient by ingredient.",
    whyEyebrow: "Why YARA chooses them",
    whyTitle: "Every formula has a reason.",
    whyCopy:
      "Our approach combines effective skincare actives with supportive hydrators and botanicals. Each ingredient is selected for its role in the complete formula, not because it is fashionable.",
    cards: [
      "Saffron|Radiance & comfort|A treasured botanical known for antioxidant compounds that help support a brighter, refreshed appearance.",
      "Alpha Arbutin|Even-looking tone|A focused skincare active used to reduce the visible appearance of dark spots and uneven tone.",
      "Hyaluronic Acid|Lasting hydration|A moisture-binding ingredient that helps skin feel plump, supple, and comfortably hydrated.",
      "Rosehip Oil|Nourishment & glow|Naturally rich in skin-supporting lipids that soften dry-feeling skin and promote a healthy-looking glow.",
      "Aloe Vera|Soothing care|A gentle botanical used to comfort skin and support a calm, hydrated feel.",
      "Ceramides|Barrier support|Skin-identical lipids that help reinforce the moisture barrier and reduce feelings of dryness.",
    ],
    reasons: [
      "Focused ingredients selected for visible skincare benefits",
      "Hydration and barrier support balanced with active care",
      "Gentle textures designed for consistent use",
      "Clear guidance on how and when to use each product",
    ],
  },
  contact: {
    eyebrow: "Contact YARA",
    title: "We're here to help.",
    copy: "Reach our team for product questions, ordering support, delivery information, or general enquiries.",
    sriLankaWhatsApp: "Sri Lanka WhatsApp",
    uaeWhatsApp: "UAE / Dubai WhatsApp",
    email: "Email",
    sendEyebrow: "Send a message",
    sendTitle: "How can we help?",
    sent: "Thank you, your message is ready for our care team.",
    subject: "Subject",
    message: "Your message",
    send: "Send message",
    serving: "Serving customers in Sri Lanka and UAE / Dubai",
    helpMessage: "Hello YARA, I would like some help.",
    topics: [
      "Product question",
      "Order support",
      "Delivery information",
      "Wholesale enquiry",
      "General enquiry",
    ],
  },
  login: {
    remembered: "Your favorites, remembered",
    welcomeGlow: "Welcome back to your glow.",
    imageCopy: "Revisit your favorites, track orders, and make self-care beautifully simple.",
    circle: "The YARA circle",
    welcome: "Welcome Back",
    copy: "Sign in to continue shopping.",
    submitted:
      "Your sign-in request has been received. Connect this form to your preferred authentication service for live customer accounts.",
    password: "Password",
    yourPassword: "Your password",
    hide: "Hide password",
    show: "Show password",
    remember: "Remember me",
    forgot: "Forgot password?",
    signIn: "Sign in",
    new: "New to YARA?",
    create: "Create an account",
  },
  whatsapp: {
    greeting: "Hello YARA, I want to place an order.",
    country: "Country",
    currency: "Currency",
    products: "Products",
    product: "Product",
    quantity: "Quantity",
    price: "Price",
    total: "Total",
    name: "Name",
    phone: "Phone",
    address: "Address",
    paymentMethod: "Payment Method",
  },
} satisfies TranslationTree;

function mergeTree(base: TranslationTree, overrides: TranslationTree): TranslationTree {
  return { ...base, ...Object.fromEntries(Object.entries(overrides).map(([key, value]) => {
    const baseValue = base[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      return [key, mergeTree(baseValue, value)];
    }
    return [key, value];
  })) };
}

const si = mergeTree(en, {
  seo: {
    title: "YARA | සුඛෝපභෝගී සම සත්කාර",
    description: "ශ්‍රී ලංකා සහ UAE මිල ගණන්, ආරක්ෂිත checkout සහ WhatsApp ඇණවුම් සමඟ YARA සම සත්කාර මිලදී ගන්න.",
  },
  nav: { home: "මුල් පිටුව", shop: "වෙළඳසැල", ingredients: "අමුද්‍රව්‍ය", about: "අප ගැන", contact: "සම්බන්ධ වන්න", cart: "කරත්තය", language: "භාෂාව", changeCountry: "රට වෙනස් කරන්න", shoppingBag: "අයිතම {count}ක් සහිත කරත්තය" },
  common: { shopNow: "දැන් මිලදී ගන්න", discoverStory: "අපගේ කතාව", exploreProducts: "සියලු නිෂ්පාදන බලන්න", addToCart: "කරත්තයට එක් කරන්න", addedToBag: "කරත්තයට එක් විය", buyNow: "දැන් ගන්න", whatsappOrder: "WhatsApp ඇණවුම", orderOnWhatsApp: "WhatsApp හරහා ඇණවුම් කරන්න", continueShopping: "මිලදී ගැනීම දිගටම", viewProduct: "{name} බලන්න", subscribe: "දායක වන්න", reviews: "සමාලෝචන", quantity: "ප්‍රමාණය", subtotal: "උප එකතුව", shipping: "බෙදාහැරීම", productTotal: "නිෂ්පාදන එකතුව", orderSummary: "ඇණවුම් සාරාංශය", confirmedWhenOrdering: "ඇණවුම් කිරීමේදී තහවුරු කරයි", secureCheckout: "ආරක්ෂිත checkout", countryWideDelivery: "රට පුරා බෙදාහැරීම", inStock: "තොග ඇත", securePayments: "ආරක්ෂිත ගෙවීම් · පහසු සහාය · සත්කාරක බෙදාහැරීම", resetFilters: "පෙරහන් නැවත සකසන්න" },
  region: { sriLanka: "ශ්‍රී ලංකාව", uae: "UAE / ඩුබායි", sriLankaLabel: "ශ්‍රී ලංකාව · LKR", uaeLabel: "UAE / ඩුබායි · AED" },
  countryLanding: { eyebrow: "ඔබේ දීප්තිය මෙතැනින්", title: "ඔබේ රට තෝරන්න", description: "නිවැරදි මිල සහ ඇණවුම් විකල්ප සමඟ මිලදී ගැනීමට රට තෝරන්න.", sriLankaDescription: "LKR මිල සමඟ නිෂ්පාදන බලන්න.", uaeDescription: "AED මිල සමඟ නිෂ්පාදන බලන්න.", sriLankaButton: "ශ්‍රී ලංකාවට යන්න", uaeButton: "UAE වෙත යන්න", footnote: "සුඛෝපභෝගී සම සත්කාර, සත්කාරයෙන් බෙදාහැරේ" },
  shop: { eyebrow: "YARA එකතුව", title: "YARA මිලදී ගන්න", copy: "ඔබේ සම සත්කාර අවශ්‍යතා සඳහා සුදුසු නිෂ්පාදන සොයන්න.", category: "කාණ්ඩය", all: "සියල්ල", concern: "සම ගැටළුව", filters: "පෙරහන්", sort: "නිෂ්පාදන සකසන්න", recommended: "නිර්දේශිත", noProduct: "නිෂ්පාදනයක් හමු නොවීය", noProductCopy: "වෙනත් කාණ්ඩයක් හෝ සෙවුම් වචනයක් උත්සාහ කරන්න.", refine: "නිෂ්පාදන පෙරහන් කරන්න" },
  checkout: { title: "ආරක්ෂිත Checkout", contact: "සම්බන්ධතා තොරතුරු", shippingAddress: "බෙදාහැරීමේ ලිපිනය", firstName: "මුල් නම", lastName: "අවසන් නම", street: "වීදි ලිපිනය", city: "නගරය", postal: "තැපැල් කේතය", phone: "දුරකථන අංකය", payment: "ගෙවීම් ක්‍රමය", confirm: "ඇණවුම තහවුරු කරන්න", cod: "භාණ්ඩ ලැබුණු විට ගෙවීම" },
  whatsapp: { greeting: "Hello YARA, මට ඇණවුමක් කිරීමට අවශ්‍යයි.", country: "රට", currency: "මුදල් ඒකකය", products: "නිෂ්පාදන", quantity: "ප්‍රමාණය", price: "මිල", total: "එකතුව", name: "නම", phone: "දුරකථනය", address: "ලිපිනය" },
}) as TranslationTree;

const ta = mergeTree(en, {
  seo: { title: "YARA | ஆடம்பர சரும பராமரிப்பு", description: "இலங்கை மற்றும் UAE விலைகள், பாதுகாப்பான checkout, WhatsApp ஆர்டர் உடன் YARA சரும பராமரிப்பை வாங்குங்கள்." },
  nav: { home: "முகப்பு", shop: "கடை", ingredients: "மூலப்பொருட்கள்", about: "எங்களை பற்றி", contact: "தொடர்பு", cart: "கார்ட்", language: "மொழி", changeCountry: "நாட்டை மாற்று", shoppingBag: "{count} பொருட்களுடன் கார்ட்" },
  common: { shopNow: "இப்போது வாங்க", discoverStory: "எங்கள் கதை", exploreProducts: "அனைத்து பொருட்களும்", addToCart: "கார்ட்டில் சேர்க்க", addedToBag: "கார்ட்டில் சேர்க்கப்பட்டது", buyNow: "இப்போது வாங்க", whatsappOrder: "WhatsApp ஆர்டர்", orderOnWhatsApp: "WhatsApp-ல் ஆர்டர் செய்க", continueShopping: "வாங்கலை தொடர்க", viewProduct: "{name} பார்க்க", subscribe: "சந்தா", reviews: "மதிப்புரைகள்", quantity: "அளவு", subtotal: "துணை மொத்தம்", shipping: "டெலிவரி", productTotal: "பொருள் மொத்தம்", orderSummary: "ஆர்டர் சுருக்கம்", confirmedWhenOrdering: "ஆர்டர் செய்யும் போது உறுதி செய்யப்படும்", secureCheckout: "பாதுகாப்பான checkout", countryWideDelivery: "நாடு முழுவதும் டெலிவரி", inStock: "கையிருப்பில் உள்ளது", resetFilters: "வடிகட்டிகளை மீட்டமை" },
  region: { sriLanka: "இலங்கை", uae: "UAE / துபாய்", sriLankaLabel: "இலங்கை · LKR", uaeLabel: "UAE / துபாய் · AED" },
  countryLanding: { eyebrow: "உங்கள் பொலிவு இங்கே தொடங்குகிறது", title: "உங்கள் நாட்டை தேர்வுசெய்க", description: "சரியான விலை மற்றும் ஆர்டர் விருப்பங்களுடன் தொடர நாட்டை தேர்வுசெய்க.", sriLankaDescription: "LKR விலைகளுடன் பொருட்களைப் பார்க்கவும்.", uaeDescription: "AED விலைகளுடன் பொருட்களைப் பார்க்கவும்.", sriLankaButton: "இலங்கைக்கு தொடர்க", uaeButton: "UAE-க்கு தொடர்க", footnote: "ஆடம்பர சரும பராமரிப்பு, அக்கறையுடன் அனுப்பப்படும்" },
  shop: { eyebrow: "YARA தொகுப்பு", title: "YARA வாங்குங்கள்", copy: "உங்கள் சரும மற்றும் அழகு தேவைகளுக்கு பொருத்தமான பொருட்களைத் தேடுங்கள்.", category: "வகை", all: "அனைத்தும்", concern: "சரும கவலை", filters: "வடிகட்டிகள்", sort: "பொருட்களை வரிசைப்படுத்து", recommended: "பரிந்துரைக்கப்பட்டது", noProduct: "பொருள் கிடைக்கவில்லை", noProductCopy: "வேறு வகை அல்லது தேடல் சொல்லை முயற்சிக்கவும்.", refine: "பொருட்களை வடிகட்டு" },
  checkout: { title: "பாதுகாப்பான Checkout", contact: "தொடர்பு தகவல்", shippingAddress: "டெலிவரி முகவரி", firstName: "முதல் பெயர்", lastName: "கடைசி பெயர்", street: "வீதி முகவரி", city: "நகரம்", postal: "அஞ்சல் குறியீடு", phone: "தொலைபேசி எண்", payment: "கட்டண முறை", confirm: "ஆர்டரை உறுதி செய்க", cod: "டெலிவரியில் பணம்" },
  whatsapp: { greeting: "Hello YARA, நான் ஒரு ஆர்டர் செய்ய விரும்புகிறேன்.", country: "நாடு", currency: "நாணயம்", products: "பொருட்கள்", quantity: "அளவு", price: "விலை", total: "மொத்தம்", name: "பெயர்", phone: "தொலைபேசி", address: "முகவரி" },
}) as TranslationTree;

const ar = mergeTree(en, {
  seo: { title: "YARA | عناية فاخرة بالبشرة", description: "تسوقي عناية YARA بالبشرة مع أسعار سريلانكا والإمارات، ودفع آمن، وطلبات واتساب." },
  nav: { home: "الرئيسية", shop: "المتجر", ingredients: "المكونات", about: "من نحن", contact: "تواصل", cart: "السلة", language: "اللغة", changeCountry: "تغيير الدولة", shoppingBag: "سلة التسوق تحتوي على {count} عناصر" },
  common: { shopNow: "تسوقي الآن", discoverStory: "اكتشفي قصتنا", exploreProducts: "كل المنتجات", addToCart: "أضيفي إلى السلة", addedToBag: "تمت الإضافة", buyNow: "اشتري الآن", whatsappOrder: "طلب واتساب", orderOnWhatsApp: "اطلبي عبر واتساب", continueShopping: "متابعة التسوق", viewProduct: "عرض {name}", subscribe: "اشتراك", reviews: "تقييمات", quantity: "الكمية", subtotal: "المجموع الفرعي", shipping: "الشحن", productTotal: "إجمالي المنتجات", orderSummary: "ملخص الطلب", confirmedWhenOrdering: "يتم التأكيد عند الطلب", secureCheckout: "دفع آمن", countryWideDelivery: "توصيل داخل الدولة", inStock: "متوفر وجاهز للشحن", securePayments: "مدفوعات آمنة · دعم سهل · توصيل بعناية", resetFilters: "إعادة ضبط الفلاتر" },
  region: { sriLanka: "سريلانكا", uae: "الإمارات / دبي", sriLankaLabel: "سريلانكا · LKR", uaeLabel: "الإمارات / دبي · AED" },
  countryLanding: { eyebrow: "يبدأ تألقك هنا", title: "اختاري دولتك", description: "اختاري دولتك لمتابعة التسوق بالأسعار وخيارات الطلب المناسبة.", sriLankaDescription: "عرض المنتجات بأسعار LKR.", uaeDescription: "عرض المنتجات بأسعار AED.", sriLankaButton: "المتابعة إلى سريلانكا", uaeButton: "المتابعة إلى الإمارات", footnote: "عناية فاخرة بالبشرة، بتوصيل مدروس" },
  shop: { eyebrow: "مجموعة YARA", title: "تسوقي YARA", copy: "تصفحي مجموعتنا واختاري ما يناسب احتياجات بشرتك وجمالك.", category: "الفئة", all: "الكل", concern: "اهتمام البشرة", filters: "الفلاتر", sort: "ترتيب المنتجات", recommended: "موصى به", noProduct: "لم يتم العثور على منتج", noProductCopy: "جرّبي فئة أو عبارة بحث مختلفة.", refine: "تنقية المنتجات" },
  checkout: { title: "دفع آمن", contact: "معلومات التواصل", shippingAddress: "عنوان الشحن", firstName: "الاسم الأول", lastName: "اسم العائلة", street: "عنوان الشارع", city: "المدينة", postal: "الرمز البريدي", phone: "رقم الهاتف", payment: "طريقة الدفع", confirm: "تأكيد الطلب", cod: "الدفع عند الاستلام" },
  whatsapp: { greeting: "Hello YARA، أود تقديم طلب.", country: "الدولة", currency: "العملة", products: "المنتجات", quantity: "الكمية", price: "السعر", total: "الإجمالي", name: "الاسم", phone: "الهاتف", address: "العنوان" },
}) as TranslationTree;

const dictionaries: Record<Locale, TranslationTree> = { en, si, ta, ar };

function readValue(tree: TranslationTree, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as TranslationTree)[part];
  }, tree);
}

function interpolate(value: string, replacements: Record<string, string | number> = {}) {
  return Object.entries(replacements).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

export function translate(
  locale: Locale,
  key: string,
  replacements?: Record<string, string | number>,
) {
  const value = readValue(dictionaries[locale], key) ?? readValue(dictionaries.en, key);
  return interpolate(typeof value === "string" ? value : key, replacements);
}

export function translateList(locale: Locale, key: string) {
  const value = readValue(dictionaries[locale], key) ?? readValue(dictionaries.en, key);
  return Array.isArray(value) ? value : [];
}

interface I18nContextValue {
  locale: Locale;
  dir: Direction;
  localeName: string;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  list: (key: string) => string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dir = localeDirections[locale];
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir,
      localeName: localeNames[locale],
      t: (key, replacements) => translate(locale, key, replacements),
      list: (key) => translateList(locale, key),
    }),
    [dir, locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [dir, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within LocaleProvider");
  return context;
}

export function getLocalizedPath(locale: Locale, path: string, search = "", hash = "") {
  const normalizedPath = path === "/" ? "" : path;
  return `/${locale}${normalizedPath}${search}${hash}`;
}

export function getWhatsAppLabels(locale: Locale) {
  return {
    greeting: translate(locale, "whatsapp.greeting"),
    country: translate(locale, "whatsapp.country"),
    currency: translate(locale, "whatsapp.currency"),
    products: translate(locale, "whatsapp.products"),
    quantity: translate(locale, "whatsapp.quantity"),
    price: translate(locale, "whatsapp.price"),
    total: translate(locale, "whatsapp.total"),
    name: translate(locale, "whatsapp.name"),
    phone: translate(locale, "whatsapp.phone"),
    address: translate(locale, "whatsapp.address"),
  };
}
