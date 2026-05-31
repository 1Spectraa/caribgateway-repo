/**
 * lib/types/index.ts
 *
 * Clean application-level types consumed by components and server actions.
 * These are derived from (or extend) the raw database row types but are
 * shaped for UI use — joins resolved, nulls narrowed, display helpers added.
 */

import type {
  CountryRow,
  DestinationRow,
  CategoryRow,
  BusinessRow,
  BusinessImageRow,
  TagRow,
  BusinessType,
  DestinationType,
  PriceRange,
  PublishStatus,
} from "@/lib/database.types";

// Re-export enums so consumers only need one import path
export type {
  BusinessType,
  DestinationType,
  PriceRange,
  PublishStatus,
} from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Country
// ---------------------------------------------------------------------------

export type Country = CountryRow;

// ---------------------------------------------------------------------------
// Destination
// ---------------------------------------------------------------------------

export type Destination = DestinationRow;

/** Destination with its parent country resolved */
export interface DestinationWithCountry extends DestinationRow {
  country: Country;
}

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export type Category = CategoryRow;

/** Flat category with optional children (for nav/filter trees) */
export interface CategoryWithChildren extends CategoryRow {
  children: CategoryRow[];
}

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------

export type Business = BusinessRow;

/** Full business detail — all FK relations resolved */
export interface BusinessWithDetails extends BusinessRow {
  destination: DestinationWithCountry;
  category: Category;
  images: BusinessImageRow[];
  tags: TagRow[];
}

/** Lightweight card variant used in list views */
export interface BusinessCard {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  business_type: BusinessType;
  price_range: PriceRange | null;
  avg_rating: number | null;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  city: string | null;
  destination_name: string;
  destination_slug: string;
  country_name: string;
  primary_image_url: string | null;
  primary_image_alt: string | null;
}

// ---------------------------------------------------------------------------
// Business Image
// ---------------------------------------------------------------------------

export type BusinessImage = BusinessImageRow;

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

export type Tag = TagRow;

// ---------------------------------------------------------------------------
// Search / filter parameters
// ---------------------------------------------------------------------------

export interface BusinessFilters {
  destination_slug?: string;
  country_slug?: string;
  destination_type?: DestinationType;
  business_type?: BusinessType;
  category_slug?: string;
  price_range?: PriceRange[];
  tag_slugs?: string[];
  status?: PublishStatus;
  is_featured?: boolean;
  is_verified?: boolean;
  min_rating?: number;
  search?: string;
}

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ---------------------------------------------------------------------------
// Display helpers (non-DB — used in components)
// ---------------------------------------------------------------------------

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  hotel: "Hotels & Accommodation",
  restaurant: "Restaurants & Dining",
  attraction: "Attractions",
  tour_operator: "Tour Operators",
  transportation: "Transportation",
};

export const BUSINESS_TYPE_ICONS: Record<BusinessType, string> = {
  hotel: "🏨",
  restaurant: "🍽️",
  attraction: "🎭",
  tour_operator: "🗺️",
  transportation: "🚗",
};

export const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
  budget: "Budget",
  moderate: "Moderate",
  upscale: "Upscale",
  luxury: "Luxury",
};

export const PRICE_RANGE_SYMBOLS: Record<PriceRange, string> = {
  budget: "$",
  moderate: "$$",
  upscale: "$$$",
  luxury: "$$$$",
};
