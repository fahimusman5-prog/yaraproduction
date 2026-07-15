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

export const founderStory = {
  seo: {
    title: "Fazeena Farook — Founder of YARA | YARA",
    description:
      "Meet Fazeena Farook, who grew YARA from one handmade herbal soap into an internationally growing Ayurvedic beauty brand.",
  },
  hero: {
    label: "The woman behind YARA",
    titlePrefix: "From One",
    titleLead: "Handmade Soap",
    titleAccent: "to a Global Beauty Brand",
    description:
      "Fazeena Farook built YARA from a home-based skincare idea into an internationally growing Ayurvedic beauty brand.",
    role: "Founder & Entrepreneur",
    name: "Fazeena Farook",
    image: {
      src: "/images/about/yara-about-portrait.png",
      alt: "Fazeena Farook, founder of YARA",
    },
  },
  stats: [
    { value: "3,000+", label: "Monthly Orders" },
    { value: "10+", label: "Countries" },
    { value: "GMP & ISO", label: "Standards" },
  ],
  journey: {
    label: "Her story in four steps",
    title: "Her Journey at a Glance",
  },
  milestones: [
    {
      number: "01",
      label: "The Beginning",
      description:
        "Fazeena started YARA with one handcrafted herbal soap created to solve real skin concerns.",
    },
    {
      number: "02",
      label: "Learning & Expertise",
      description:
        "She travelled to Rajasthan to study Ayurveda, medicinal plants, and natural skincare formulation. She also studied Cosmetology at Kerala Ayurveda.",
    },
    {
      number: "03",
      label: "From Home to Manufacturing",
      description:
        "With knowledge, customer trust, and support from Aroma Flare Academy, she transformed YARA from a home-based business into a structured manufacturing brand with GMP and ISO standards.",
    },
    {
      number: "04",
      label: "Growing Beyond Borders",
      description:
        "Today, YARA serves customers in more than ten countries and manages over 3,000 monthly orders with a professional team.",
    },
  ],
  brands: {
    label: "Brands under YARA",
    title: "Building Beyond Beauty",
    description:
      "Fazeena expanded YARA into beauty, fashion, and international trading.",
    items: [
      { initials: "YP", name: "YARA Production", category: "Ayurvedic Skincare" },
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
  turningPoint: {
    label: "A defining turning point",
    title: "Aroma Flare Academy",
    description:
      "Aroma Flare Academy helped Fazeena strengthen her knowledge, structure her production process, and move YARA from a home-based business into professional manufacturing.",
    image: {
      src: "/images/home/science-backed-botanical-skincare.png",
      alt: "Botanical skincare ingredients and formulation tools",
    },
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
