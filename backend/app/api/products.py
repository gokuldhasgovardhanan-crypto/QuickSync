from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.models import Product, PriceSnapshot, InventorySnapshot, DeliveryEtaSnapshot, User
from ..schemas.schemas import ProductDetailOut, PriceSnapshotOut, InventorySnapshotOut
from .deps import get_current_user

router = APIRouter(prefix="/products", tags=["Products & Catalogs"])

@router.get("", response_model=List[dict])
def get_products(
    platform: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if platform and platform != "ALL":
        query = query.filter(Product.platform == platform)
    if q:
        query = query.filter(Product.name.ilike(f"%{q}%") | Product.brand.ilike(f"%{q}%"))
    
    products = query.order_by(Product.updated_at.desc()).offset(offset).limit(limit).all()
    
    results = []
    for p in products:
        # Latest price snapshot
        latest_price = db.query(PriceSnapshot).filter(
            PriceSnapshot.product_id == p.id
        ).order_by(PriceSnapshot.fetched_at.desc()).first()

        latest_inv = db.query(InventorySnapshot).filter(
            InventorySnapshot.product_id == p.id
        ).order_by(InventorySnapshot.fetched_at.desc()).first()

        results.append({
            "id": p.id,
            "external_product_id": p.external_product_id,
            "platform": p.platform,
            "name": p.name,
            "brand": p.brand,
            "quantity": p.quantity,
            "image_url": p.image_url,
            "deeplink": p.deeplink,
            "rating": p.rating,
            "rating_count": p.rating_count,
            "current_price": latest_price.offer_price if latest_price else None,
            "mrp": latest_price.mrp if latest_price else None,
            "discount_percentage": latest_price.discount_percentage if latest_price else None,
            "available": latest_inv.available if latest_inv else True,
            "inventory": latest_inv.inventory if latest_inv else None,
            "last_fetched": latest_price.fetched_at.isoformat() if latest_price else p.updated_at.isoformat(),
            "request_id": latest_price.request_id if latest_price else None
        })
    return results

@router.get("/{id}", response_model=ProductDetailOut)
def get_product_details(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    price_history = db.query(PriceSnapshot).filter(
        PriceSnapshot.product_id == id
    ).order_by(PriceSnapshot.fetched_at.desc()).limit(30).all()

    inv_history = db.query(InventorySnapshot).filter(
        InventorySnapshot.product_id == id
    ).order_by(InventorySnapshot.fetched_at.desc()).limit(30).all()

    latest_eta_rec = db.query(DeliveryEtaSnapshot).filter(
        DeliveryEtaSnapshot.platform == product.platform
    ).order_by(DeliveryEtaSnapshot.fetched_at.desc()).first()

    return ProductDetailOut(
        id=product.id,
        external_product_id=product.external_product_id,
        platform=product.platform,
        name=product.name,
        brand=product.brand,
        quantity=product.quantity,
        image_url=product.image_url,
        deeplink=product.deeplink,
        rating=product.rating,
        rating_count=product.rating_count,
        latest_price=price_history[0] if price_history else None,
        latest_inventory=inv_history[0] if inv_history else None,
        latest_eta=latest_eta_rec.eta_minutes if latest_eta_rec else None,
        price_history=price_history,
        inventory_history=inv_history,
        created_at=product.created_at,
        updated_at=product.updated_at
    )
