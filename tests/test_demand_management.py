import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.models.models import (
    Product, DailyDemandSnapshot, InventorySnapshot, CustomerFeedback,
    SellerDecisionLog, User, Location, PriceSnapshot, DeliveryEtaSnapshot
)
from backend.app.services.demand_service import DemandService
from backend.app.services.auth_service import AuthService

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed baseline location & user
    AuthService.seed_defaults(session)
    now = datetime.now(timezone.utc)
    loc = Location(city="Bengaluru", area="Indiranagar", latitude=12.9716, longitude=77.5946, pincode="560001", is_default=True)
    session.add(loc)
    session.commit()

    yield session
    session.close()

def test_demand_classification_increasing(db_session):
    now = datetime.now(timezone.utc)
    # Create product with surging demand
    prod = Product(
        external_product_id="SKU_TEST_01",
        platform="BlinkIt",
        name="Amul Taaza Milk 500ml",
        brand="Amul",
        category="Dairy & Breakfast",
        lifecycle_status="ACTIVE",
        min_stock_threshold=15,
        lead_time_days=2,
        safety_stock_days=3
    )
    db_session.add(prod)
    db_session.commit()

    # Seed 14 days of previous period (low sales: 5 units/day)
    for d in range(28, 14, -1):
        snap = DailyDemandSnapshot(
            product_id=prod.id,
            platform="BlinkIt",
            snapshot_date=now - timedelta(days=d),
            order_count=5,
            units_sold=5,
            sales_value=135.0,
            stock_end_of_day=20,
            out_of_stock_hours=0.0
        )
        db_session.add(snap)

    # Seed 14 days of current period (high sales: 20 units/day -> +300% increase)
    for d in range(14, 0, -1):
        snap = DailyDemandSnapshot(
            product_id=prod.id,
            platform="BlinkIt",
            snapshot_date=now - timedelta(days=d),
            order_count=20,
            units_sold=20,
            sales_value=540.0,
            stock_end_of_day=8,
            out_of_stock_hours=0.0
        )
        db_session.add(snap)

    # Current low stock (8 units)
    inv = InventorySnapshot(
        product_id=prod.id,
        platform="BlinkIt",
        inventory=8,
        available=True,
        fetched_at=now
    )
    db_session.add(inv)
    db_session.commit()

    analysis = DemandService.get_product_demand_analysis(prod, db_session, period_days=14)
    assert analysis.demand_classification == "INCREASING_DEMAND"
    assert analysis.demand_change_pct > 10.0
    assert analysis.is_low_stock is True
    assert analysis.recommendation_type == "REPLENISHMENT"
    assert analysis.suggested_replenishment_qty is not None
    assert analysis.suggested_replenishment_qty > 0
    assert "Replenishment recommended" in analysis.reason_explanation

def test_replenishment_formula_calculation(db_session):
    now = datetime.now(timezone.utc)
    prod = Product(
        external_product_id="SKU_TEST_02",
        platform="Zepto",
        name="Epigamia Greek Yogurt",
        brand="Epigamia",
        category="Dairy & Breakfast",
        lifecycle_status="ACTIVE",
        lead_time_days=2,
        safety_stock_days=3,
        min_stock_threshold=15
    )
    db_session.add(prod)
    db_session.commit()

    # Seed 14 days with 10 units/day average
    for d in range(14, 0, -1):
        snap = DailyDemandSnapshot(
            product_id=prod.id,
            platform="Zepto",
            snapshot_date=now - timedelta(days=d),
            order_count=10,
            units_sold=10,
            sales_value=450.0,
            stock_end_of_day=5,
            out_of_stock_hours=0.0
        )
        db_session.add(snap)

    # Current stock = 5 units
    inv = InventorySnapshot(
        product_id=prod.id,
        platform="Zepto",
        inventory=5,
        available=True,
        fetched_at=now
    )
    db_session.add(inv)
    db_session.commit()

    analysis = DemandService.get_product_demand_analysis(prod, db_session, period_days=14)
    # Expected demand during lead time = 10 * 2 = 20
    # Safety stock = 10 * 3 = 30
    # Current available = 5
    # Suggested replenishment = (20 + 30) - 5 = 45 units
    assert analysis.suggested_replenishment_qty == 45
    assert analysis.replenishment_formula_params["expected_demand_lead_time"] == 20
    assert analysis.replenishment_formula_params["safety_stock"] == 30
    assert analysis.replenishment_formula_params["current_stock"] == 5

def test_declining_demand_and_replacement_alternative(db_session):
    now = datetime.now(timezone.utc)
    # Product A: Declining
    prod_a = Product(
        external_product_id="SKU_DECLINING_01",
        platform="BlinkIt",
        name="Legacy Low-Fat Diet Spread",
        brand="OldBrand",
        category="Dairy & Breakfast",
        rating=2.5,
        rating_count=30,
        lifecycle_status="ACTIVE"
    )
    # Product B: Superior Alternative in same category
    prod_b = Product(
        external_product_id="SKU_ALT_01",
        platform="BlinkIt",
        name="Amul Delicious Butter",
        brand="Amul",
        category="Dairy & Breakfast",
        rating=4.8,
        rating_count=3200,
        lifecycle_status="ACTIVE"
    )
    db_session.add_all([prod_a, prod_b])
    db_session.commit()

    # Product A: 30 units/day earlier, 5 units/day recently (-83% decline)
    for d in range(28, 14, -1):
        db_session.add(DailyDemandSnapshot(
            product_id=prod_a.id, platform="BlinkIt", snapshot_date=now - timedelta(days=d),
            order_count=30, units_sold=30, sales_value=300.0, stock_end_of_day=50, out_of_stock_hours=0.0
        ))
    for d in range(14, 0, -1):
        db_session.add(DailyDemandSnapshot(
            product_id=prod_a.id, platform="BlinkIt", snapshot_date=now - timedelta(days=d),
            order_count=5, units_sold=5, sales_value=50.0, stock_end_of_day=45, out_of_stock_hours=0.0
        ))

    # Product B: Healthy stock & price
    db_session.add(InventorySnapshot(product_id=prod_b.id, platform="BlinkIt", inventory=30, available=True, fetched_at=now))
    db_session.add(PriceSnapshot(product_id=prod_b.id, platform="BlinkIt", offer_price=55.0, mrp=60.0, fetched_at=now))
    db_session.commit()

    analysis = DemandService.get_product_demand_analysis(prod_a, db_session, period_days=14)
    assert analysis.demand_classification == "DECLINING_DEMAND"
    assert analysis.recommendation_type == "REPLACEMENT"
    assert len(analysis.alternative_candidates) > 0
    assert analysis.alternative_candidates[0].name == "Amul Delicious Butter"
    assert "stronger observed demand" in analysis.reason_explanation

def test_seller_decision_execution(db_session):
    now = datetime.now(timezone.utc)
    prod = Product(
        external_product_id="SKU_DECISION_01",
        platform="BlinkIt",
        name="Britannia Whole Wheat Bread",
        brand="Britannia",
        category="Bakery & Breads",
        lifecycle_status="ACTIVE"
    )
    db_session.add(prod)
    db_session.commit()

    user = db_session.query(User).filter(User.email == "demo@quicksync.app").first()

    result = asyncio.run(
        DemandService.execute_seller_decision(
            db=db_session,
            product_id=prod.id,
            decision="REPLENISH",
            user_email=user.email,
            replenishment_quantity=60,
            notes="Approved for emergency weekend restock"
        )
    )

    assert result.success is True
    assert result.new_lifecycle_status == "REPLENISHMENT_RECOMMENDED"
    assert result.action_execution_status == "MANUAL_ACTION_REQUIRED"

    # Verify updated in DB
    updated_prod = db_session.query(Product).filter(Product.id == prod.id).first()
    assert updated_prod.lifecycle_status == "REPLENISHMENT_RECOMMENDED"

    # Verify Audit Log
    dlog = db_session.query(SellerDecisionLog).filter(SellerDecisionLog.product_id == prod.id).first()
    assert dlog is not None
    assert dlog.decision == "REPLENISH"
    assert dlog.seller_email == user.email
