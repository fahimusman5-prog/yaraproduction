export type FounderAward = {
  title: string;
  year?: string;
  country?: string;
  organisation?: string;
  certificateImage?: {
    src: string;
    alt: string;
  };
};

export type EducationItem = {
  name: string;
  description: string;
  icon: "book" | "leaf" | "sparkle" | "globe" | "certificate";
  flag?: string;
};

export const founderStory = {
  seo: {
    title: "About Fazeena Farook | Founder of YARA Productions",
    description:
      "Discover Fazeena Farook’s journey of continuous learning, Ayurvedic study, entrepreneurship, and the growth of YARA Productions.",
  },
  hero: {
    label: "The woman behind YARA",
    titlePrefix: "From One",
    titleLead: "Handmade Soap",
    titleAccent: "to a Growing Beauty Brand",
    description:
      "Fazeena Farook began YARA with a simple handcrafted herbal soap and grew it through continuous learning, customer trust, and dedicated work.",
    role: "Founder & Entrepreneur",
    name: "Fazeena Farook",
    image: {
      src: "/images/about/fazeena-farook.jpeg",
      alt: "Fazeena Farook, founder of YARA, holding an award and certificate",
    },
  },
  stats: [
    { value: "1", label: "Handcrafted beginning" },
    { value: "10+", label: "Countries reached" },
    { value: "In progress", label: "Future vision" },
  ],
  journey: {
    label: "Her story in four steps",
    title: "Her Journey at a Glance",
  },
  milestones: [
    {
      number: "01",
      label: "THE BEGINNING",
      description:
        "Fazeena began YARA with a single handcrafted herbal soap, created with the purpose of addressing genuine skincare concerns through carefully selected ingredients.",
    },
    {
      number: "02",
      label: "LEARNING & EXPERTISE",
      description:
        "She expanded her knowledge through professional academies, Ayurvedic studies, international learning programmes, and specialised masterclass diplomas.",
    },
    {
      number: "03",
      label: "BUILDING THE BRAND",
      description:
        "Through continuous learning, customer trust, and years of dedication, she developed YARA from a small home-based venture into a growing beauty and wellness brand.",
    },
    {
      number: "04",
      label: "GROWING BEYOND BORDERS",
      description:
        "Today, YARA continues to serve customers across multiple countries while expanding its product range, operations, and professional team.",
    },
  ],
  education: {
    label: "EDUCATION & PROFESSIONAL DEVELOPMENT",
    title: "A Journey of Continuous Learning",
    introduction:
      "Fazeena Farook continuously expanded her knowledge through specialised studies, professional academies, international programmes, and masterclass diplomas related to beauty, skincare, wellness, and Ayurvedic practices.",
    items: [
      { name: "Novella Global", description: "Professional learning and skills development supporting her journey in beauty and entrepreneurship.", icon: "book" },
      { name: "Sunflower Skills Academy", description: "Further professional training that strengthened her practical knowledge and industry skills.", icon: "certificate" },
      { name: "Aromaflare Academy", description: "Additional studies supporting her knowledge of beauty, skincare, and product development.", icon: "sparkle" },
      { name: "AIKA", description: "Specialised professional development undertaken as part of her continuous learning journey.", icon: "book" },
      { name: "Kerala Ayurvedic Studies", description: "Study and exposure to traditional Ayurvedic principles, natural ingredients, and wellness practices.", icon: "leaf" },
      { name: "Rajasthan – The Tree Ayurvedic", description: "Further learning related to Ayurveda, medicinal plants, and natural skincare traditions.", icon: "leaf" },
      { name: "MIYC, Malaysia", flag: "🇲🇾", description: "International learning exposure that broadened her professional and entrepreneurial perspective.", icon: "globe" },
      { name: "Masterclass Diplomas", description: "She continued developing her expertise by completing multiple professional masterclasses and diploma programmes.", icon: "certificate" },
    ] satisfies EducationItem[],
  },
  manufacturing: {
    label: "THE NEXT CHAPTER",
    title: "Building for the Future",
    description:
      "YARA is preparing for its next stage of growth with plans for a larger, purpose-built manufacturing facility. The development is currently in progress and forms part of the brand’s long-term vision to expand production capacity, strengthen its operations, and serve more customers internationally.",
    note:
      "Further information about the facility, production standards, and certifications will be shared after the development and approval processes are completed.",
    status: "Development in progress",
  },
  brands: {
    label: "Brands under YARA",
    title: "Building Beyond Beauty",
    description:
      "Fazeena expanded YARA into beauty, fashion, and international trading.",
    items: [
      { initials: "YP", name: "YARA Productions", category: "Ayurvedic Skincare" },
      { initials: "YA", name: "YARA Arabian", category: "Luxury Clothing" },
      { initials: "YI", name: "YARA International Trading", category: "Sri Lanka" },
      { initials: "YG", name: "YARA Global Trading", category: "Dubai" },
    ],
  },
  awards: {
    label: "Leadership recognised",
    title: "Awards & Recognition",
    description:
      "Her leadership and entrepreneurial journey have been recognised in Sri Lanka, Dubai, and across Asia.",
    items: [
      { title: "Lady of the Year" },
      { title: "Woman of the Year" },
      { title: "Best Woman Entrepreneur of the Year – Dubai" },
      { title: "Asian Achievers Award – Sri Lanka" },
      { title: "Asian Achievers Award – Dubai" },
      { title: "Aroma Lady of the Year Award" },
      { title: "Wonder Woman 2024" },
      { title: "Best Cosmetic Entrepreneurship Award 2025" },
    ] satisfies FounderAward[],
  },
  closing: {
    statement:
      "A simple idea became a trusted beauty brand because she never stopped learning, building, and believing.",
    description:
      "Fazeena Farook’s journey is a story of courage, discipline, and determination. YARA continues to grow, but its purpose remains the same—creating products that help people feel confident in their own skin.",
    cta: "Explore YARA Products",
    href: "/shop",
  },
} as const;
