from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.logging import logger
from ..models.models import User
from ..schemas.schemas import (
    CanonicalProductOut, ProductIdentityMatchOut,
    MatchReviewRequest, MatchReviewResult, MatchEngineStatsOut
)
from ..services.matching_service import MatchingService
from .deps import get_current_user

router = APIRouter(prefix="/products", tags=["Product Identity & Matching"])

@router.get("/matches", response_model=List[ProductIdentityMatchOut])
def get_product_matches(
    confidence: Optional[str] = Query(None, description="HIGH_CONFIDENCE, MEDIUM_CONFIDENCE, LOW_CONFIDENCE, REQUIRES_REVIEW"),
    status: Optional[str] = Query(None, description="AUTO_MATCHED, PENDING_REVIEW, ACCEPTED, REJECTED"),
    platform: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns detected cross-platform product identity matches with confidence scores and signal evidence.
    """
    return MatchingService.get_product_matches(
        db=db,
        confidence_level=confidence,
        status=status,
        platform=platform,
        limit=limit
    )

@router.get("/canonical", response_model=List[CanonicalProductOut])
def get_canonical_products(
    brand: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns canonical product identities (QS-PROD-XXXXXX) with linked multi-platform SKUs count.
    """
    return MatchingService.get_canonical_products(
        db=db,
        brand=brand,
        category=category,
        limit=limit
    )

@router.post("/matches/{match_id}/review", response_model=MatchReviewResult)
def review_product_match(
    match_id: str,
    review_req: MatchReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Records a human admin/analyst decision for medium/low confidence matches (ACCEPT MATCH / REJECT MATCH).
    Never silently merges uncertain products without human sign-off.
    """
    return MatchingService.review_match(
        db=db,
        match_id=match_id,
        decision=review_req.decision,
        reviewer_id=current_user.email,
        reason=review_req.reason,
        target_canonical_id=review_req.target_canonical_id
    )

@router.post("/match-engine/run", response_model=MatchEngineStatsOut)
def trigger_product_matching_engine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers the multi-signal cross-platform normalization & identity clustering pipeline.
    """
    if current_user.role not in ["ADMIN", "OPERATOR"]:
        raise HTTPException(status_code=403, detail="Only Admins & Operators can trigger the Product Matching Engine.")
    
    return MatchingService.run_product_matching_pipeline(db=db)

@router.get("/match-engine/stats", response_model=MatchEngineStatsOut)
def get_match_engine_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns summary statistics of product identity matching, clusters, and pending reviews.
    """
    return MatchingService.get_matching_stats(db=db)
