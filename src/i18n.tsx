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
    mainNavigation: "Main navigation",
    mobileNavigation: "Mobile navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  common: {
    loading: "Loading YARA...",
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
    closeFilters: "Close filters",
  },
  catalog: {
    collection: "YARA Collection",
    uncategorized: "Uncategorized",
    beauty: "Beauty",
    unavailable: "Live inventory is temporarily unavailable.",
    directionsFallback: "See the product packaging for directions.",
    ingredientsFallback: "See the product packaging for the complete ingredient list.",
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
    followTitle: "On the Gram",
    followUs: "Follow us",
    heroAlt: "YARA skincare collection displayed on rose satin",
    skinAlt: "Healthy glowing skin",
    botanicalAlt: "Botanical skincare ingredients",
    instagramAlt: "YARA skincare inspiration {count}",
    testimonials: [
      "The Saffron Face Wash changed how my skin feels in the morning: clean, calm and never tight.|Elena V.",
      "I have never used a face wash that feels this luxurious. The saffron scent is subtle and dreamy.|Sienna J.",
      "The packaging is beautiful, but the glow is what keeps me coming back. Truly worth it.|Marcus L.",
    ],
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
    searchPlaceholder: "Search products",
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
    breadcrumb: "Breadcrumb",
    imageAlt: "{name} product image",
    galleryImage: "View product image {count}",
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
    emailPlaceholder: "you@example.com",
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
    customerCareAlt: "YARA customer care",
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
    imageAlt: "Woman with naturally radiant skin",
  },
  whatsapp: {
    greeting: "Hello YARA, I want to place an order.",
    newOrder: "New Order",
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
    notes: "Notes",
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

const fullSi = mergeTree(si, {
  nav: { mainNavigation: "ප්‍රධාන මෙනුව", mobileNavigation: "ජංගම මෙනුව", openMenu: "මෙනුව විවෘත කරන්න", closeMenu: "මෙනුව වසන්න" },
  common: { loading: "YARA පූරණය වේ...", closeFilters: "පෙරහන් වසන්න" },
  catalog: { collection: "YARA එකතුව", uncategorized: "වර්ගීකරණය නොකළ", beauty: "රූපලාවණ්‍ය", unavailable: "සජීවී තොග තොරතුරු තාවකාලිකව නොමැත.", directionsFallback: "භාවිතා කරන ආකාරය සඳහා නිෂ්පාදන ඇසුරුම බලන්න.", ingredientsFallback: "සම්පූර්ණ අමුද්‍රව්‍ය ලැයිස්තුව සඳහා නිෂ්පාදන ඇසුරුම බලන්න." },
  layout: { footerText: "සිතට සත්කාරක නවීන සම සත්කාර. උසස් විද්‍යාව සහ ස්වයං සත්කාර කලාව එකතු කරයි.", explore: "බලන්න", shopAll: "සියල්ල මිලදී ගන්න", bestsellers: "ජනප්‍රිය නිෂ්පාදන", giftSets: "තෑගි කට්ටල", ourStory: "අපගේ කතාව", care: "පාරිභෝගික සත්කාර", contactUs: "අප අමතන්න", shippingPolicy: "බෙදාහැරීමේ ප්‍රතිපත්තිය", terms: "සේවා කොන්දේසි", privacy: "පෞද්ගලිකත්ව ප්‍රතිපත්තිය", newsletter: "පුවත් ලිපිය", newsletterText: "නව නිෂ්පාදන සහ විශේෂ දීමනා මුලින්ම දැනගන්න.", emailAddress: "ඊමේල් ලිපිනය", joinNewsletter: "පුවත් ලිපියට එක් වන්න", rights: "සියලු හිමිකම් ඇවිරිණි.", chatHelp: "Hello YARA, මගේ සමට සුදුසු නිෂ්පාදන තෝරා ගැනීමට සහාය අවශ්‍යයි.", chatLabel: "WhatsApp හරහා YARA සමඟ කතා කරන්න" },
  home: { heroEyebrow: "ප්‍රිමියම් සම සත්කාර", heroTitle: "ඔබේ ස්වාභාවික දීප්තිය හෙළි කරන්න", heroCopy: "සායනික ප්‍රතිඵල සහ වෘක්ෂමය සුඛෝපභෝගය එක් කරන අත්දැකීමක්. නවීන සමට සහ අවධානයෙන් කරන ස්වයං සත්කාරයට නිර්මාණය කර ඇත.", vegan: "Vegan සූත්‍ර", crueltyFree: "සතුන්ට හානියක් නොකළ", delivery: "රට පුරා බෙදාහැරීම", categoriesEyebrow: "ඔබේ ප්‍රියතම දේ සොයන්න", categoriesTitle: "නිෂ්පාදන කාණ්ඩ", categoriesCopy: "පිරිසිදු කිරීමේ සිට ගැඹුරු සත්කාර දක්වා සෑම අවශ්‍යතාවකටම විසඳුම්.", favoritesEyebrow: "අපගේ ප්‍රියතම", favoritesTitle: "වැඩියෙන් අලෙවි වන", standardEyebrow: "YARA ප්‍රමිතිය", standardTitle: "විද්‍යාත්මක සහ මෘදු සත්කාරයෙන් පෝෂිතයි.", standardCopy: "සෑම සූත්‍රයක්ම සනාථ කළ ක්‍රියාකාරී අමුද්‍රව්‍ය සහ සුවඳවත් වෘක්ෂමය සත්කාර සමබර කරයි. ප්‍රතිඵලදායී සම සත්කාරය එය කරන තරමටම ලස්සනව දැනිය යුතුය.", approach: "අපගේ ප්‍රවේශය", routineEyebrow: "සැබෑ රූටීන්, සැබෑ දීප්තිය", routineTitle: "සම සත්කාර රසිකයන්ගේ ආදරය", followEyebrow: "YARA අනුගමනය කරන්න", followTitle: "Gram මත", followUs: "අප අනුගමනය කරන්න", heroAlt: "රෝස සැටින් මත දැක්වෙන YARA සම සත්කාර එකතුව", skinAlt: "සෞඛ්‍යමත් දීප්තිමත් සම", botanicalAlt: "වෘක්ෂමය සම සත්කාර අමුද්‍රව්‍ය", instagramAlt: "YARA සම සත්කාර ආශ්වාදය {count}", features: ["දීප්තිය|දීප්තිය වැඩි කරන ස්වාභාවික අමුද්‍රව්‍ය.", "ගැඹුරු තෙතමනය|දිගු කාලීන සුවපහසුවට බහු-බර hydration.", "වයසට එරෙහි සත්කාර|නවීකරණයට peptides සහ retinoid විකල්ප.", "පිරිසිදු සූත්‍ර|Vegan, cruelty-free සහ අවධානයෙන් සංවර්ධනය කළ."], testimonials: ["Saffron Face Wash භාවිතා කළ පසු උදෑසන මගේ සම පිරිසිදු, සන්සුන් සහ කිසිදා තද නොවන ලෙස දැනුණා.|එලේනා V.", "මෙතරම් සුඛෝපභෝගී ලෙස දැනෙන face wash එකක් මම භාවිතා කර නැහැ. saffron සුවඳ මෘදුයි.|සියෙනා J.", "ඇසුරුම ලස්සනයි, නමුත් මාව නැවත ගෙන එන්නේ ඒ දීප්තියයි. ඇත්තටම වටිනවා.|මාකස් L."] },
  shop: { innerCircle: "Inner Circle වෙත එක් වන්න", innerCircleCopy: "නව නිෂ්පාදන සහ විශේෂ දීමනා කලින්ම.", resultsFor: "“{query}” සඳහා ප්‍රතිඵල", showing: "නිෂ්පාදන {count}ක් පෙන්වයි", priceLow: "මිල: අඩු සිට වැඩි", priceHigh: "මිල: වැඩි සිට අඩු", topRated: "ඉහළම ශ්‍රේණිගත", viewProducts: "නිෂ්පාදන {count}ක් බලන්න", clearSearch: "සෙවුම ඉවත් කරන්න", searchPlaceholder: "නිෂ්පාදන සොයන්න" },
  product: { notFound: "නිෂ්පාදනය හමු නොවීය", notFoundTitle: "මෙම නිෂ්පාදනය හමු නොවේ.", returnToShop: "වෙළඳසැලට ආපසු", addFavorite: "{name} ප්‍රියතමවලට එක් කරන්න", removeFavorite: "{name} ප්‍රියතමවලින් ඉවත් කරන්න", addNamedToCart: "{name} කරත්තයට එක් කරන්න", vegan: "Vegan", decrease: "ප්‍රමාණය අඩු කරන්න", increase: "ප්‍රමාණය වැඩි කරන්න", benefits: "ප්‍රතිලාභ", howToUse: "භාවිතා කරන ආකාරය", ingredients: "සම්පූර්ණ අමුද්‍රව්‍ය", pairEyebrow: "එකට හොඳින් ගැලපේ", pairTitle: "ඔබේ රූටීන් සම්පූර්ණ කරන්න", breadcrumb: "මාර්ග සටහන", imageAlt: "{name} නිෂ්පාදන රූපය", galleryImage: "නිෂ්පාදන රූපය {count} බලන්න" },
  cart: { emptyEyebrow: "ඔබේ ප්‍රියතම දේ බලා සිටී", emptyTitle: "ඔබේ බෑගය තවම හිස්යි.", emptyCopy: "අපගේ සූත්‍ර බලන්න, ඔබටම ගැලපෙන නිෂ්පාදන සොයා ගන්න.", discover: "එකතුව බලන්න", eyebrow: "ඔබේ තේරීම්", title: "මිලදී ගැනීමේ බෑගය", remove: "{name} ඉවත් කරන්න" },
  checkout: { emptyEyebrow: "checkout කිරීමට තව කිසිවක් නැත", emptyTitle: "ඔබේ ඇණවුම වෙළඳසැලෙන් ආරම්භ වේ.", browse: "නිෂ්පාදන බලන්න", eyebrow: "ආරක්ෂිත සහ පුද්ගලික", copy: "ඔබේ ස්වයං සත්කාර ගමන සම්පූර්ණ කරමින්", keepUpdated: "විශේෂ නිෂ්පාදන සහ දීමනා ගැන මට දැනුම් දෙන්න", payhere: "PayHere හරහා ආරක්ෂිතව ගෙවන්න", payhereCopy: "කාඩ් විස්තර PayHere ආරක්ෂිත hosted checkout තුළ පමණක් ඇතුළත් කරයි.", preparing: "ආරක්ෂිත checkout සූදානම් වේ...", encrypted: "සංකේතනය කළ checkout · ඇණවුම් සහාය", error: "ඇණවුම තැබිය නොහැක.", emailPlaceholder: "you@example.com" },
  about: { eyebrow: "YARA කතාව", title: "විශ්වාසය ඇති කරන අරමුණක් සහිත රූපලාවණ්‍යය.", copy: "YARA ආරම්භ වූයේ ප්‍රිමියම් පෞද්ගලික සත්කාර උණුසුම්, ලඟාවිය හැකි සහ සත්‍ය ප්‍රතිඵලදායී කිරීමට ඇති ආශාවෙන්. ශ්‍රී ලංකාවෙන් ආරම්භ වූ එය දැන් ශ්‍රී ලංකාව සහ UAE පාරිභෝගිකයන්ට සේවය කරන රූපලාවණ්‍ය ප්‍රජාවක් වී ඇත.", explore: "YARA බලන්න", mission: "අපගේ මෙහෙවර", missionTitle: "සෑම පාරිභෝගිකයෙකුටම සැලකිල්ල සහ දීප්තිය දැනෙන්න සලස්වන්න.", regionEyebrow: "ශ්‍රී ලංකාව සහ UAE", regionTitle: "රටවල් දෙකක් පුරා එකම YARA ප්‍රජාව.", regionCopy: "ශ්‍රී ලංකා සහ UAE/Dubai ඇණවුම් විකල්ප පාරිභෝගිකයන්ට මිල සහ සහාය පැහැදිලි කරයි. ඔබ කොතැනින් මිලදී ගත්තත් එකම සත්කාරය, ගුණාත්මකභාවය සහ අවධානය ලැබේ.", promiseTitle: "සැලකිල්ලෙන් නිමවා, විශ්වාසයෙන් බෙදාගන්න.", promiseCopy: "ඔබේ දෛනික සත්කාරය ලස්සනව සිතා බැලූ බව දැනෙන නිෂ්පාදන සොයාගන්න.", values: ["පාරිභෝගිකයා ප්‍රථමයෙන්|තෝරා ගැනීමේ සිට බෙදාහැරීම දක්වා සැලකිලිමත් මගපෙන්වීම සහ ඉක්මන් සහාය.", "ගුණාත්මක පොරොන්දුව|සැලකිල්ලෙන් සංවර්ධනය කළ නිෂ්පාදන, විශ්වාසදායක ප්‍රමිතීන් සහ අවංක සන්නිවේදනය.", "දෛනික විශ්වාසය|සැබෑ ජීවිතයට ගැලපෙන සහ පුද්ගලික ලස්සන සමරන ස්වයං සත්කාර."], regionPoints: ["රට අනුව මිල", "විශේෂ WhatsApp සහාය", "පැහැදිලි ඇණවුම් සහාය", "විශ්වාසදායක පාරිභෝගික සත්කාර"] },
  ingredients: { eyebrow: "අමුද්‍රව්‍ය දැනුම", title: "ඔබේ සමට සත්කාර කරන දේ දැනගන්න.", copy: "අපි අමුද්‍රව්‍ය තෝරන්නේ පැහැදිලි අරමුණකටයි: මෘදු පිරිසිදු කිරීම, ගැඹුරු තෙතමනය, සම barrier සහාය හෝ tone සහ texture දෘශ්‍ය ලෙස වැඩිදියුණු කිරීම.", keyEyebrow: "ප්‍රධාන අමුද්‍රව්‍ය", keyTitle: "අමුද්‍රව්‍යෙන් අමුද්‍රව්‍යයට අරමුණු සහිත සත්කාර.", whyEyebrow: "YARA ඒවා තෝරන්නේ ඇයි", whyTitle: "සෑම සූත්‍රයකටම හේතුවක් ඇත.", whyCopy: "අපගේ ප්‍රවේශය ප්‍රතිඵලදායී skincare actives, hydration සහ botanicals සමඟ එක් කරයි. එක් එක් අමුද්‍රව්‍ය තෝරාගන්නේ සම්පූර්ණ සූත්‍රයේ එහි කාර්යය නිසාය.", cards: ["Saffron|දීප්තිය සහ සුවපහසුව|දීප්තිමත්, නැවුම් පෙනුමකට සහාය දෙන antioxidant සංයෝග සඳහා අගය කරන botanical අමුද්‍රව්‍යයකි.", "Alpha Arbutin|සමාන පෙනෙන tone|dark spots සහ uneven tone දෘශ්‍ය ලෙස අඩු කිරීමට භාවිතා කරන skincare active එකකි.", "Hyaluronic Acid|දිගු hydration|සම පිරුණු, මෘදු සහ සුවපහසු තෙතමනයක් දැනීමට උදව් කරන moisture-binding අමුද්‍රව්‍යයකි.", "Rosehip Oil|පෝෂණය සහ දීප්තිය|වියළි බව අඩු කර සෞඛ්‍යමත් දීප්තියකට සහාය දෙන skin-supporting lipids වලින් ස්වාභාවිකව පොහොසත්.", "Aloe Vera|සන්සුන් සත්කාර|සම සන්සුන් කර hydrated හැඟීමකට සහාය දෙන මෘදු botanical අමුද්‍රව්‍යයක්.", "Ceramides|Barrier සහාය|තෙතමනය barrier ශක්තිමත් කර වියළි බව අඩු කිරීමට සහාය දෙන skin-identical lipids."], reasons: ["දෘශ්‍ය skincare ප්‍රතිලාභ සඳහා තෝරාගත් අමුද්‍රව්‍ය", "active care සමඟ hydration සහ barrier සහාය සමබරයි", "අඛණ්ඩ භාවිතයට නිර්මාණය කළ මෘදු textures", "භාවිතා කරන ආකාරය සහ වේලාව ගැන පැහැදිලි මගපෙන්වීම"] },
  contact: { eyebrow: "YARA අමතන්න", title: "ඔබට උදව් කිරීමට අපි මෙහි සිටිමු.", copy: "නිෂ්පාදන ප්‍රශ්න, ඇණවුම් සහාය, බෙදාහැරීමේ තොරතුරු හෝ සාමාන්‍ය විමසීම් සඳහා අපගේ කණ්ඩායම අමතන්න.", sriLankaWhatsApp: "ශ්‍රී ලංකා WhatsApp", uaeWhatsApp: "UAE / Dubai WhatsApp", email: "ඊමේල්", sendEyebrow: "පණිවිඩයක් යවන්න", sendTitle: "අපි කොහොමද උදව් කරන්නෙ?", sent: "ස්තුතියි, ඔබේ පණිවිඩය අපගේ සත්කාර කණ්ඩායමට සූදානම්.", subject: "විෂය", message: "ඔබේ පණිවිඩය", send: "පණිවිඩය යවන්න", serving: "ශ්‍රී ලංකාව සහ UAE / Dubai පාරිභෝගිකයන්ට සේවය කරයි", helpMessage: "Hello YARA, මට උදව් අවශ්‍යයි.", customerCareAlt: "YARA පාරිභෝගික සත්කාර", topics: ["නිෂ්පාදන ප්‍රශ්නය", "ඇණවුම් සහාය", "බෙදාහැරීමේ තොරතුරු", "තොග විමසීම", "සාමාන්‍ය විමසීම"] },
  login: { remembered: "ඔබේ ප්‍රියතම දේ මතක තබා ගන්න", welcomeGlow: "ඔබේ දීප්තියට නැවත සාදරයෙන්.", imageCopy: "ඔබේ ප්‍රියතම දේ බලන්න, ඇණවුම් අනුගමනය කරන්න, ස්වයං සත්කාරය පහසු කරන්න.", circle: "YARA වටය", welcome: "නැවත සාදරයෙන්", copy: "මිලදී ගැනීම දිගටම කරගෙන යාමට sign in වන්න.", submitted: "ඔබේ sign-in ඉල්ලීම ලැබී ඇත. සජීවී customer accounts සඳහා මෙම පෝරමය ඔබ කැමති authentication සේවාවට සම්බන්ධ කරන්න.", password: "මුරපදය", yourPassword: "ඔබේ මුරපදය", hide: "මුරපදය සඟවන්න", show: "මුරපදය පෙන්වන්න", remember: "මාව මතක තබා ගන්න", forgot: "මුරපදය අමතකද?", signIn: "Sign in", new: "YARA වෙත අලුත්ද?", create: "ගිණුමක් සාදන්න", imageAlt: "ස්වාභාවික දීප්තියක් සහිත කාන්තාව" },
  whatsapp: { greeting: "Hello YARA, මට ඇණවුමක් කිරීමට අවශ්‍යයි.", newOrder: "නව ඇණවුම", product: "නිෂ්පාදනය", paymentMethod: "ගෙවීම් ක්‍රමය", notes: "සටහන්" },
}) as TranslationTree;

const fullTa = mergeTree(ta, {
  nav: { mainNavigation: "முக்கிய வழிசெலுத்தல்", mobileNavigation: "மொபைல் வழிசெலுத்தல்", openMenu: "மெனுவை திற", closeMenu: "மெனுவை மூடு" },
  common: { loading: "YARA ஏற்றப்படுகிறது...", securePayments: "பாதுகாப்பான கட்டணம் · எளிய உதவி · அக்கறையான டெலிவரி", closeFilters: "வடிகட்டிகளை மூடு" },
  catalog: { collection: "YARA தொகுப்பு", uncategorized: "வகைப்படுத்தப்படாதது", beauty: "அழகு", unavailable: "நேரடி கையிருப்பு தகவல் தற்காலிகமாக கிடைக்கவில்லை.", directionsFallback: "பயன்பாட்டு வழிமுறைகளுக்கு பொருள் பொதியைப் பார்க்கவும்.", ingredientsFallback: "முழு மூலப்பொருள் பட்டியலுக்கு பொருள் பொதியைப் பார்க்கவும்." },
  layout: { footerText: "அறிந்த மனதிற்கான நவீன சரும பராமரிப்பு. உயர் அறிவியலையும் சுய பராமரிப்பு கலையையும் இணைக்கிறது.", explore: "ஆராயுங்கள்", shopAll: "அனைத்தையும் வாங்குங்கள்", bestsellers: "அதிகம் விற்கப்படும்", giftSets: "பரிசு தொகுப்புகள்", ourStory: "எங்கள் கதை", care: "வாடிக்கையாளர் பராமரிப்பு", contactUs: "தொடர்பு கொள்ளுங்கள்", shippingPolicy: "டெலிவரி கொள்கை", terms: "சேவை விதிமுறைகள்", privacy: "தனியுரிமை கொள்கை", newsletter: "செய்திமடல்", newsletterText: "புதிய பொருட்கள் மற்றும் தனிப்பட்ட சலுகைகளை முன்கூட்டியே பெறுங்கள்.", emailAddress: "மின்னஞ்சல் முகவரி", joinNewsletter: "செய்திமடலில் சேருங்கள்", rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.", chatHelp: "Hello YARA, எனக்கான சரும பராமரிப்பு பொருட்களை தேர்வு செய்ய உதவி வேண்டும்.", chatLabel: "WhatsApp-ல் YARA-வுடன் பேசுங்கள்" },
  home: { heroEyebrow: "பிரீமியம் சரும பராமரிப்பு", heroTitle: "உங்கள் இயல்பான பொலிவை வெளிப்படுத்துங்கள்", heroCopy: "மருத்துவ திறனும் தாவர ஆடம்பரமும் இணையும் அனுபவம். நவீன சருமத்திற்கும் கவனமான சுய பராமரிப்பிற்கும் உருவாக்கப்பட்டது.", vegan: "Vegan சூத்திரங்கள்", crueltyFree: "விலங்குகளுக்கு தீங்கு இல்லாதது", delivery: "நாடு முழுவதும் டெலிவரி", categoriesEyebrow: "உங்கள் விருப்பங்களை கண்டுபிடிக்கவும்", categoriesTitle: "பொருள் வகைகள்", categoriesCopy: "சுத்திகரிப்பிலிருந்து தீவிர பராமரிப்பு வரை ஒவ்வொரு தேவைக்கும் தீர்வுகள்.", favoritesEyebrow: "எங்கள் விருப்பங்கள்", favoritesTitle: "அதிகம் விரும்பப்படும்", standardEyebrow: "YARA தரம்", standardTitle: "அறிவியலால் ஆதரித்து, மென்மையாக பராமரிக்கப்பட்டது.", standardCopy: "ஒவ்வொரு சூத்திரமும் நிரூபிக்கப்பட்ட actives மற்றும் உணர்வூட்டும் botanicals ஆகியவற்றை சமநிலைப்படுத்துகிறது. பயனுள்ள சரும பராமரிப்பு அதன் செயல்பாட்டைப் போலவே அழகாக உணர வேண்டும்.", approach: "எங்கள் அணுகுமுறை", routineEyebrow: "உண்மையான routines, உண்மையான பொலிவு", routineTitle: "சரும ஆர்வலர்கள் விரும்பியது", followEyebrow: "YARA-வை பின்தொடருங்கள்", followTitle: "Gram-ல்", followUs: "பின்தொடருங்கள்", heroAlt: "ரோஜா satin மீது வைக்கப்பட்ட YARA சரும பராமரிப்பு தொகுப்பு", skinAlt: "ஆரோக்கியமான பொலிவு மிக்க சருமம்", botanicalAlt: "தாவர சரும பராமரிப்பு மூலப்பொருட்கள்", instagramAlt: "YARA சரும பராமரிப்பு ஊக்கம் {count}", features: ["பொலிவு|ஒளிர்வை உயர்த்தும் இயற்கை சார்ந்த actives.", "ஆழமான hydration|நீடித்த சுகத்திற்கான பல-எடை hydration.", "வயதைக் குறைக்கும் பராமரிப்பு|புதுப்பிப்பிற்கான peptides மற்றும் retinoid மாற்றுகள்.", "சுத்தமான சூத்திரங்கள்|Vegan, cruelty-free, கவனமாக உருவாக்கப்பட்டது."], testimonials: ["Saffron Face Wash என் காலை சரும உணர்வை மாற்றியது: சுத்தம், அமைதி, இறுக்கம் இல்லை.|எலெனா V.", "இவ்வளவு ஆடம்பரமாக உணரும் face wash நான் பயன்படுத்தியதில்லை. saffron மணம் மென்மையாக உள்ளது.|சியன்னா J.", "பேக்கேஜிங் அழகாக உள்ளது, ஆனால் அந்த பொலிவே என்னை மீண்டும் வரவைக்கிறது. உண்மையில் மதிப்புள்ளது.|மார்கஸ் L."] },
  shop: { innerCircle: "Inner Circle-ல் சேருங்கள்", innerCircleCopy: "புதிய பொருட்கள் மற்றும் தனிப்பட்ட சலுகைகளை முன்கூட்டியே பெறுங்கள்.", resultsFor: "“{query}” க்கான முடிவுகள்", showing: "{count} பொருட்கள் காட்டப்படுகின்றன", priceLow: "விலை: குறைவிலிருந்து அதிகம்", priceHigh: "விலை: அதிகத்திலிருந்து குறைவு", topRated: "உயர் மதிப்பீடு", viewProducts: "{count} பொருட்களைப் பார்க்க", clearSearch: "தேடலை நீக்கு", searchPlaceholder: "பொருட்களை தேடுங்கள்" },
  product: { notFound: "பொருள் கிடைக்கவில்லை", notFoundTitle: "இந்த பொருள் தற்போது கிடைக்கவில்லை.", returnToShop: "கடைக்கு திரும்பு", addFavorite: "{name} விருப்பங்களில் சேர்க்க", removeFavorite: "{name} விருப்பங்களில் இருந்து நீக்கு", addNamedToCart: "{name} கார்ட்டில் சேர்க்க", vegan: "Vegan", decrease: "அளவை குறை", increase: "அளவை அதிகரி", benefits: "நன்மைகள்", howToUse: "பயன்படுத்தும் முறை", ingredients: "முழு மூலப்பொருட்கள்", pairEyebrow: "அழகாக இணைக்கவும்", pairTitle: "உங்கள் Routine-ஐ முடிக்கவும்", breadcrumb: "வழித்தடம்", imageAlt: "{name} பொருள் படம்", galleryImage: "பொருள் படம் {count} பார்க்க" },
  cart: { emptyEyebrow: "உங்கள் விருப்பங்கள் காத்திருக்கின்றன", emptyTitle: "உங்கள் பை அழகாக காலியாக உள்ளது.", emptyCopy: "எங்கள் சூத்திரங்களை ஆராய்ந்து உங்களுக்கான பொருட்களை கண்டுபிடிக்கவும்.", discover: "தொகுப்பை பாருங்கள்", eyebrow: "உங்கள் தேர்வுகள்", title: "ஷாப்பிங் பை", remove: "{name} நீக்கு" },
  checkout: { emptyEyebrow: "Checkout செய்ய இன்னும் எதுவும் இல்லை", emptyTitle: "உங்கள் ஆர்டர் கடையில் தொடங்குகிறது.", browse: "பொருட்களை பார்க்க", eyebrow: "பாதுகாப்பானதும் தனிப்பட்டதும்", copy: "உங்கள் சுய பராமரிப்பு பயணத்தை முடிக்கிறது", keepUpdated: "சிறப்பு பொருட்கள் மற்றும் சலுகைகள் பற்றி எனக்கு தெரிவிக்கவும்", payhere: "PayHere மூலம் பாதுகாப்பாக செலுத்துங்கள்", payhereCopy: "கார்டு விவரங்கள் PayHere-ன் பாதுகாப்பான hosted checkout-ல் மட்டுமே உள்ளிடப்படும்.", preparing: "பாதுகாப்பான checkout தயார் செய்யப்படுகிறது...", encrypted: "குறியாக்கப்பட்ட checkout · ஆர்டர் உதவி", error: "ஆர்டர் செய்ய முடியவில்லை.", emailPlaceholder: "you@example.com" },
  about: { eyebrow: "YARA கதை", title: "நம்பிக்கையை ஊக்குவிக்கும் நோக்கமுள்ள அழகு.", copy: "பிரீமியம் தனிப்பட்ட பராமரிப்பை வெப்பமாகவும் எளிதில் அணுகக்கூடியதாகவும் உண்மையில் பயனுள்ளதாகவும் மாற்ற வேண்டும் என்ற ஆசையிலிருந்து YARA தொடங்கியது. இலங்கையில் தொடங்கியது இப்போது இலங்கை மற்றும் UAE வாடிக்கையாளர்களுக்கு சேவை செய்யும் அழகு சமூகமாக வளர்ந்துள்ளது.", explore: "YARA-வை ஆராயுங்கள்", mission: "எங்கள் நோக்கம்", missionTitle: "ஒவ்வொரு வாடிக்கையாளரும் கவனிக்கப்பட்டதாகவும் பொலிவாகவும் உணர உதவுதல்.", regionEyebrow: "இலங்கை மற்றும் UAE", regionTitle: "இரண்டு நாடுகளில் ஒரு YARA சமூகமே.", regionCopy: "இலங்கை மற்றும் UAE/Dubai ஆர்டர் விருப்பங்கள் ஒவ்வொரு வாடிக்கையாளருக்கும் விலையும் உதவியும் தெளிவாக இருக்க செய்கின்றன. எங்கிருந்தும் வாங்கினாலும் அதே கவனம், தரம் மற்றும் அக்கறை கிடைக்கும்.", promiseTitle: "அக்கறையுடன் உருவாக்கி, நம்பிக்கையுடன் பகிரப்பட்டது.", promiseCopy: "உங்கள் தினசரி பராமரிப்பை அழகாக சிந்திக்கப்பட்டதாக உணர செய்யும் பொருட்களை கண்டுபிடியுங்கள்.", values: ["வாடிக்கையாளர் முதலில்|கண்டுபிடிப்பிலிருந்து டெலிவரி வரை சிந்தனையுடன் வழிகாட்டலும் பதிலளிக்கும் உதவியும்.", "தர வாக்குறுதி|கவனமாக உருவாக்கப்பட்ட பொருட்கள், நம்பகமான தரநிலைகள், நேர்மையான தொடர்பு.", "தினசரி நம்பிக்கை|உண்மையான வாழ்க்கைக்கு ஏற்ற, தனிப்பட்ட அழகை கொண்டாடும் சுய பராமரிப்பு."], regionPoints: ["நாடு சார்ந்த விலை", "அர்ப்பணிக்கப்பட்ட WhatsApp உதவி", "தெளிவான ஆர்டர் வழிகாட்டல்", "நம்பகமான வாடிக்கையாளர் பராமரிப்பு"] },
  ingredients: { eyebrow: "மூலப்பொருள் கல்வி", title: "உங்கள் சருமத்தை பராமரிப்பதை அறியுங்கள்.", copy: "மென்மையாக சுத்தம் செய்ய, ஆழமாக hydration தர, skin barrier-ஐ ஆதரிக்க அல்லது tone மற்றும் texture தோற்றத்தை மேம்படுத்த தெளிவான நோக்கத்துடன் மூலப்பொருட்களை தேர்வு செய்கிறோம்.", keyEyebrow: "முக்கிய மூலப்பொருட்கள்", keyTitle: "ஒவ்வொரு மூலப்பொருளிலும் நோக்கமுள்ள பராமரிப்பு.", whyEyebrow: "YARA ஏன் அவற்றை தேர்வு செய்கிறது", whyTitle: "ஒவ்வொரு சூத்திரத்திற்கும் காரணம் உள்ளது.", whyCopy: "எங்கள் அணுகுமுறை பயனுள்ள skincare actives, hydration மற்றும் botanicals ஆகியவற்றை இணைக்கிறது. ஒவ்வொரு மூலப்பொருளும் முழு சூத்திரத்தில் அதன் பங்கிற்காக தேர்வு செய்யப்படுகிறது.", cards: ["Saffron|பொலிவு மற்றும் சுகம்|ஒளிமயமான, புத்துணர்ச்சியான தோற்றத்திற்கு உதவும் antioxidant சேர்மங்களுக்கு மதிப்பிடப்படும் botanical.", "Alpha Arbutin|சீரான tone|dark spots மற்றும் uneven tone தோற்றத்தை குறைக்க பயன்படுத்தப்படும் skincare active.", "Hyaluronic Acid|நீடித்த hydration|சருமம் நிறைவாகவும் மென்மையாகவும் hydrated ஆகவும் உணர உதவும் moisture-binding மூலப்பொருள்.", "Rosehip Oil|ஊட்டம் மற்றும் பொலிவு|வறண்ட உணர்வை மென்மையாக்கி ஆரோக்கியமான பொலிவை ஊக்குவிக்கும் skin-supporting lipids நிறைந்தது.", "Aloe Vera|அமைதியான பராமரிப்பு|சருமத்தை அமைதிப்படுத்தி hydrated உணர்வை ஆதரிக்கும் மென்மையான botanical.", "Ceramides|Barrier ஆதரவு|moisture barrier-ஐ பலப்படுத்தி வறட்சியை குறைக்க உதவும் skin-identical lipids."], reasons: ["தோன்றும் skincare நன்மைகளுக்காக தேர்ந்தெடுக்கப்பட்ட மூலப்பொருட்கள்", "active care உடன் hydration மற்றும் barrier ஆதரவு சமநிலை", "தொடர்ச்சியான பயன்பாட்டிற்கு வடிவமைக்கப்பட்ட மென்மையான textures", "எப்படி, எப்போது பயன்படுத்துவது என்ற தெளிவான வழிகாட்டல்"] },
  contact: { eyebrow: "YARA தொடர்பு", title: "உங்களுக்கு உதவ நாங்கள் இருக்கிறோம்.", copy: "பொருள் கேள்விகள், ஆர்டர் உதவி, டெலிவரி தகவல் அல்லது பொதுவான விசாரணைகளுக்கு எங்கள் குழுவை அணுகுங்கள்.", sriLankaWhatsApp: "இலங்கை WhatsApp", uaeWhatsApp: "UAE / Dubai WhatsApp", email: "மின்னஞ்சல்", sendEyebrow: "செய்தி அனுப்பு", sendTitle: "எப்படி உதவலாம்?", sent: "நன்றி, உங்கள் செய்தி எங்கள் பராமரிப்பு குழுவிற்குத் தயாராக உள்ளது.", subject: "தலைப்பு", message: "உங்கள் செய்தி", send: "செய்தி அனுப்பு", serving: "இலங்கை மற்றும் UAE / Dubai வாடிக்கையாளர்களுக்கு சேவை", helpMessage: "Hello YARA, எனக்கு உதவி வேண்டும்.", customerCareAlt: "YARA வாடிக்கையாளர் பராமரிப்பு", topics: ["பொருள் கேள்வி", "ஆர்டர் உதவி", "டெலிவரி தகவல்", "மொத்த விற்பனை விசாரணை", "பொது விசாரணை"] },
  login: { remembered: "உங்கள் விருப்பங்கள் நினைவில்", welcomeGlow: "உங்கள் பொலிவுக்கு மீண்டும் வரவேற்கிறோம்.", imageCopy: "உங்கள் விருப்பங்களை மீண்டும் பார்க்கவும், ஆர்டர்களை கண்காணிக்கவும், சுய பராமரிப்பை எளிதாக்கவும்.", circle: "YARA வட்டம்", welcome: "மீண்டும் வரவேற்கிறோம்", copy: "வாங்கலை தொடர sign in செய்யுங்கள்.", submitted: "உங்கள் sign-in கோரிக்கை பெறப்பட்டது. நேரடி customer accounts க்காக இந்த படிவத்தை உங்களின் authentication சேவையுடன் இணைக்கவும்.", password: "கடவுச்சொல்", yourPassword: "உங்கள் கடவுச்சொல்", hide: "கடவுச்சொல்லை மறை", show: "கடவுச்சொல்லை காட்டு", remember: "என்னை நினைவில் வைத்திரு", forgot: "கடவுச்சொல் மறந்துவிட்டதா?", signIn: "Sign in", new: "YARA-க்கு புதியவரா?", create: "கணக்கு உருவாக்கு", imageAlt: "இயற்கையாக பொலிவு மிக்க சருமம் கொண்ட பெண்" },
  whatsapp: { greeting: "Hello YARA, நான் ஒரு ஆர்டர் செய்ய விரும்புகிறேன்.", newOrder: "புதிய ஆர்டர்", product: "பொருள்", paymentMethod: "கட்டண முறை", notes: "குறிப்புகள்" },
}) as TranslationTree;

const fullAr = mergeTree(ar, {
  nav: { mainNavigation: "التنقل الرئيسي", mobileNavigation: "تنقل الهاتف", openMenu: "افتحي القائمة", closeMenu: "أغلقي القائمة" },
  common: { loading: "جار تحميل YARA...", closeFilters: "إغلاق الفلاتر" },
  catalog: { collection: "مجموعة YARA", uncategorized: "غير مصنف", beauty: "الجمال", unavailable: "معلومات المخزون المباشر غير متاحة مؤقتا.", directionsFallback: "راجعي عبوة المنتج لمعرفة طريقة الاستخدام.", ingredientsFallback: "راجعي عبوة المنتج لقائمة المكونات الكاملة." },
  layout: { footerText: "عناية حديثة بالبشرة للروح الواعية. تجمع بين العلم المتقدم وفن العناية الذاتية.", explore: "استكشفي", shopAll: "تسوقي الكل", bestsellers: "الأكثر مبيعا", giftSets: "مجموعات الهدايا", ourStory: "قصتنا", care: "خدمة العملاء", contactUs: "تواصلي معنا", shippingPolicy: "سياسة الشحن", terms: "شروط الخدمة", privacy: "سياسة الخصوصية", newsletter: "النشرة البريدية", newsletterText: "انضمي لدائرتنا للحصول على وصول مبكر للمنتجات والعروض الخاصة.", emailAddress: "البريد الإلكتروني", joinNewsletter: "الاشتراك في النشرة", rights: "جميع الحقوق محفوظة.", chatHelp: "Hello YARA، أحتاج مساعدة في اختيار منتجات العناية بالبشرة.", chatLabel: "تحدثي مع YARA عبر واتساب" },
  home: { heroEyebrow: "عناية فاخرة بالبشرة", heroTitle: "اكشفي تألقك الطبيعي مع", heroCopy: "اختبري مزيجا من الفعالية السريرية والفخامة النباتية. صممت للبشرة الحديثة ومستوحاة من العناية الذاتية الواعية.", vegan: "تركيبات Vegan", crueltyFree: "دون قسوة على الحيوانات", delivery: "توصيل داخل الدولة", categoriesEyebrow: "اكتشفي مفضلاتك", categoriesTitle: "فئات المنتجات", categoriesCopy: "حلول مخصصة لكل احتياج، من التنظيف إلى العناية المكثفة.", favoritesEyebrow: "مفضلاتنا", favoritesTitle: "الأكثر مبيعا", standardEyebrow: "معيار YARA", standardTitle: "مدعوم بالعلم ومغذى بالعاطفة.", standardCopy: "توازن كل تركيبة بين المكونات الفعالة المثبتة والنباتات الحسية، لأن العناية الفعالة بالبشرة يجب أن تكون جميلة في الإحساس كما هي في الأداء.", approach: "نهجنا", routineEyebrow: "روتينات حقيقية، إشراقة حقيقية", routineTitle: "محبوب من عاشقات العناية بالبشرة", followEyebrow: "تابعي YARA", followTitle: "على Gram", followUs: "تابعينا", heroAlt: "مجموعة YARA للعناية بالبشرة على ساتان وردي", skinAlt: "بشرة صحية ومتوهجة", botanicalAlt: "مكونات نباتية للعناية بالبشرة", instagramAlt: "إلهام YARA للعناية بالبشرة {count}", features: ["تفتيح|مكونات مشتقة طبيعيا تعزز الإشراق.", "ترطيب عميق|ترطيب متعدد الأوزان لراحة تدوم.", "مقاومة علامات التقدم|Peptides وبدائل retinoid للتجدد.", "تركيبات نظيفة|Vegan، cruelty-free، ومطورة بعناية."], testimonials: ["غيّر Saffron Face Wash إحساس بشرتي صباحا: نظيفة وهادئة ولا تشد أبدا.|إلينا V.", "لم أستخدم غسولا للوجه يشعرني بهذه الفخامة. رائحة saffron ناعمة وحالمة.|سيينا J.", "العبوة جميلة، لكن الإشراقة هي ما يعيدني دائما. يستحق فعلا.|ماركوس L."] },
  shop: { innerCircle: "انضمي إلى Inner Circle", innerCircleCopy: "وصول مبكر للمنتجات وعروض خاصة.", resultsFor: "نتائج “{query}”", showing: "عرض {count} منتج", priceLow: "السعر: من الأقل إلى الأعلى", priceHigh: "السعر: من الأعلى إلى الأقل", topRated: "الأعلى تقييما", viewProducts: "عرض {count} منتج", clearSearch: "مسح البحث", searchPlaceholder: "ابحثي عن المنتجات" },
  product: { notFound: "المنتج غير موجود", notFoundTitle: "هذا المنتج غير متاح حاليا.", returnToShop: "العودة إلى المتجر", addFavorite: "أضيفي {name} إلى المفضلة", removeFavorite: "إزالة {name} من المفضلة", addNamedToCart: "أضيفي {name} إلى السلة", vegan: "Vegan", decrease: "تقليل الكمية", increase: "زيادة الكمية", benefits: "الفوائد", howToUse: "طريقة الاستخدام", ingredients: "المكونات الكاملة", pairEyebrow: "ينسجم معها بجمال", pairTitle: "أكملي روتينك", breadcrumb: "مسار الصفحة", imageAlt: "صورة منتج {name}", galleryImage: "عرض صورة المنتج {count}" },
  cart: { emptyEyebrow: "مفضلاتك بانتظارك", emptyTitle: "سلتك فارغة بأناقة.", emptyCopy: "استكشفي تركيباتنا واختاري منتجات تشبهك تماما.", discover: "اكتشفي المجموعة", eyebrow: "اختياراتك", title: "سلة التسوق", remove: "إزالة {name}" },
  checkout: { emptyEyebrow: "لا يوجد ما يمكن دفعه بعد", emptyTitle: "يبدأ طلبك من المتجر.", browse: "تصفحي المنتجات", eyebrow: "محمي وخاص", copy: "إكمال رحلة العناية الذاتية", keepUpdated: "أرغب في تلقي أخبار المنتجات والعروض الخاصة", payhere: "ادفعي بأمان عبر PayHere", payhereCopy: "يتم إدخال بيانات البطاقة فقط داخل صفحة PayHere الآمنة.", preparing: "جار تجهيز الدفع الآمن...", encrypted: "دفع مشفر · دعم الطلبات", error: "تعذر إرسال الطلب.", emailPlaceholder: "you@example.com" },
  about: { eyebrow: "قصة YARA", title: "جمال بهدف، صمم ليمنح الثقة.", copy: "بدأت YARA برغبة في جعل العناية الشخصية الفاخرة دافئة وسهلة الوصول وفعالة حقا. ما بدأ في سريلانكا أصبح مجتمعا جماليا يخدم العملاء في سريلانكا والإمارات.", explore: "استكشفي YARA", mission: "مهمتنا", missionTitle: "أن يشعر كل عميل بأنه مرئي ومعتنى به ومشرق.", regionEyebrow: "سريلانكا والإمارات", regionTitle: "مجتمع YARA واحد عبر بلدين.", regionCopy: "توفر خيارات الطلب الخاصة بسريلانكا والإمارات/دبي أسعارا ودعما واضحين لكل عميل. أينما تسوقت معنا، تحصلين على نفس العناية والجودة والاهتمام.", promiseTitle: "مصنوع بعناية. يشارك بثقة.", promiseCopy: "اكتشفي منتجات تجعل عنايتك اليومية مدروسة وجميلة.", values: ["العميل أولا|إرشاد مدروس ودعم سريع من الاكتشاف حتى التوصيل.", "وعد الجودة|منتجات مطورة بعناية، ومعايير موثوقة، وتواصل صادق.", "ثقة يومية|عناية ذاتية جميلة تناسب الحياة الحقيقية وتحتفي بالجمال الفردي."], regionPoints: ["أسعار خاصة بكل دولة", "دعم واتساب مخصص", "مساعدة طلب واضحة", "رعاية عملاء موثوقة"] },
  ingredients: { eyebrow: "ثقافة المكونات", title: "اعرفي ما يعتني ببشرتك.", copy: "نختار المكونات لهدف واضح: تنظيف لطيف، ترطيب عميق، دعم حاجز البشرة، أو تحسين مظهر اللون والملمس.", keyEyebrow: "المكونات الرئيسية", keyTitle: "عناية هادفة، مكونا بعد مكون.", whyEyebrow: "لماذا تختارها YARA", whyTitle: "لكل تركيبة سبب.", whyCopy: "يجمع نهجنا بين skincare actives الفعالة، والمرطبات الداعمة، والنباتات. يختار كل مكون لدوره في التركيبة الكاملة.", cards: ["Saffron|إشراق وراحة|مكون نباتي ثمين معروف بمركبات antioxidant التي تدعم مظهرا أكثر إشراقا وانتعاشا.", "Alpha Arbutin|لون موحد المظهر|skincare active مركز يستخدم لتقليل مظهر dark spots وuneven tone.", "Hyaluronic Acid|ترطيب يدوم|مكون يجذب الرطوبة ليساعد البشرة أن تبدو ممتلئة وناعمة ومرطبة براحة.", "Rosehip Oil|تغذية وإشراقة|غني طبيعيا بlipids داعمة للبشرة تنعم الإحساس بالجفاف وتعزز مظهرا صحيا متوهجا.", "Aloe Vera|عناية مهدئة|مكون نباتي لطيف يساعد على تهدئة البشرة ودعم الإحساس بالترطيب.", "Ceramides|دعم الحاجز|lipids مطابقة للبشرة تساعد في تقوية حاجز الرطوبة وتقليل الإحساس بالجفاف."], reasons: ["مكونات مركزة مختارة لفوائد مرئية للعناية بالبشرة", "توازن بين الترطيب ودعم الحاجز والعناية الفعالة", "ملمس لطيف مصمم للاستخدام المستمر", "إرشادات واضحة لكيفية ووقت الاستخدام"] },
  contact: { eyebrow: "تواصلي مع YARA", title: "نحن هنا لمساعدتك.", copy: "تواصلي مع فريقنا لأسئلة المنتجات، دعم الطلبات، معلومات التوصيل، أو الاستفسارات العامة.", sriLankaWhatsApp: "واتساب سريلانكا", uaeWhatsApp: "واتساب الإمارات / دبي", email: "البريد الإلكتروني", sendEyebrow: "إرسال رسالة", sendTitle: "كيف نساعدك؟", sent: "شكرا لك، رسالتك جاهزة لفريق العناية لدينا.", subject: "الموضوع", message: "رسالتك", send: "إرسال الرسالة", serving: "نخدم العملاء في سريلانكا والإمارات / دبي", helpMessage: "Hello YARA، أحتاج إلى مساعدة.", customerCareAlt: "خدمة عملاء YARA", topics: ["سؤال عن منتج", "دعم طلب", "معلومات التوصيل", "استفسار جملة", "استفسار عام"] },
  login: { remembered: "مفضلاتك محفوظة", welcomeGlow: "مرحبا بعودتك إلى تألقك.", imageCopy: "راجعي مفضلاتك، تابعي الطلبات، واجعلي العناية الذاتية بسيطة وجميلة.", circle: "دائرة YARA", welcome: "مرحبا بعودتك", copy: "سجلي الدخول لمتابعة التسوق.", submitted: "تم استلام طلب تسجيل الدخول. اربطي هذا النموذج بخدمة التوثيق المفضلة لحسابات العملاء المباشرة.", password: "كلمة المرور", yourPassword: "كلمة المرور الخاصة بك", hide: "إخفاء كلمة المرور", show: "إظهار كلمة المرور", remember: "تذكريني", forgot: "نسيت كلمة المرور؟", signIn: "تسجيل الدخول", new: "جديدة على YARA؟", create: "إنشاء حساب", imageAlt: "امرأة ببشرة متألقة طبيعيا" },
  whatsapp: { greeting: "Hello YARA، أود تقديم طلب.", newOrder: "طلب جديد", product: "المنتج", paymentMethod: "طريقة الدفع", notes: "ملاحظات" },
}) as TranslationTree;

const dictionaries: Record<Locale, TranslationTree> = { en, si: fullSi, ta: fullTa, ar: fullAr };

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
    newOrder: translate(locale, "whatsapp.newOrder"),
    country: translate(locale, "whatsapp.country"),
    currency: translate(locale, "whatsapp.currency"),
    products: translate(locale, "whatsapp.products"),
    product: translate(locale, "whatsapp.product"),
    quantity: translate(locale, "whatsapp.quantity"),
    price: translate(locale, "whatsapp.price"),
    total: translate(locale, "whatsapp.total"),
    name: translate(locale, "whatsapp.name"),
    phone: translate(locale, "whatsapp.phone"),
    address: translate(locale, "whatsapp.address"),
    paymentMethod: translate(locale, "whatsapp.paymentMethod"),
    notes: translate(locale, "whatsapp.notes"),
  };
}
