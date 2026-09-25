export const USER_ROLES = ['admin', 'user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PRODUCT_TYPES = ['product', 'service'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_STATUSES = ['active', 'inactive', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const CURRENCIES = ['AOA'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface User {
  [key: string]: unknown;
  cuid: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface Store {
  [key: string]: unknown;
  cuid: string;
  user_cuid: string;
  name: string;
  description: string | null;
  avatar: string | null;
  cover: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  social_links: SocialLinks;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  [key: string]: unknown;
  cuid: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  [key: string]: unknown;
  cuid: string;
  store_cuid: string;
  category_cuid: string;
  type: ProductType;
  name: string;
  price: number;
  currency: Currency;
  description: string | null;
  cover: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface StoreHours {
  [key: string]: unknown;
  cuid: string;
  store_cuid: string;
  day_of_week: DayOfWeek;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchProduct {
  [key: string]: unknown;
  product_cuid: string;
  store_cuid: string;
  type: ProductType;
  name: string;
  price: number;
  currency: Currency;
  description: string | null;
  cover: string | null;
  status: ProductStatus;
  category_name: string;
  store_name: string;
  store_is_private: boolean;
  store_city: string | null;
  store_province: string | null;
  store_address: string | null;
  store_phone: string | null;
  store_whatsapp: string | null;
  store_website: string | null;
  store_social_links: SocialLinks;
  store_latitude: number;
  store_longitude: number;
  distance_meters: number | null;
  relevance_rank: number;
}

export interface SearchCursor {
  relevanceRank: number;
  distanceMeters: number | null;
  cuid: string;
}

export interface StoreWithProducts {
  store: Store;
  hours: StoreHours[];
  products: Product[];
}

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12.2.3';
  };
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'cuid' | 'created_at' | 'updated_at'> & {
          cuid?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<User, 'cuid'>>;
        Relationships: [];
      };
      stores: {
        Row: Store;
        Insert: Omit<Store, 'cuid' | 'created_at' | 'updated_at'> & {
          cuid?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Store, 'cuid'>>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'cuid' | 'created_at' | 'updated_at'> & {
          cuid?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Category, 'cuid'>>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'cuid' | 'created_at' | 'updated_at'> & {
          cuid?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Product, 'cuid'>>;
        Relationships: [];
      };
      store_hours: {
        Row: StoreHours;
        Insert: Omit<StoreHours, 'cuid' | 'created_at' | 'updated_at'> & {
          cuid?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<StoreHours, 'cuid'>>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      bootstrap_application: {
        Args: {
          p_name: string;
          p_email: string;
          p_latitude: number;
          p_longitude: number;
        };
        Returns: Json;
      };
      search_products: {
        Args: {
          p_search?: string | null;
          p_latitude?: number | null;
          p_longitude?: number | null;
          p_cursor_rank?: number | null;
          p_cursor_distance?: number | null;
          p_cursor_id?: string | null;
          p_limit?: number;
        };
        Returns: SearchProduct[];
      };
      get_product_details: {
        Args: { p_product_cuid: string };
        Returns: Json;
      };
      get_public_store: {
        Args: { p_store_cuid: string };
        Returns: Json;
      };
      get_store_catalog: {
        Args: { p_store_cuid: string };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      product_type: ProductType;
      product_status: ProductStatus;
    };
    CompositeTypes: {};
  };
};
