import { translate, type Locale } from "../i18n";
import type { Product } from "../types";

type LocalizedText = Partial<Record<Locale, string>>;
type ProductCopy = {
  name?: LocalizedText;
  subtitle?: LocalizedText;
  description?: LocalizedText;
  badge?: LocalizedText;
  benefits?: Partial<Record<Locale, string[]>>;
  howToUse?: LocalizedText;
  ingredients?: LocalizedText;
};

const taxonomy: Record<string, LocalizedText> = {
  "Skincare": { si: "සම සත්කාර", ta: "சரும பராமரிப்பு", ar: "العناية بالبشرة" },
  "Body Care": { si: "ශරීර සත්කාර", ta: "உடல் பராமரிப்பு", ar: "العناية بالجسم" },
  "Haircare": { si: "හිසකෙස් සත්කාර", ta: "முடி பராமரிப்பு", ar: "العناية بالشعر" },
  "Gift Sets": { si: "තෑගි කට්ටල", ta: "பரிசு தொகுப்புகள்", ar: "مجموعات الهدايا" },
  "Brightening": { si: "දීප්තිය", ta: "பொலிவு", ar: "تفتيح" },
  "Anti-Aging": { si: "වයසට එරෙහි", ta: "வயது எதிர்ப்பு", ar: "مقاومة علامات التقدم" },
  "Hydration": { si: "තෙතමනය", ta: "ஈரப்பதம்", ar: "ترطيب" },
  "Repair": { si: "ප්‍රතිසංස්කරණය", ta: "பழுது சரிசெய்தல்", ar: "إصلاح" },
  "Natural": { si: "ස්වාභාවික", ta: "இயற்கை", ar: "طبيعي" },
  "Sensitivity": { si: "සංවේදී සම", ta: "சென்சிடிவ் சருமம்", ar: "البشرة الحساسة" },
  "Beauty": { si: "රූපලාවණ්‍ය", ta: "அழகு", ar: "الجمال" },
  "Uncategorized": { si: "වර්ගීකරණය නොකළ", ta: "வகைப்படுத்தப்படாதது", ar: "غير مصنف" },
  "Award winner": { si: "සම්මානලාභී", ta: "விருது பெற்றது", ar: "حائز على جائزة" },
  "Bestseller": { si: "ජනප්‍රියම", ta: "அதிகம் விற்கப்படும்", ar: "الأكثر مبيعا" },
  "Clinical favorite": { si: "සායනික ප්‍රියතම", ta: "மருத்துவ விருப்பம்", ar: "مفضل سريريا" },
  "Gift-ready": { si: "තෑගි කිරීමට සූදානම්", ta: "பரிசுக்கு தயார்", ar: "جاهز للإهداء" },
};

const shared = {
  howToUse: {
    si: "පිරිසිදු සම මත උදෑසන හෝ රාත්‍රී රූටීනයේ කොටසක් ලෙස භාවිතා කරන්න. දිවා කාලයේදී moisturizer සහ SPF යොදන්න.",
    ta: "காலை அல்லது இரவு routine-இன் பகுதியாக சுத்தமான சருமத்தில் பயன்படுத்தவும். பகலில் moisturizer மற்றும் SPF பயன்படுத்தவும்.",
    ar: "ضعيه على بشرة نظيفة ضمن روتين الصباح أو المساء. اتبعيه بمرطب وSPF خلال النهار.",
  },
  ingredients: {
    si: "වෘක්ෂමය සාර, සමට සමාන hydrators, antioxidant complex සහ YARA මෘදු barrier-support blend. Vegan සහ cruelty-free.",
    ta: "தாவர extracts, skin-identical hydrators, antioxidant complex, மற்றும் YARA-வின் மென்மையான barrier-support blend. Vegan மற்றும் cruelty-free.",
    ar: "مستخلصات نباتية، مرطبات مطابقة للبشرة، مركب antioxidant، ومزيج YARA اللطيف الداعم للحاجز. Vegan وcruelty-free.",
  },
};

export const productTranslations: Record<string, ProductCopy> = {
  "saffron-face-wash": {
    name: { si: "YARA Saffron මුහුණු සේදුම", ta: "YARA Saffron முகக் கழுவி", ar: "غسول YARA بالزعفران" },
    subtitle: { si: "දීප්තිය දෙන දෛනික cleanser", ta: "ஒளிர்வு தரும் தினசரி cleanser", ar: "غسول يومي يمنح الإشراق" },
    description: {
      si: "තෝරාගත් Kashmiri saffron සහ පිරිසිදු aloe vera සමඟ සෑදූ මෘදු cleanser එකක්. දෛනික අපිරිසිදුකම් ඉවත් කර සමේ ස්වාභාවික තෙතමනය barrier රැකගනී.",
      ta: "தேர்ந்தெடுக்கப்பட்ட Kashmiri saffron மற்றும் தூய aloe vera உடன் உருவாக்கப்பட்ட மென்மையான cleanser. தினசரி அழுக்குகளை நீக்கி சருமத்தின் இயல்பான ஈரப்பத barrier-ஐ காக்கிறது.",
      ar: "غسول لطيف غني بKashmiri saffron المختار وaloe vera النقي. يزيل شوائب اليوم مع الحفاظ على حاجز الرطوبة الطبيعي للبشرة.",
    },
    badge: taxonomy["Award winner"],
    benefits: {
      si: ["නිර්ජීව සම දෘශ්‍ය ලෙස දීප්තිමත් කරයි", "සම වියළා නොගෙන පිරිසිදු කරයි", "රතු බව සන්සුන් කර barrier එකට සහාය දේ"],
      ta: ["மங்கலான சருமத்தை தெளிவாக ஒளிரச் செய்கிறது", "சருமத்தை வறட்சி இல்லாமல் சுத்தம் செய்கிறது", "சிவப்பை அமைதிப்படுத்தி barrier-ஐ ஆதரிக்கிறது"],
      ar: ["يفتح مظهر البشرة الباهتة", "ينظف دون تجريد البشرة", "يهدئ الاحمرار ويدعم حاجز البشرة"],
    },
    ...shared,
  },
  "night-repair-cream": {
    name: { si: "YARA රාත්‍රී ක්‍රීම්", ta: "YARA இரவு கிரீம்", ar: "كريم YARA الليلي" },
    subtitle: { si: "සෛල නවීකරණ සත්කාර", ta: "செல்லுலர் புதுப்பிப்பு பராமரிப்பு", ar: "عناية ليلية للتجدد الخلوي" },
    description: {
      si: "peptides සහ සන්සුන් botanicals සමඟ ගැඹුරු රාත්‍රී cream එකක්. සම තෙතමනයෙන් ආවරණය කර ස්වාභාවික renewal cycle එකට සහාය දේ.",
      ta: "peptides மற்றும் அமைதிப்படுத்தும் botanicals கொண்ட செழுமையான இரவு cream. சருமத்தை ஈரப்பதத்தில் காக்கி இயல்பான renewal cycle-ஐ ஆதரிக்கிறது.",
      ar: "كريم ليلي غني بpeptides ونباتات مهدئة، يغمر البشرة بالرطوبة ويدعم دورة التجدد الطبيعية.",
    },
    badge: taxonomy["Bestseller"],
    benefits: {
      si: ["සියුම් රේඛා පෙනුම මෘදු කරයි", "රාත්‍රියේම පිරුණු බව නැවත ලබා දෙයි", "ගැඹුරු, දිගු hydration"],
      ta: ["மெல்லிய கோடுகளின் தோற்றத்தை மென்மையாக்குகிறது", "இரவில் bounce-ஐ மீட்டெடுக்கிறது", "ஆழமான நீடித்த hydration"],
      ar: ["ينعم مظهر الخطوط الدقيقة", "يعيد المرونة خلال الليل", "ترطيب عميق يدوم"],
    },
    ...shared,
  },
  "alpha-arbutin-serum": {
    name: { si: "YARA Alpha Arbutin සීරම්", ta: "YARA Alpha Arbutin சீரம்", ar: "سيروم YARA Alpha Arbutin" },
    subtitle: { si: "ලප නිවැරදි කරන elixir", ta: "புள்ளிகளை சரிசெய்யும் elixir", ar: "إكسير مركز لتصحيح البقع" },
    description: {
      si: "dark spots, uneven tone සහ post-blemish marks දෘශ්‍ය ලෙස මෘදු කිරීමට නිර්මාණය කළ දෛනික serum එකක්. සංවේදී සමටත් ගැලපේ.",
      ta: "dark spots, uneven tone, post-blemish marks ஆகியவற்றின் தோற்றத்தை மென்மையாக்க உருவாக்கப்பட்ட தினசரி serum. சென்சிடிவ் சருமத்துக்கும் ஏற்றது.",
      ar: "سيروم يومي دقيق صمم لتلطيف مظهر dark spots وuneven tone وآثار الحبوب دون إرهاق البشرة الحساسة.",
    },
    badge: taxonomy["Clinical favorite"],
    benefits: {
      si: ["uneven pigmentation ඉලක්ක කරයි", "දෘශ්‍ය දීප්තිය වැඩි කරයි", "makeup සහ SPF යට පහසුවෙන් layer වේ"],
      ta: ["uneven pigmentation-ஐ இலக்காகக் கொள்கிறது", "தோன்றும் பொலிவை உயர்த்துகிறது", "makeup மற்றும் SPF கீழ் எளிதில் layer ஆகும்"],
      ar: ["يستهدف التصبغ غير المتوازن", "يعزز الإشراقة المرئية", "ينسجم بسهولة تحت makeup وSPF"],
    },
    ...shared,
  },
  "vip-body-lotion": {
    name: { si: "YARA VIP ශරීර ලෝෂන්", ta: "YARA VIP உடல் லோஷன்", ar: "لوشن الجسم YARA VIP" },
    subtitle: { si: "වෙල්වට් සම සත්කාර", ta: "வெல்வெட் சரும பராமரிப்பு", ar: "نعومة مخملية للجسم" },
    description: {
      si: "ceramides සහ මල් oils සමඟ silky body lotion එකක්. සම මෘදු, සුවඳවත් සහ දීප්තිමත් කරයි.",
      ta: "ceramides மற்றும் மலர் oils கொண்ட silk-finish body lotion. சருமத்தை மென்மையாக்கி மணமுடன் ஒளிரச் செய்கிறது.",
      ar: "لوشن جسم بلمسة حريرية مع ceramides وزيوت زهرية، يترك البشرة ناعمة ومعطرة ومضيئة.",
    },
    benefits: {
      si: ["දිගු කාලීන hydration", "සිල්කි, තෙල් සහිත නොවන අවසානය", "සුමට පෙනුමකට සහාය දේ"],
      ta: ["நீடித்த hydration", "சில்க் போல non-greasy finish", "மென்மையான தோற்றத்தை ஆதரிக்கிறது"],
      ar: ["ترطيب طويل الأمد", "لمسة حريرية غير دهنية", "يدعم مظهرا أكثر نعومة"],
    },
    ...shared,
  },
  "botanical-hair-oil": {
    name: { si: "YARA හිසකෙස් තෙල්", ta: "YARA முடி எண்ணெய்", ar: "زيت YARA للشعر" },
    subtitle: { si: "දියර සිල්ක් හිසකෙස් සත්කාර", ta: "திரவ சில்க் முடி பராமரிப்பு", ar: "عناية حريرية سائلة للشعر" },
    description: {
      si: "argan, rosemary සහ camellia oils එකතුවක්. වියළි අග මෘදු කර බර නොවී වීදුරු වැනි දීප්තියක් ලබා දෙයි.",
      ta: "argan, rosemary, camellia oils கலவை. வறண்ட முனைகளை மென்மையாக்கி heaviness இல்லாமல் glass-like shine தருகிறது.",
      ar: "مزيج مركز من زيوت argan وrosemary وcamellia ينعّم الأطراف الجافة ويمنح لمعانا زجاجيا دون ثقل.",
    },
    benefits: {
      si: ["frizz සහ flyaways පාලනය කරයි", "වියළි, බිඳෙන අග ආරක්ෂා කරයි", "බරක් නැති දීප්තිය එක් කරයි"],
      ta: ["frizz மற்றும் flyaways கட்டுப்படுத்துகிறது", "வறண்ட மென்மையான முனைகளை பாதுகாக்கிறது", "எடை இல்லாத shine சேர்க்கிறது"],
      ar: ["يهدئ frizz والشعر المتطاير", "يحمي الأطراف الجافة والهشة", "يضيف لمعانا خفيفا"],
    },
    ...shared,
  },
  "lash-brow-oil": {
    name: { si: "YARA ඇහිපිල්ලම් සහ ඇහිබැම තෙල්", ta: "YARA இமை மற்றும் புருவ எண்ணெய்", ar: "زيت YARA للرموش والحواجب" },
    subtitle: { si: "follicle ශක්තිමත් කරන සත්කාර", ta: "follicle பலப்படுத்தும் பராமரிப்பு", ar: "علاج مقو لفوليكل الشعر" },
    description: {
      si: "lashes සහ brows පෝෂණය කර fuller, සෞඛ්‍යමත් පෙනුමකට සහාය දෙන මෘදු botanical conditioning oil එකක්.",
      ta: "lashes மற்றும் brows-ஐ ஊட்டமளித்து fuller, ஆரோக்கியமான தோற்றத்திற்கு உதவும் மென்மையான botanical conditioning oil.",
      ar: "زيت نباتي لطيف يرطب lashes وbrows ليمنح مظهرا أكثر امتلاء وصحة.",
    },
    benefits: {
      si: ["irritation නැතිව condition කරයි", "පහසු precision applicator", "මෘදු, දිලිසෙන hairs සඳහා සහාය දේ"],
      ta: ["irritation இல்லாமல் condition செய்கிறது", "எளிய precision applicator", "மென்மையான glossy hairs-ஐ ஆதரிக்கிறது"],
      ar: ["يرطب دون تهيج", "فرشاة دقيقة سهلة", "يدعم شعيرات ناعمة ولامعة"],
    },
    ...shared,
  },
  "rosehip-glow-serum": {
    name: { si: "Rosehip දීප්ති සීරම්", ta: "Rosehip பொலிவு சீரம்", ar: "سيروم Rosehip للإشراقة" },
    subtitle: { si: "දීප්තිය නැවත ගෙනෙන concentrate", ta: "பொலிவை மீட்டெடுக்கும் concentrate", ar: "مركز لاستعادة الإشراقة" },
    description: {
      si: "rosehip සහ squalane concentrate එකක්. වෙහෙසට පත් සම නැවත පෝෂණය කර ඇතුළතින් දීප්තිමත් පෙනුමක් ලබා දෙයි.",
      ta: "rosehip மற்றும் squalane concentrate. சோர்வடைந்த சருமத்தை நிரப்பி உள்ளிருந்து ஒளிரும் பொலிவை மீட்டெடுக்கிறது.",
      ar: "مركز مهدئ من rosehip وsqualane يجدد البشرة المجهدة ويعيد إشراقة مريحة من الداخل.",
    },
    benefits: {
      si: ["අත්‍යවශ්‍ය lipids නැවත පුරවයි", "සංවේදී සමට සුවපහසුව", "දීප්තිමත් finish එකක් දෙයි"],
      ta: ["அத்தியாவசிய lipids-ஐ நிரப்புகிறது", "சென்சிடிவ் சருமத்தை ஆறுதல் அளிக்கிறது", "ஒளிரும் finish தருகிறது"],
      ar: ["يعوض lipids الأساسية", "يريح البشرة الحساسة", "يعزز لمسة مضيئة"],
    },
    ...shared,
  },
  "jasmine-facial-mist": {
    name: { si: "Jasmine මුහුණු මීදුම", ta: "Jasmine முக மிஸ்ட்", ar: "رذاذ Jasmine للوجه" },
    subtitle: { si: "වෘක්ෂමය hydration veil", ta: "தாவர hydration veil", ar: "رذاذ ترطيب نباتي" },
    description: {
      si: "jasmine සහ aloe micro-fine mist එකක්. වෙහෙසට පත් සම නැවුම් කර makeup මෘදු කර දවස පුරා dewy finish එකක් ලබා දෙයි.",
      ta: "jasmine மற்றும் aloe micro-fine mist. சோர்வான சருமத்தை புதுப்பித்து makeup-ஐ மென்மையாக்கி நாள் முழுவதும் dewy finish தருகிறது.",
      ar: "رذاذ ناعم من jasmine وaloe ينعش البشرة المتعبة ويلطف makeup ويعيد لمسة dewy طوال اليوم.",
    },
    benefits: {
      si: ["ක්ෂණිකව නැවුම් කරයි", "tightness අඩු කිරීමට උදව් කරයි", "නැවුම් dewy finish එකක් නිර්මාණය කරයි"],
      ta: ["உடனடியாக புதுப்பிக்கிறது", "tightness குறைக்க உதவுகிறது", "புதிய dewy finish உருவாக்குகிறது"],
      ar: ["ينعش فورا", "يساعد في تخفيف الشد", "يمنح لمسة dewy منعشة"],
    },
    ...shared,
  },
  "the-glow-collection": {
    name: { si: "දීප්ති එකතුව", ta: "பொலிவு தொகுப்பு", ar: "مجموعة الإشراقة" },
    subtitle: { si: "සම්පූර්ණ පියවර පහේ එකතුව", ta: "முழு ஐந்து படி தொகுப்பு", ar: "مجموعة كاملة من خمس خطوات" },
    description: {
      si: "cleanse, treat, hydrate සහ illuminate කිරීමට නිර්මාණය කළ YARA essentials තෑගි කිරීමට සූදානම් එකතුවක්.",
      ta: "cleanse, treat, hydrate, illuminate செய்ய வடிவமைக்கப்பட்ட YARA essentials gift-ready தொகுப்பு.",
      ar: "اختيار جاهز للإهداء من أساسيات YARA مصمم للتنظيف والعلاج والترطيب والإضاءة في روتين متوازن.",
    },
    badge: taxonomy["Gift-ready"],
    benefits: {
      si: ["සම්පූර්ණ දෛනික routine එකක්", "තෑගි කිරීමට ලස්සන පෙට්ටියක්", "විශිෂ්ට set value"],
      ta: ["முழு தினசரி routine", "பரிசுக்கு அழகாக பெட்டியிடப்பட்டது", "சிறந்த set value"],
      ar: ["روتين يومي كامل", "مغلف بجمال للإهداء", "قيمة رائعة للمجموعة"],
    },
    ...shared,
  },
};

const getProductKey = (product: Product) => product.slug || product.id;

const localized = (value: LocalizedText | undefined, locale: Locale, fallback: string) =>
  value?.[locale] || value?.en || fallback || "";

export const localizeTaxonomy = (value: string | undefined, locale: Locale) => {
  if (!value) return "";
  return taxonomy[value]?.[locale] || taxonomy[value]?.en || value;
};

export function localizeProduct(product: Product, locale: Locale): Product {
  const copy = productTranslations[getProductKey(product)] || productTranslations[product.id];
  return {
    ...product,
    name: localized(copy?.name, locale, product.name),
    subtitle: localized(copy?.subtitle, locale, product.subtitle),
    category: localizeTaxonomy(product.category, locale),
    concern: localizeTaxonomy(product.concern, locale),
    badge: product.badge ? localizeTaxonomy(localized(copy?.badge, locale, product.badge), locale) : undefined,
    description: localized(copy?.description, locale, product.description),
    benefits: copy?.benefits?.[locale] || copy?.benefits?.en || product.benefits,
    howToUse: localized(copy?.howToUse, locale, product.howToUse),
    ingredients: localized(copy?.ingredients, locale, product.ingredients),
  };
}

export const localizeCountryName = (country: "sri-lanka" | "uae", locale: Locale) =>
  translate(locale, country === "sri-lanka" ? "region.sriLanka" : "region.uae");
