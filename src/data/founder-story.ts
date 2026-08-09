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

export type SupportingEducationItem = {
  number: string;
  name: string;
  focus: string;
  description: string;
  country?: string;
};

export const founderStory = {
  seo: {
    title: "About Fazeena Farook | Founder of YARA Productions",
    description:
      "Explore Fazeena Farook’s international professional learning across cosmetology, Ayurvedic preparation, herbal formulation, and advanced cosmetic technology.",
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
        "She expanded her knowledge through professional academies, Ayurvedic studies, international learning programmes, and specialised Master / Class Diplomas.",
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
    title: "A Journey of International Learning, Formulation & Innovation",
    introduction:
      "Fazeena Farook’s professional development spans cosmetology, Ayurvedic preparation, herbal formulation, cosmetic science, pharmaceutical-related studies, advanced cosmetic manufacturing technologies, and specialised Master / Class Diploma programmes completed or pursued across multiple countries. Her continuing education brings together practical formulation knowledge, scientific understanding, traditional herbal methods, and modern cosmetic technology, with relevant learning applied within YARA’s formulation and product-development process.",
    disciplines: [
      {
        number: "01",
        title: "Cosmetology & cosmetic science",
        description: "Professional beauty practice, skin and cosmetic-care principles, product understanding, and contemporary cosmetic technology.",
      },
      {
        number: "02",
        title: "Ayurvedic preparation & botanicals",
        description: "Traditional herbal knowledge examined through preparation, extraction, ingredient handling, and manufacturing practice.",
      },
      {
        number: "03",
        title: "Formulation & manufacturing methodology",
        description: "Applied learning in ingredient functionality, formulation development, production sequencing, and product performance.",
      },
    ],
    portfolio: {
      label: "INTERNATIONAL LEARNING PORTFOLIO",
      title: "Knowledge built across disciplines and borders",
      description:
        "Her education is presented as an evolving professional practice: foundational beauty studies, specialised herbal preparation, advanced cosmetic technology, and the practical translation of learning into YARA product development.",
    },
    university: {
      number: "01",
      country: "MALAYSIA",
      institution: "University of Cyberjaya, Malaysia",
      subtitle: "Continuing Advanced Diploma / Master Class Studies — Advanced Cosmetic Technology",
      status: "Currently pursuing",
      faculty: "Pharmaceutical-related faculty",
      paragraphs: [
        "Through continuing advanced studies associated with the pharmaceutical-related faculty at the University of Cyberjaya, Fazeena is expanding her knowledge of modern cosmetic technology and formulation.",
        "Her current studies cover advanced approaches to shampoo development, lipstick and colour-cosmetic technology, cosmetic formulation, formulation development, ingredient functionality, product performance, advanced cosmetic manufacturing concepts, and contemporary production methods across a range of cosmetic categories.",
      ],
      focusAreas: [
        "Advanced shampoo technology",
        "Cosmetic formulation & formulation development",
        "Lipstick & colour-cosmetic technology",
        "Ingredient functionality & product performance",
        "Advanced cosmetic manufacturing concepts",
        "Contemporary cosmetic production methods",
      ],
    },
    rajasthan: {
      number: "02",
      country: "INDIA",
      title: "Rajasthan, India — Specialised Herbal Soap Formulation",
      focus: "Herbal soap formulation & manufacturing",
      institution: "The Tree Ayurvedic",
      paragraphs: [
        "In Rajasthan, India, Fazeena undertook specialised learning in herbal soap formulation and manufacturing. The programme introduced distinctive formulation methods that bring traditional herbal knowledge together with practical production techniques.",
        "She later brought this learning into YARA’s product-development process, adapting it within the development philosophy behind YARA treatment soaps for its customers. This specialised knowledge now informs YARA’s approach to treatment-soap formulation.",
      ],
      confidentialNote:
        "Certain formulation details remain confidential as part of YARA’s internal product-development knowledge.",
    },
    kerala: {
      number: "03",
      country: "INDIA",
      title: "Kerala, India — Ayurvedic Decoctions & Herbal Manufacturing",
      focus: "Manufacturing-oriented Ayurvedic study",
      paragraphs: [
        "Her studies in Kerala extended beyond introductory Ayurvedic knowledge into the preparation and manufacturing of traditional herbal decoctions. She developed practical understanding of botanical preparation methods, extraction and preparation principles, ingredient handling, formulation sequencing, and the production processes used to transform herbs into usable Ayurvedic preparations.",
        "This manufacturing-oriented knowledge later contributed to how traditional herbal concepts are evaluated and incorporated into YARA’s product-development process.",
      ],
      methods: [
        "Botanical preparation methods",
        "Herbal decoction manufacturing",
        "Extraction & preparation principles",
        "Ingredient handling & formulation sequencing",
      ],
    },
    professionalLearning: {
      label: "CONTINUING PROFESSIONAL EDUCATION",
      title: "A wider portfolio of professional learning",
      description:
        "Alongside the major study areas above, Fazeena has continued to develop her practice through cosmetology studies, professional academies, international learning exposure, and specialised training programmes.",
      miyc: {
        country: "MALAYSIA",
        name: "MIYC, Malaysia",
        focus: "Cosmetology Studies",
        description:
          "Professional study in cosmetology with exposure to modern beauty science, skin and cosmetic-care principles, product understanding, and professional treatment knowledge. This learning strengthened the practical foundation through which she evaluates beauty practices and cosmetic products.",
      },
      institutions: [
        {
          number: "01",
          name: "Novella Global",
          focus: "Professional learning",
          description: "Professional learning and skills development supporting her continuing journey in beauty and entrepreneurship.",
        },
        {
          number: "02",
          name: "Sunflower Skills Academy",
          focus: "Skills development",
          description: "Skills-focused professional training that strengthened practical capability and supported her wider learning journey.",
        },
        {
          number: "03",
          name: "Aromaflare Academy",
          focus: "Beauty & skincare studies",
          description: "Further study connected with beauty, skincare, and product-development knowledge.",
        },
        {
          number: "04",
          name: "AIKA",
          focus: "Professional development",
          description: "Specialised professional development undertaken as part of her continuing education.",
        },
      ] satisfies SupportingEducationItem[],
      masterDiplomas: {
        title: "Master / Class Diplomas & Specialised Professional Training",
        description:
          "Her continued professional development includes specialised Master / Class Diploma programmes and advanced training designed to deepen her understanding of cosmetology, cosmetic formulation, herbal preparation, professional beauty practice, and modern manufacturing techniques.",
        areas: [
          "Cosmetology",
          "Cosmetic formulation",
          "Herbal preparation",
          "Professional beauty practice",
          "Modern manufacturing techniques",
        ],
      },
    },
    synthesis: {
      label: "FROM KNOWLEDGE TO FORMULATION",
      title: "Bringing Modern Cosmetic Science and Herbal Knowledge Together",
      image: {
        src: "/images/home/science-backed-botanical-skincare.png",
        alt: "Botanical ingredients arranged with cosmetic formulation vessels and a glass dropper",
      },
      paragraphs: [
        "Fazeena Farook’s learning journey has taken her across different institutions, disciplines, and countries, allowing her to study both traditional herbal preparation and modern cosmetic technology.",
        "From Ayurvedic decoctions and specialised herbal formulation methods in India to cosmetology and advanced cosmetic technology studies in Malaysia, her approach has been shaped by two complementary worlds: traditional botanical knowledge and contemporary cosmetic science.",
        "Rather than treating these disciplines separately, she applies the knowledge gained through her studies to YARA’s product-development philosophy — evaluating traditional ingredients through a modern formulation perspective and combining practical manufacturing knowledge with contemporary cosmetic technologies.",
        "This continuous learning process supports YARA’s goal of developing products that combine heritage-inspired ingredients, modern formulation thinking, quality, practicality, and meaningful value for customers.",
      ],
      progression: [
        "International education",
        "Specialised formulation knowledge",
        "Practical implementation",
        "YARA product development",
      ],
    },
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
