/**
 * database.types.ts
 *
 * Manually-maintained Supabase schema types, following the same interface
 * shape that `supabase gen types typescript` would produce.
 *
 * When you run `supabase gen types typescript --local > lib/database.types.ts`
 * this file will be replaced with the auto-generated version. Until then,
 * keep it in sync with the SQL migrations in /supabase/migrations/.
 */

// ---------------------------------------------------------------------------
// Enum literals (mirrors SQL migrations)
// ---------------------------------------------------------------------------

export type UserRole = "user" | "business_owner" | "admin";

export type BusinessType =
  | "hotel"
  | "restaurant"
  | "attraction"
  | "tour_operator"
  | "transportation";

export type DestinationType =
  | "island"
  | "town"
  | "beach"
  | "area"
  | "region";

export type PriceRange = "budget" | "moderate" | "upscale" | "luxury";

export type PublishStatus = "draft" | "published" | "archived";

// ---------------------------------------------------------------------------
// JSONB shapes (strongly typed for safer data access)
// ---------------------------------------------------------------------------

export interface DayHours {
  open: string | null;    // "09:00" 24-h
  close: string | null;   // "17:00"
  is_closed: boolean;
}

export interface HoursOfOperation {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  /** Overrides for public holidays or special dates */
  exceptions?: Record<string, DayHours>;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tripadvisor?: string;
  google_maps?: string;
  youtube?: string;
  tiktok?: string;
}

/** Type-specific extension data stored in businesses.metadata */
export interface HotelMetadata {
  star_rating?: 1 | 2 | 3 | 4 | 5;
  check_in?: string;          // "14:00"
  check_out?: string;         // "11:00"
  total_rooms?: number;
  pool?: boolean;
  gym?: boolean;
  spa?: boolean;
  beach_access?: boolean;
  all_inclusive?: boolean;
}

export interface RestaurantMetadata {
  cuisine_types?: string[];
  reservation_required?: boolean;
  outdoor_seating?: boolean;
  delivery_available?: boolean;
  halal?: boolean;
  vegetarian_options?: boolean;
  vegan_options?: boolean;
}

export interface AttractionMetadata {
  duration_minutes?: number;
  age_min?: number;
  age_max?: number;
  guided_only?: boolean;
  outdoor?: boolean;
}

export interface TourOperatorMetadata {
  tour_types?: string[];
  max_group_size?: number;
  languages_spoken?: string[];
  pickup_available?: boolean;
}

export interface TransportationMetadata {
  vehicle_types?: string[];
  service_area?: string;
  airport_transfers?: boolean;
  driver_included?: boolean;
}

export type BusinessMetadata =
  | HotelMetadata
  | RestaurantMetadata
  | AttractionMetadata
  | TourOperatorMetadata
  | TransportationMetadata
  | Record<string, unknown>;

// ---------------------------------------------------------------------------
// Table row types  (mirrors each SQL table)
// ---------------------------------------------------------------------------

export type CountryRow = {
  id: string;
  name: string;
  iso_code: string;
  iso_code_3: string | null;
  slug: string;
  flag_emoji: string | null;
  description: string | null;
  capital: string | null;
  currency_code: string | null;
  languages: string[];
  timezone: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DestinationRow = {
  id: string;
  country_id: string;
  name: string;
  slug: string;
  destination_type: DestinationType;
  short_description: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  hero_image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessRow = {
  id: string;
  destination_id: string;
  category_id: string;
  business_type: BusinessType;
  owner_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  social_links: SocialLinks;
  price_range: PriceRange | null;
  hours_of_operation: HoursOfOperation;
  amenities: string[];
  features: string[];
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  status: PublishStatus;
  avg_rating: number | null;
  review_count: number;
  metadata: BusinessMetadata;
  created_at: string;
  updated_at: string;
};

export type BusinessImageRow = {
  id: string;
  business_id: string;
  url: string;
  storage_path: string | null;
  alt_text: string | null;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type TagRow = {
  id: string;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
  created_at: string;
};

export type BusinessTagRow = {
  business_id: string;
  tag_id: string;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessServiceRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_unit: "fixed" | "per_person" | "per_night" | "per_hour" | "from";
  currency: string;
  duration_minutes: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type BusinessServiceInsert = {
  id?: string;
  business_id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  price_unit?: BusinessServiceRow["price_unit"];
  currency?: string;
  duration_minutes?: number | null;
  is_active?: boolean;
  sort_order?: number;
};

// ---------------------------------------------------------------------------
// Insert / Update types
// ---------------------------------------------------------------------------

export type CountryInsert = Omit<CountryRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
};
export type CountryUpdate = Partial<CountryInsert>;

export type DestinationInsert = {
  id?: string;
  country_id: string;
  name: string;
  slug: string;
  destination_type?: DestinationType;
  short_description?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hero_image_url?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
  metadata?: Record<string, unknown>;
};
export type DestinationUpdate = Partial<DestinationInsert>;

export type CategoryInsert = Omit<CategoryRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
};
export type CategoryUpdate = Partial<CategoryInsert>;

export type BusinessInsert = {
  id?: string;
  destination_id: string;
  category_id: string;
  business_type: BusinessType;
  owner_id?: string | null;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  social_links?: SocialLinks;
  price_range?: PriceRange | null;
  hours_of_operation?: HoursOfOperation;
  amenities?: string[];
  features?: string[];
  is_verified?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  status?: PublishStatus;
  avg_rating?: number | null;
  review_count?: number;
  metadata?: BusinessMetadata;
};
export type BusinessUpdate = Partial<BusinessInsert>;

export type BusinessImageInsert = {
  id?: string;
  business_id: string;
  url: string;
  storage_path?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  is_primary?: boolean;
  sort_order?: number;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  file_size?: number | null;
};

export type TagInsert = Omit<TagRow, "id" | "created_at"> & { id?: string };

// ---------------------------------------------------------------------------
// Database interface (Supabase client expects this shape)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      countries: {
        Row: CountryRow;
        Insert: CountryInsert;
        Update: CountryUpdate;
        Relationships: [];
      };
      destinations: {
        Row: DestinationRow;
        Insert: DestinationInsert;
        Update: DestinationUpdate;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [];
      };
      businesses: {
        Row: BusinessRow;
        Insert: BusinessInsert;
        Update: BusinessUpdate;
        Relationships: [];
      };
      business_images: {
        Row: BusinessImageRow;
        Insert: BusinessImageInsert;
        Update: Partial<BusinessImageInsert>;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: TagInsert;
        Update: Partial<TagInsert>;
        Relationships: [];
      };
      business_tags: {
        Row: BusinessTagRow;
        Insert: Omit<BusinessTagRow, "created_at">;
        Update: Partial<Omit<BusinessTagRow, "created_at">>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      business_services: {
        Row: BusinessServiceRow;
        Insert: BusinessServiceInsert;
        Update: Partial<BusinessServiceInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: {
      business_type: BusinessType;
      destination_type: DestinationType;
      price_range: PriceRange;
      publish_status: PublishStatus;
      user_role: UserRole;
    };
    Functions: {
      slugify: {
        Args: { value: string };
        Returns: string;
      };
    };
  };
}
