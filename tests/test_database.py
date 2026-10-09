import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base
from backend.app.models.models import (
    Product, PriceSnapshot, InventorySnapshot, Alert, Location, Platform
)
from backend.app.schemas.schemas import NormalizedProductItem
from backend.app.services.sync_service import SyncService
from backend.app.services.monitoring_service import MonitoringService

@pytest.fixture(scope="module")
def db():
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.close()

@pytest.mark.asyncio
async def test_process_live_products_creates_snapshots_and_alerts(db):
    # Create test normalized items
    item1 = NormalizedProductItem(
        platform="BlinkIt",
        external_product_id="test_ext_01",
        name="Amul Butter Pasteurized",
        brand="Amul",
        quantity="500 g",
        mrp=275.0,
        offer_price=260.0,
        available=True,
        inventory=12,
        store_id="STORE_BLR_01",
        fetched_at="2026-09-28T10:00:00Z"
    )

    stats = await SyncService.process_live_products(db, [item1])
    assert stats["price_snapshots"] >= 1
    assert stats["inventory_snapshots"] >= 1

    # Ingest price drop on same product
    item1_updated = NormalizedProductItem(
        platform="BlinkIt",
        external_product_id="test_ext_01",
        name="Amul Butter Pasteurized",
        brand="Amul",
        quantity="500 g",
        mrp=275.0,
        offer_price=240.0, # Drop from 260 to 240
        available=True,
        inventory=12,
        store_id="STORE_BLR_01",
        fetched_at="2026-09-28T10:05:00Z"
    )

    await SyncService.process_live_products(db, [item1_updated])

    # Check alert was generated for price change
    alert = db.query(Alert).filter(Alert.type == "PRICE_CHANGE", Alert.platform == "BlinkIt").order_by(Alert.created_at.desc()).first()
    assert alert is not None
    assert "price changed" in alert.message

def test_dashboard_kpis_calculated_dynamically(db):
    summary = MonitoringService.get_dashboard_summary(db)
    assert summary is not None
    assert "total_products_fetched" in summary
    assert "in_stock_products_count" in summary
    assert "reliability_score" in summary
    assert summary["total_products_fetched"] >= 1
