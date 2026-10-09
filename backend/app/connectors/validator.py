from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone
from ..schemas.schemas import NormalizedProductItem

class ValidationResult:
    def __init__(self, is_valid: bool, errors: List[str], normalized_item: Optional[NormalizedProductItem] = None):
        self.is_valid = is_valid
        self.errors = errors
        self.normalized_item = normalized_item

class DataValidator:
    """
    Validates and normalizes raw quick-commerce API items.
    Strictly ensures:
    - product ID, name, platform, valid price (>= 0)
    - Valid inventory (>= 0) if present
    - Valid ETA (>= 0) if present
    - Missing fields are kept as None/null (never fake data).
    """

    @staticmethod
    def normalize_item(raw_item: Dict[str, Any], default_platform: str, request_id: Optional[str] = None, raw_response_id: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None) -> ValidationResult:
        errors = []
        
        # 1. Platform Resolution
        platform = raw_item.get("platform") or raw_item.get("source") or default_platform
        if not platform:
            errors.append("Missing required field: platform")

        # 2. Product External ID
        external_id = str(
            raw_item.get("external_product_id") or
            raw_item.get("product_id") or
            raw_item.get("item_id") or
            raw_item.get("id") or ""
        ).strip()
        if not external_id:
            errors.append("Missing required field: external_product_id")

        # 3. Product Name / Title
        name = str(raw_item.get("name") or raw_item.get("title") or raw_item.get("product_name") or "").strip()
        if not name:
            errors.append("Missing required field: name")

        # 4. Brand
        brand = raw_item.get("brand") or raw_item.get("brand_name")
        if brand is not None:
            brand = str(brand).strip() or None

        # 5. Quantity / Pack Size
        quantity = raw_item.get("quantity") or raw_item.get("unit") or raw_item.get("pack_size") or raw_item.get("weight")
        if quantity is not None:
            quantity = str(quantity).strip() or None

        # 6. Pricing Validation
        raw_price = raw_item.get("offer_price")
        if raw_price is None:
            raw_price = raw_item.get("price")
        if raw_price is None:
            raw_price = raw_item.get("selling_price")
        if raw_price is None:
            raw_price = raw_item.get("current_price")

        offer_price: Optional[float] = None
        try:
            if raw_price is not None:
                offer_price = float(raw_price)
                if offer_price < 0:
                    errors.append(f"Invalid price value: {offer_price} (must be >= 0)")
            else:
                errors.append("Missing required field: price/offer_price")
        except (ValueError, TypeError):
            errors.append(f"Non-numeric price format: {raw_price}")

        # MRP
        raw_mrp = raw_item.get("mrp") or raw_item.get("original_price") or raw_item.get("strike_price")
        mrp: Optional[float] = None
        if raw_mrp is not None:
            try:
                mrp = float(raw_mrp)
                if mrp < 0:
                    mrp = None
            except (ValueError, TypeError):
                mrp = None

        # Discount Percentage Calculation
        discount_percentage: Optional[float] = None
        raw_discount = raw_item.get("discount_percentage") or raw_item.get("discount")
        if raw_discount is not None:
            try:
                discount_percentage = float(raw_discount)
            except (ValueError, TypeError):
                discount_percentage = None
        elif mrp and offer_price and mrp > offer_price:
            discount_percentage = round(((mrp - offer_price) / mrp) * 100.0, 1)

        # 7. Availability & Inventory
        available = True
        raw_avail = raw_item.get("available")
        if raw_avail is None:
            raw_avail = raw_item.get("is_available")
        if raw_avail is None:
            raw_avail = raw_item.get("in_stock")
        if raw_avail is not None:
            available = bool(raw_avail)

        inventory: Optional[int] = None
        raw_inv = raw_item.get("inventory") or raw_item.get("stock") or raw_item.get("stock_count") or raw_item.get("quantity_available")
        if raw_inv is not None:
            try:
                inventory = int(raw_inv)
                if inventory < 0:
                    errors.append(f"Invalid inventory value: {inventory} (must be >= 0)")
                elif inventory == 0:
                    available = False
            except (ValueError, TypeError):
                inventory = None

        # 8. Store ID
        store_id = raw_item.get("store_id") or raw_item.get("merchant_id") or raw_item.get("darkstore_id")
        if store_id is not None:
            store_id = str(store_id).strip() or None

        # 9. Delivery ETA
        eta_minutes: Optional[int] = None
        raw_eta = raw_item.get("eta_minutes") or raw_item.get("eta") or raw_item.get("delivery_time_minutes") or raw_item.get("delivery_sla_minutes")
        if raw_eta is not None:
            try:
                # If ETA is formatted like "8 mins", extract digits
                if isinstance(raw_eta, str):
                    import re
                    digits = re.findall(r'\d+', raw_eta)
                    if digits:
                        eta_minutes = int(digits[0])
                else:
                    eta_minutes = int(raw_eta)
                if eta_minutes is not None and eta_minutes < 0:
                    errors.append(f"Invalid ETA value: {eta_minutes} (must be >= 0)")
            except (ValueError, TypeError):
                eta_minutes = None

        # 10. Ratings
        rating: Optional[float] = None
        raw_rating = raw_item.get("rating") or raw_item.get("stars") or raw_item.get("average_rating")
        if raw_rating is not None:
            try:
                rating = float(raw_rating)
            except (ValueError, TypeError):
                rating = None

        rating_count: Optional[int] = None
        raw_rc = raw_item.get("rating_count") or raw_item.get("reviews_count") or raw_item.get("total_ratings")
        if raw_rc is not None:
            try:
                rating_count = int(raw_rc)
            except (ValueError, TypeError):
                rating_count = None

        # 11. Media & URLs
        image_url = raw_item.get("image_url") or raw_item.get("image") or raw_item.get("product_image") or raw_item.get("thumbnail")
        deeplink = raw_item.get("deeplink") or raw_item.get("url") or raw_item.get("product_url") or raw_item.get("link")

        # 12. Timestamp
        fetched_at = raw_item.get("fetched_at") or raw_item.get("timestamp") or datetime.now(timezone.utc).isoformat()
        if isinstance(fetched_at, datetime):
            fetched_at = fetched_at.isoformat()

        # Coordinates
        latitude = raw_item.get("latitude", lat)
        longitude = raw_item.get("longitude", lon)

        if errors:
            return ValidationResult(is_valid=False, errors=errors, normalized_item=None)

        normalized = NormalizedProductItem(
            platform=platform,
            external_product_id=external_id,
            name=name,
            brand=brand,
            quantity=quantity,
            mrp=mrp,
            offer_price=offer_price,
            discount_percentage=discount_percentage,
            available=available,
            inventory=inventory,
            store_id=store_id,
            rating=rating,
            rating_count=rating_count,
            eta_minutes=eta_minutes,
            image_url=image_url,
            deeplink=deeplink,
            latitude=latitude,
            longitude=longitude,
            fetched_at=fetched_at,
            request_id=request_id,
            raw_response_id=raw_response_id,
            currency=raw_item.get("currency", "INR")
        )

        return ValidationResult(is_valid=True, errors=[], normalized_item=normalized)
