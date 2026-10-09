from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.logging import logger
from ..models.models import User, Product, Location
from ..schemas.schemas import ExportFilterRequest
from ..services.export_service import ExportService
from .deps import get_current_user

router = APIRouter(prefix="/export", tags=["Data Export"])

@router.get("/options")
def get_export_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns available filter dimensions (brands, platforms, locations, categories) for Excel export.
    """
    brands = [b[0] for b in db.query(Product.brand).filter(Product.brand.isnot(None)).distinct().all() if b[0]]
    platforms = [p[0] for p in db.query(Product.platform).distinct().all() if p[0]]
    categories = [c[0] for c in db.query(Product.category).distinct().all() if c[0]]
    locations = [
        {"id": loc.id, "city": loc.city, "area": loc.area, "pincode": loc.pincode}
        for loc in db.query(Location).all()
    ]

    return {
        "brands": sorted(brands),
        "platforms": sorted(platforms),
        "categories": sorted(categories),
        "locations": locations,
        "available_metrics": [
            "Brand", "Product Name", "Canonical Product Name", "Platform",
            "External Product ID", "Location", "Store ID", "Price",
            "MRP", "Offer Price", "Inventory", "Availability", "ETA",
            "Sales Quantity (Source Status Disclosed)", "Fetched At",
            "Data Source", "Duplicate Group ID", "Match Confidence"
        ],
        "sales_data_notice": "Live authorized APIs currently provide product catalog, pricing, availability and inventory. Sales orders require dedicated seller ERP integration."
    }

@router.post("/excel")
def export_data_to_excel(
    filter_req: ExportFilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates and streams a clean, structured Multi-Brand Excel (.xlsx) workbook
    filtered by Brand, Platform, Location, and Date ranges from PostgreSQL/SQLite.
    """
    try:
        excel_buffer = ExportService.generate_excel_export(
            db=db,
            filters=filter_req,
            user_email=current_user.email
        )

        filename = f"QuickSync_MultiBrand_Export_{current_user.role}.xlsx"

        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        logger.error(f"Excel generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate Excel export: {str(e)}")

@router.get("/excel")
def export_data_to_excel_get(
    brand: List[str] = Query(None),
    platform: List[str] = Query(None),
    category: List[str] = Query(None),
    city: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET alternative for direct browser URL downloads with query parameters.
    """
    filter_req = ExportFilterRequest(
        brands=brand,
        platforms=platform,
        categories=category,
        city=city
    )
    return export_data_to_excel(filter_req=filter_req, db=db, current_user=current_user)
