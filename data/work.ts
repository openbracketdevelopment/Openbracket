// Source: the linked case studies on tampham.io, reviewed 2026-10-30.
// These are Tam's professional contributions, not a list of OpenBracket clients.
export const projects = [
  {
    id: "fidium",
    name: "Fidium",
    category: "Enterprise web platform",
    context: "At Amdocs",
    purpose:
      "A connected web platform for internet plans, service availability, customer support, and purchasing.",
    contribution:
      "As a software engineer and lead Craft CMS developer at Amdocs, Tam worked on the shared headless CMS, custom modules, page-building tools, GraphQL integration, and reusable React components. The team also built the Check Availability experience and its handoff to purchasing.",
    role: "Software engineering · Lead Craft CMS development · React / Next.js",
    technologies: ["Craft CMS", "Next.js", "React", "GraphQL", "Redis"],
    image: "/work/fidium-fiber-desktop-clean.webp",
    width: 1440,
    height: 1000,
    imageAlt:
      "Fidium Fiber desktop homepage showing internet plans and the service availability experience",
    caseStudy: "https://tampham.io/fidium",
    live: "https://www.fidiumfiber.com/",
  },
  {
    id: "diageo",
    name: "Diageo Innovation",
    category: "Internal brand-asset application",
    context: "Professional portfolio project",
    purpose:
      "An authenticated application helping Diageo Innovation employees find and download brand assets, social media copy, videos, and posting guidelines.",
    contribution:
      "Tam developed the React application and worked on its UI/UX and single sign-on using Okta and OpenID Connect. The application organized downloadable assets in social-ready formats, with a framework supporting additional Diageo brands.",
    role: "React development · UI / UX · Single sign-on",
    technologies: ["React", "Okta", "OpenID Connect", "JavaScript", "GSAP"],
    image: "/work/diageo-screen-wall-perspective.jpg",
    width: 2880,
    height: 1800,
    imageAlt:
      "Diageo Innovation application screens showing sign-in, brand selection, and downloadable social media assets",
    gallery: [
      {
        image: "/work/diageo-desktop-mobile-examples.jpg",
        width: 2880,
        height: 1920,
        alt: "Desktop and mobile Diageo Innovation screens displaying Baileys campaigns and Crown Royal asset download formats",
      },
    ],
    caseStudy: "https://tampham.io/diageo",
    live: null,
  },
  {
    id: "toro",
    name: "Toro Haven",
    category: "Product launch",
    context: "Agency collaboration · 2023",
    purpose:
      "A launch website introducing Toro’s robotic mower and connected yard products.",
    contribution:
      "Through an agency, Tam built custom Gutenberg sections, added functional enhancements, and refined the responsive interface. The work included delivery through development, staging, and production with QA and accessibility checks.",
    role: "Development · UI / UX · Responsive design",
    technologies: ["WordPress", "Gutenberg", "ACF", "WPML", "PHP"],
    image: "/work/toro-desktop-mobile-examples-2880.webp",
    width: 2880,
    height: 1920,
    imageAlt:
      "Toro Haven website layouts on desktop and mobile featuring the robotic mower and smart yard controls",
    caseStudy: "https://tampham.io/toro",
    live: "https://www.toro.com",
  },
  {
    id: "esps-parts",
    name: "ESPS Trailer Parts",
    category: "E-commerce",
    context: "Professional portfolio project",
    purpose:
      "An online store that helps trailer owners find genuine parts through organized, shoppable collections.",
    contribution:
      "Tam designed and developed the Shopify storefront and its custom theme, carrying the ESPS identity into e-commerce. The responsive interface includes mobile navigation for search, shopping, cart, and account access.",
    role: "Shopify development · UI / UX",
    technologies: ["Shopify", "Liquid", "JavaScript", "GSAP ScrollTrigger"],
    image: "/work/esps-parts-desktop-mobile-examples.webp",
    width: 2000,
    height: 2032,
    imageAlt:
      "ESPS Trailer Parts desktop and mobile storefront layouts, including the tarps collection and product details",
    caseStudy: "https://tampham.io/esps-parts",
    live: null,
  },
  {
    id: "earthx",
    name: "EarthX",
    category: "Events & content",
    context: "Agency collaboration · 2019–2021 redesigns",
    purpose:
      "A website bringing an environmental exposition’s events, educational content, films, and online store together.",
    contribution:
      "Through an agency, Tam worked on the website redesigns, development, UI / UX, SEO, and strategy. The experience included a customized event calendar, WooCommerce, and Okta single sign-on across applications.",
    role: "Development · UI / UX · SEO · Strategy",
    technologies: ["WordPress", "Okta", "WooCommerce", "Event Calendar"],
    image: "/work/earthx-screen-wall-perspective-2.jpg",
    width: 2880,
    height: 1800,
    imageAlt:
      "Perspective collage of EarthX website screens from the environmental event platform",
    caseStudy: "https://tampham.io/earthx",
    live: null,
  },
  {
    id: "cintra",
    name: "Cintra TEXpress Saver",
    category: "Mobile experience design",
    context: "Professional portfolio project · 2016",
    purpose:
      "A reimagined mobile experience helping commuters understand managed lanes, apply discounts, and use carpooling features.",
    contribution:
      "Tam designed the app’s user experience, interface, and prototypes, with strategy focused on how commuters discover and use the service. This entry represents design and prototyping work.",
    role: "Mobile app design · UI / UX · Prototyping · Strategy",
    technologies: ["Proto.io", "Illustrator", "Photoshop", "Google Draw"],
    image: "/work/cintra-screen-wall-perspective.jpg",
    width: 2880,
    height: 1800,
    imageAlt:
      "A collection of Cintra TEXpress Saver mobile app interface screens from the design study",
    caseStudy: "https://tampham.io/cintra",
    live: null,
  },
]
export const workBrands = [
  {
    name: "Fidium",
    image: "/work/fidium-logo-white.svg",
    alt: "Fidium logo",
    width: 76,
    height: 36,
    scale: 1,
    knockout: false,
  },
  {
    name: "ESPS Trailers",
    image: "/work/esps-logo.svg",
    alt: "ESPS Trailers logo",
    width: 260,
    height: 201,
    scale: 1.3,
    knockout: false,
  },
  {
    name: "Toro Haven",
    image: "/work/toro-haven-logo.webp",
    alt: "Toro Haven Smartyard logo",
    width: 1000,
    height: 205,
    scale: 1,
    knockout: true,
  },
  {
    name: "EarthX",
    image: "/work/client-logos_EarthX.svg",
    alt: "EarthX logo",
    width: 260,
    height: 201,
    scale: 1.3,
    knockout: false,
  },
  {
    name: "TEXpress",
    image: "/work/client-logos_TexPress.svg",
    alt: "TEXpress logo",
    width: 260,
    height: 201,
    scale: 1,
    knockout: false,
  },
  {
    name: "Diageo",
    image: "/work/diageo-logo.svg",
    alt: "Diageo logo",
    width: 157,
    height: 34,
    scale: 1,
    knockout: false,
  },
]
