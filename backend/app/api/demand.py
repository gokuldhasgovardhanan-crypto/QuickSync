from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.models import User, Product, SellerDecisionLog, CustomerFeedback
from ..schemas.schemas import (
    DemandDashboardSummaryOut, ProductDemandAnalysisOut,
    SellerDecisionRequest, SellerDecisionResult, SellerDecisionLogOut,
    CustomerFeedbackOut
)
from ..services.demand_service import DemandService
from .deps import get_current_user, RequireRole

router = APIRouter(prefix="/demand", tags=["Demand-Driven Product Management"])

@router.get("/summary", response_model=DemandDashboardSummaryOut)
def get_demand_dashboard_summary(
    period_days: int = Query(14, description="Comparison window in days (7, 14, or 30)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns aggregated demand classification, high-demand/low-stock alerts,
    replenishment/replacement/discontinuation recommendations, and real customer feedback signals.
    """
    return DemandService.get_dashboard_summary(db=db, period_days=period_days)

@router.get("/products", response_model=List[ProductDemandAnalysisOut])
def get_products_demand_analysis(
    classification: Optional[str] = Query("ALL", description="INCREASING_DEMAND, STABLE_DEMAND, DECLINING_DEMAND, INSUFFICIENT_DATA, or ALL"),
    category: Optional[str] = Query("ALL", description="Category filter or ALL"),
    lifecycle_status: Optional[str] = Query("ALL", description="ACTIVE, UNDER_REVIEW, REPLENISHMENT_RECOMMENDED, etc., or ALL"),
    search: Optional[str] = Query(None, description="Search product name or brand"),
    period_days: int = Query(14, description="Analysis window in days (7, 14, 30)"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns granular demand analysis for products matching filter criteria.
    """
    query = db.query(Product)
    
    if category and category != "ALL":
        query = query.filter(Product.category == category)
    if lifecycle_status and lifecycle_status != "ALL":
        query = query.filter(Product.lifecycle_status == lifecycle_status)
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | Product.brand.ilike(f"%{search}%")
        )

    products = query.limit(limit).all()
    results = []
    
    for p in products:
        analysis = DemandService.get_product_demand_analysis(p, db, period_days=period_days)
        if classification and classification != "ALL":
            if analysis.demand_classification != classification:
                continue
        results.append(analysis)

    return results

@router.get("/products/{product_id}", response_model=ProductDemandAnalysisOut)
def get_single_product_demand(
    product_id: str,
    period_days: int = Query(14, description="Analysis window in days (7, 14, 30)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return DemandService.get_product_demand_analysis(product, db, period_days=period_days)

@router.get("/feedback/{product_id}", response_model=List[CustomerFeedbackOut])
def get_product_customer_feedback(
    product_id: str,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns real customer feedback, sentiment, tags, and reviews for a product.
    If no feedback exists, returns an empty list.
    """
    feedbacks = db.query(CustomerFeedback).filter(
        CustomerFeedback.product_id == product_id
    ).order_by(CustomerFeedback.created_at.desc()).limit(limit).all()
    
    return feedbacks

@router.post("/decision", response_model=SellerDecisionResult)
async def submit_seller_decision(
    req: SellerDecisionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Seller Decision Engine Execution:
    Allows sellers/operators to approve Replenishment, Replacement, Discontinuation, or Keep Monitoring.
    Writes full audit log and broadcasts real-time WebSocket update.
    """
    if current_user.role not in ["ADMIN", "OPERATOR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admins and Operators can execute product decisions.")
    try:
        ip = request.client.host if request.client else "127.0.0.1"
        result = await DemandService.execute_seller_decision(
            db=db,
            product_id=req.product_id,
            decision=req.decision,
            user_email=current_user.email,
            recommendation_id=req.recommendation_id,
            replenishment_quantity=req.replenishment_quantity,
            target_replacement_product_id=req.target_replacement_product_id,
            notes=req.notes,
            ip_address=ip
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process seller decision: {str(e)}")

@router.get("/audit-logs", response_model=List[SellerDecisionLogOut])
def get_seller_decision_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the complete decision audit trail for all product lifecycle actions.
    """
    logs = db.query(SellerDecisionLog).order_by(SellerDecisionLog.timestamp.desc()).limit(limit).all()
    results = []
    for log in logs:
        prod = db.query(Product).filter(Product.id == log.product_id).first()
        results.append(SellerDecisionLogOut(
            id=log.id,
            product_id=log.product_id,
            product_name=prod.name if prod else "Unknown Product",
            product_brand=prod.brand if prod else None,
            platform=prod.platform if prod else None,
            recommendation_id=log.recommendation_id,
            recommendation_type=log.recommendation_type,
            decision=log.decision,
            seller_email=log.seller_email,
            data_period=log.data_period,
            evidence_summary=log.evidence_summary,
            action_attempted=log.action_attempted,
            action_result=log.action_result,
            notes=log.notes,
            timestamp=log.timestamp
        ))
    return results
