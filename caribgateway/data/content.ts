import type { Destination, Category, NavLink } from "@/lib/ui-types";

export const navLinks: NavLink[] = [
  { label: "Destinations", href: "/destinations" },
  { label: "Experiences", href: "/businesses" },
  { label: "About", href: "#" },
];

export const destinations: Destination[] = [
  {
    id: 1,
    name: "Barbados",
    slug: "barbados",
    tagline: "The Gem of the Caribbean",
    country: "Barbados",
    gradientFrom: "#1f476c",
    gradientTo: "#1f8a8a",
    emoji: "🌊",
    description:
      "Crystal-clear waters, world-class coral reefs, and vibrant local culture await on this beautiful island.",
    tags: ["Beach", "Culture", "Diving"],
  },
  {
    id: 2,
    name: "Jamaica",
    slug: "jamaica",
    tagline: "Island of Springs",
    country: "Jamaica",
    gradientFrom: "#1f8a8a",
    gradientTo: "#0d6b6b",
    emoji: "🌴",
    description:
      "Reggae rhythms, lush rainforests, cascading waterfalls, and legendary island hospitality.",
    tags: ["Music", "Nature", "Adventure"],
  },
  {
    id: 3,
    name: "Trinidad & Tobago",
    slug: "trinidad",
    tagline: "Land of Steel Pan",
    country: "T&T",
    gradientFrom: "#163352",
    gradientTo: "#8a9dab",
    emoji: "🎺",
    description:
      "Carnival capital of the world with vibrant festivals, diverse cuisine, and stunning rainforests.",
    tags: ["Carnival", "Food", "Culture"],
  },
  {
    id: 4,
    name: "St. Lucia",
    slug: "saint-lucia",
    tagline: "Helen of the West Indies",
    country: "St. Lucia",
    gradientFrom: "#0d6b6b",
    gradientTo: "#1f476c",
    emoji: "🏔️",
    description:
      "Dramatic volcanic peaks, lush rainforests, and secluded luxury retreats define this jewel island.",
    tags: ["Luxury", "Nature", "Romance"],
  },
  {
    id: 5,
    name: "Antigua",
    slug: "antigua",
    tagline: "365 Beaches to Discover",
    country: "Antigua & Barbuda",
    gradientFrom: "#c4643e",
    gradientTo: "#1f476c",
    emoji: "🏖️",
    description:
      "A beach for every day of the year, from secluded coves to lively shores and world-class sailing.",
    tags: ["Beach", "Sailing", "Resorts"],
  },
  {
    id: 6,
    name: "Cayman Islands",
    slug: "grand-cayman",
    tagline: "World-Class Diving",
    country: "Cayman Islands",
    gradientFrom: "#1f8a8a",
    gradientTo: "#163352",
    emoji: "🤿",
    description:
      "Pristine waters, underwater caves, and legendary stingray encounters in the clearest seas on earth.",
    tags: ["Diving", "Luxury", "Beach"],
  },
];

export const categories: Category[] = [
  {
    id: 1,
    name: "Beach Escapes",
    description:
      "Discover pristine sands and turquoise waters perfect for pure relaxation.",
    icon: "🏖️",
    count: "120+ experiences",
    accentColor: "#1f476c",
  },
  {
    id: 2,
    name: "Adventure & Sports",
    description:
      "From zip-lining through rainforests to kitesurfing on open waters.",
    icon: "🧗",
    count: "85+ experiences",
    accentColor: "#1f8a8a",
  },
  {
    id: 3,
    name: "Culture & Heritage",
    description:
      "Immerse yourself in rich history, vibrant festivals, and local art.",
    icon: "🎭",
    count: "200+ experiences",
    accentColor: "#8a9dab",
  },
  {
    id: 4,
    name: "Luxury Resorts",
    description:
      "World-class accommodations with breathtaking ocean and mountain views.",
    icon: "🏨",
    count: "60+ properties",
    accentColor: "#f37e5b",
  },
  {
    id: 5,
    name: "Water Sports",
    description:
      "Dive, snorkel, surf, and sail in the clearest waters on earth.",
    icon: "🤿",
    count: "95+ activities",
    accentColor: "#1f476c",
  },
  {
    id: 6,
    name: "Food & Cuisine",
    description:
      "Savor spiced rums, fresh seafood, and bold Caribbean flavors.",
    icon: "🍽️",
    count: "150+ restaurants",
    accentColor: "#1f8a8a",
  },
];

export const stats = [
  { value: "30+", label: "Islands" },
  { value: "500+", label: "Destinations" },
  { value: "50K+", label: "Happy Travelers" },
];

export const ctaTrustPoints = [
  "No booking fees",
  "Curated by locals",
  "Trusted by 50,000+ travelers",
];
