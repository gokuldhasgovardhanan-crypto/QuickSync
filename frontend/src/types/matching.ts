export type MatchConfidenceLevel =
  | 'HIGH_CONFIDENCE'
  | 'MEDIUM_CONFIDENCE'
  | 'LOW_CONFIDENCE'
  | 'UNMATCHED'
  | 'REQUIRES_REVIEW';

export type MatchReviewStatus =
  | 'AUTO_MATCHED'
  | 'PENDING_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED';

export interface MatchingAttributesEvidence {
  gtin_match?: boolean;
  brand_match?: boolean;
  pack_match?: boolean;
  variant_compatible?: boolean;
  name_similarity?: number;
  jaccard_token_similarity?: number;
  sequence_similarity?: number;
  signals?: string[];
  [key: string]: any;
}

export interface ProductIdentityMatch {
  id: string;
  canonical_product_id: string;
  canonical_code: string;
  canonical_name: string;
  canonical_brand?: string;
  product_id: string;
  platform: string;
  platform_product_name: string;
  platform_brand?: string;
  platform_quantity?: string;
  offer_price?: number;
  mrp?: number;
  current_stock?: number;
  image_url?: string;
  match_score: number;
  confidence_level: MatchConfidenceLevel;
  match_reason: string;
  matching_attributes: MatchingAttributesEvidence;
  status: MatchReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface CanonicalProduct {
  id: string;
  canonical_code: string;
  canonical_name: string;
  brand?: string;
  normalized_name: string;
  quantity?: string;
  normalized_quantity?: string;
  category?: string;
  gtin?: string;
  image_url?: string;
  linked_products_count: number;
  created_at: string;
  updated_at: string;
}

export interface MatchReviewRequest {
  decision: 'ACCEPTED' | 'REJECTED';
  reason?: string;
  target_canonical_id?: string;
}

export interface MatchReviewResult {
  success: boolean;
  match_id: string;
  decision: string;
  canonical_product_id: string;
  message: string;
  timestamp: string;
}

export interface MatchEngineStats {
  total_platform_products: number;
  total_canonical_products: number;
  high_confidence_matches: number;
  medium_confidence_matches: number;
  low_confidence_matches: number;
  pending_review_count: number;
  accepted_matches_count: number;
  rejected_matches_count: number;
  unmatched_count: number;
  last_engine_run_at?: string;
}
