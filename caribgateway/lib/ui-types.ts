export interface Destination {
  id: number;
  name: string;
  tagline: string;
  country: string;
  gradientFrom: string;
  gradientTo: string;
  emoji: string;
  description: string;
  tags: string[];
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  count: string;
  accentColor: string;
}

export interface NavLink {
  label: string;
  href: string;
}
