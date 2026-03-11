export type UserRole = "landlord" | "renter";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  landlord_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  property_type: "apartment" | "house" | "condo" | "townhouse" | "commercial";
  total_units: number;
  year_built?: number;
  amenities: string[];
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  rent_amount: number;
  deposit_amount: number;
  status: "available" | "occupied" | "maintenance" | "reserved";
  floor?: number;
  features: string[];
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  property_id: string;
  unit_id: string;
  title: string;
  description: string;
  rent_amount: number;
  available_date: string;
  lease_term_months: number;
  status: "draft" | "active" | "paused" | "rented";
  ai_generated: boolean;
  syndication_targets: SyndicationTarget[];
  syndication_status: Record<string, "pending" | "synced" | "failed">;
  views: number;
  inquiries: number;
  created_at: string;
  updated_at: string;
  property?: Property;
  unit?: Unit;
}

export type SyndicationTarget =
  | "zillow"
  | "apartments_com"
  | "facebook_marketplace"
  | "craigslist";

export interface Application {
  id: string;
  listing_id: string;
  renter_id: string;
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "withdrawn";
  monthly_income: number;
  employment_status: string;
  employer_name?: string;
  employment_years?: number;
  credit_score_range: string;
  has_pets: boolean;
  pet_details?: string;
  move_in_date: string;
  additional_notes?: string;
  documents: string[];
  screening_status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
  listing?: Listing;
  renter?: UserProfile;
}

export interface Lease {
  id: string;
  property_id: string;
  unit_id: string;
  landlord_id: string;
  renter_id: string;
  application_id?: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  status: "active" | "expired" | "terminated" | "renewed";
  payment_due_day: number;
  late_fee_amount: number;
  late_fee_grace_days: number;
  autopay_enabled: boolean;
  documents: string[];
  created_at: string;
  updated_at: string;
  property?: Property;
  unit?: Unit;
  renter?: UserProfile;
}

export interface Payment {
  id: string;
  lease_id: string;
  renter_id: string;
  landlord_id: string;
  amount: number;
  type: "rent" | "deposit" | "late_fee" | "maintenance" | "other";
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  due_date: string;
  paid_date?: string;
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: string;
  property_id: string;
  unit_id?: string;
  lease_id?: string;
  renter_id: string;
  landlord_id: string;
  title: string;
  description: string;
  category:
    | "plumbing"
    | "electrical"
    | "hvac"
    | "appliance"
    | "structural"
    | "other";
  priority: "low" | "medium" | "high" | "emergency";
  status: "open" | "in_progress" | "completed" | "cancelled";
  photos: string[];
  landlord_notes?: string;
  scheduled_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
  property?: Property;
  unit?: Unit;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  listing_id?: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: UserProfile;
}

export interface Conversation {
  id: string;
  landlord_id: string;
  renter_id: string;
  property_id?: string;
  listing_id?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
  landlord?: UserProfile;
  renter?: UserProfile;
  property?: Property;
  messages?: Message[];
}

export interface RenterProfile {
  id: string;
  user_id: string;
  monthly_income?: number;
  employment_status?: string;
  employer_name?: string;
  credit_score_range?: string;
  rental_history: RentalHistoryEntry[];
  references: Reference[];
  income_verification_docs: string[];
  has_pets: boolean;
  pet_details?: string;
  move_in_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RentalHistoryEntry {
  address: string;
  landlord_name: string;
  landlord_contact?: string;
  monthly_rent: number;
  start_date: string;
  end_date?: string;
  reason_for_leaving?: string;
}

export interface Reference {
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
}

export interface PriceRecommendation {
  recommended_price: number;
  min_price: number;
  max_price: number;
  avg_comparable: number;
  confidence: "low" | "medium" | "high";
  comparables_count: number;
}

export interface SearchFilters {
  city?: string;
  state?: string;
  zip_code?: string;
  min_rent?: number;
  max_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: string;
  amenities?: string[];
  available_from?: string;
  pets_allowed?: boolean;
  latitude?: number;
  longitude?: number;
  radius_miles?: number;
}
