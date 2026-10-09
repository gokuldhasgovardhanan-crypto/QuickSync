import time
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from ..core.logging import log_event
from ..models.models import (
    Product, ProductSnapshot, PriceSnapshot, InventorySnapshot,
    AvailabilitySnapshot, DeliveryEtaSnapshot, SyncRun, SyncJob,
    Alert, Location, Platform
)
from ..schemas.schemas import NormalizedProductItem
from ..connectors.quickcommerce import QuickCommerceConnector
from ..websocket.manager import ws_manager

class SyncService:
    @staticmethod
    async def process_live_products(
        db: Session,
        items: List[NormalizedProductItem],
        location: Optional[Location] = None,
        sync_run_id: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Stores live product items, updates catalogs, generates immutable time-series snapshots,
        and triggers alerts on price/inventory fluctuations.
        """
        created_products = 0
        updated_products = 0
        price_snapshots_created = 0
        inventory_snapshots_created = 0
        eta_snapshots_created = 0

        location_id = location.id if location else None
        now = datetime.now(timezone.utc)

        for item in items:
            # 1. Look up existing product by platform + external_product_id
            product = db.query(Product).filter(
                Product.platform == item.platform,
                Product.external_product_id == item.external_product_id
            ).first()

            if not product:
                product = Product(
                    external_product_id=item.external_product_id,
                    platform=item.platform,
                    name=item.name,
                    brand=item.brand,
                    quantity=item.quantity,
                    image_url=item.image_url,
                    deeplink=item.deeplink,
                    rating=item.rating,
                    rating_count=item.rating_count
                )
                db.add(product)
                db.flush()
                created_products += 1
            else:
                # Update catalog metadata
                product.name = item.name
                if item.brand:
                    product.brand = item.brand
                if item.quantity:
                    product.quantity = item.quantity
                if item.image_url:
                    product.image_url = item.image_url
                if item.deeplink:
                    product.deeplink = item.deeplink
                if item.rating is not None:
                    product.rating = item.rating
                if item.rating_count is not None:
                    product.rating_count = item.rating_count
                product.updated_at = now
                updated_products += 1

            # 2. Add Product Snapshot
            p_snap = ProductSnapshot(
                product_id=product.id,
                platform=item.platform,
                external_product_id=item.external_product_id,
                name=item.name,
                brand=item.brand,
                quantity=item.quantity,
                image_url=item.image_url,
                deeplink=item.deeplink,
                rating=item.rating,
                rating_count=item.rating_count,
                location_id=location_id,
                request_id=item.request_id,
                raw_response_id=item.raw_response_id,
                fetched_at=now
            )
            db.add(p_snap)

            # 3. Check previous price snapshot for alert detection
            latest_price = db.query(PriceSnapshot).filter(
                PriceSnapshot.product_id == product.id
            ).order_by(PriceSnapshot.fetched_at.desc()).first()

            price_snap = PriceSnapshot(
                product_id=product.id,
                platform=item.platform,
                mrp=item.mrp,
                offer_price=item.offer_price,
                discount_percentage=item.discount_percentage,
                currency=item.currency,
                location_id=location_id,
                request_id=item.request_id,
                raw_response_id=item.raw_response_id,
                fetched_at=now
            )
            db.add(price_snap)
            price_snapshots_created += 1

            # Trigger Price Alert if changed
            if latest_price and latest_price.offer_price != item.offer_price:
                diff = item.offer_price - latest_price.offer_price
                pct_change = round((diff / latest_price.offer_price) * 100.0, 1)
                alert = Alert(
                    type="PRICE_CHANGE",
                    severity="WARNING" if abs(pct_change) > 15 else "INFO",
                    platform=item.platform,
                    message=f"{item.name} price changed from ₹{latest_price.offer_price} to ₹{item.offer_price} ({pct_change:+}%) on {item.platform}",
                    details={
                        "product_id": product.id,
                        "product_name": item.name,
                        "old_price": latest_price.offer_price,
                        "new_price": item.offer_price,
                        "difference": diff,
                        "percent_change": pct_change
                    },
                    status="OPEN"
                )
                db.add(alert)
                # Broadcast WS price update
                await ws_manager.broadcast("price_update", {
                    "product_id": product.id,
                    "product_name": item.name,
                    "platform": item.platform,
                    "old_price": latest_price.offer_price,
                    "new_price": item.offer_price,
                    "pct_change": pct_change,
                    "timestamp": now.isoformat()
                })

            # 4. Check previous inventory snapshot for alert detection
            latest_inv = db.query(InventorySnapshot).filter(
                InventorySnapshot.product_id == product.id
            ).order_by(InventorySnapshot.fetched_at.desc()).first()

            inv_snap = InventorySnapshot(
                product_id=product.id,
                platform=item.platform,
                store_id=item.store_id,
                inventory=item.inventory,
                available=item.available,
                location_id=location_id,
                request_id=item.request_id,
                raw_response_id=item.raw_response_id,
                fetched_at=now
            )
            db.add(inv_snap)
            inventory_snapshots_created += 1

            # Availability snapshot
            avail_snap = AvailabilitySnapshot(
                product_id=product.id,
                platform=item.platform,
                store_id=item.store_id,
                available=item.available,
                location_id=location_id,
                request_id=item.request_id,
                raw_response_id=item.raw_response_id,
                fetched_at=now
            )
            db.add(avail_snap)

            # Stock change alert
            if latest_inv and latest_inv.available != item.available:
                alert_type = "BACK_IN_STOCK" if item.available else "OUT_OF_STOCK"
                severity = "CRITICAL" if not item.available else "INFO"
                alert = Alert(
                    type=alert_type,
                    severity=severity,
                    platform=item.platform,
                    message=f"{item.name} is now {'BACK IN STOCK' if item.available else 'OUT OF STOCK'} on {item.platform}",
                    details={
                        "product_id": product.id,
                        "product_name": item.name,
                        "store_id": item.store_id,
                        "inventory": item.inventory,
                        "available": item.available
                    },
                    status="OPEN"
                )
                db.add(alert)
                await ws_manager.broadcast("availability_update", {
                    "product_id": product.id,
                    "product_name": item.name,
                    "platform": item.platform,
                    "available": item.available,
                    "inventory": item.inventory,
                    "timestamp": now.isoformat()
                })

            # 5. Delivery ETA snapshot if available
            if item.eta_minutes is not None:
                eta_snap = DeliveryEtaSnapshot(
                    platform=item.platform,
                    location_id=location_id,
                    store_id=item.store_id,
                    eta_minutes=item.eta_minutes,
                    open=True,
                    request_id=item.request_id,
                    raw_response_id=item.raw_response_id,
                    fetched_at=now
                )
                db.add(eta_snap)
                eta_snapshots_created += 1

            # Update platform status
            plat_rec = db.query(Platform).filter(Platform.name == item.platform).first()
            if plat_rec:
                plat_rec.status = "LIVE"
                plat_rec.last_sync_at = now
                plat_rec.last_status_code = 200

        db.commit()

        # Broadcast general product updates
        await ws_manager.broadcast("product_update", {
            "products_count": len(items),
            "timestamp": now.isoformat()
        })

        return {
            "created": created_products,
            "updated": updated_products,
            "price_snapshots": price_snapshots_created,
            "inventory_snapshots": inventory_snapshots_created,
            "eta_snapshots": eta_snapshots_created
        }

    @staticmethod
    async def execute_live_sync(
        db: Session,
        query: str = "Milk",
        platform: str = "ALL",
        location_id: Optional[str] = None,
        sync_job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a real live sync against QuickCommerce API, processes and saves snapshots.
        """
        start_time = time.time()
        start_dt = datetime.now(timezone.utc)

        # Notify WebSocket: Sync Started
        await ws_manager.broadcast("sync_started", {
            "query": query,
            "platform": platform,
            "started_at": start_dt.isoformat()
        })

        # Fetch location
        loc = None
        if location_id:
            loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            loc = db.query(Location).filter(Location.is_default == True).first()
        if not loc:
            loc = Location(
                city="Bangalore",
                area="Indiranagar",
                latitude=12.9716,
                longitude=77.5946,
                pincode="560001",
                is_default=True
            )
            db.add(loc)
            db.commit()

        # Create SyncRun in database
        sync_run = SyncRun(
            sync_job_id=sync_job_id,
            status="RUNNING",
            started_at=start_dt,
            api_calls=1
        )
        db.add(sync_run)
        db.commit()

        connector = QuickCommerceConnector()
        search_res = await connector.search_products(
            query=query,
            latitude=loc.latitude,
            longitude=loc.longitude,
            platform=platform,
            pincode=loc.pincode,
            city=loc.city,
            db=db
        )

        duration_ms = round((time.time() - start_time) * 1000.0, 2)
        end_dt = datetime.now(timezone.utc)

        if not search_res["success"]:
            sync_run.status = "FAILED"
            sync_run.duration_ms = duration_ms
            sync_run.error_message = search_res.get("error_message")
            sync_run.completed_at = end_dt
            db.commit()

            # Create failure alert
            alert = Alert(
                type="SYNC_FAILURE",
                severity="CRITICAL",
                platform=platform if platform != "ALL" else "QuickCommerce API",
                message=f"Live sync failed for query '{query}': {search_res.get('error_message')}",
                details={"status_code": search_res.get("status_code"), "request_id": search_res.get("request_id")},
                status="OPEN"
            )
            db.add(alert)
            db.commit()

            await ws_manager.broadcast("sync_failed", {
                "sync_run_id": sync_run.id,
                "error": search_res.get("error_message"),
                "status_code": search_res.get("status_code"),
                "duration_ms": duration_ms
            })

            return {
                "success": False,
                "sync_run_id": sync_run.id,
                "status": "FAILED",
                "error": search_res.get("error_message"),
                "status_code": search_res.get("status_code"),
                "duration_ms": duration_ms,
                "products_retrieved": 0,
                "valid_records": 0,
                "invalid_records": 0
            }

        # Process and save valid items
        valid_items = search_res["products"]
        process_stats = await SyncService.process_live_products(
            db=db,
            items=valid_items,
            location=loc,
            sync_run_id=sync_run.id
        )

        sync_run.status = "SUCCESS"
        sync_run.duration_ms = duration_ms
        sync_run.products_retrieved = len(valid_items) + search_res.get("invalid_count", 0)
        sync_run.valid_records = len(valid_items)
        sync_run.invalid_records = search_res.get("invalid_count", 0)
        sync_run.duplicate_records = process_stats.get("updated", 0)
        sync_run.completed_at = end_dt
        db.commit()

        await ws_manager.broadcast("sync_completed", {
            "sync_run_id": sync_run.id,
            "status": "SUCCESS",
            "products_count": len(valid_items),
            "duration_ms": duration_ms,
            "timestamp": end_dt.isoformat()
        })

        return {
            "success": True,
            "sync_run_id": sync_run.id,
            "status": "SUCCESS",
            "duration_ms": duration_ms,
            "products_retrieved": sync_run.products_retrieved,
            "valid_records": sync_run.valid_records,
            "invalid_records": sync_run.invalid_records,
            "duplicates": sync_run.duplicate_records,
            "credits_remaining": search_res.get("credits_remaining")
        }
