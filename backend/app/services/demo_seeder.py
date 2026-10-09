from datetime import datetime, timezone, timedelta
import uuid
import random
from sqlalchemy.orm import Session

from ..core.database import SessionLocal, engine, Base
from ..models.models import (
    Product, ProductSnapshot, PriceSnapshot, InventorySnapshot,
    AvailabilitySnapshot, DeliveryEtaSnapshot, Alert, ApiRequest,
    RawApiResponse, DataQualityResult, SyncRun, Location, Platform,
    CustomerFeedback, OrderTransaction, DailyDemandSnapshot,
    ProductRecommendation, SellerDecisionLog
)
from ..services.auth_service import AuthService
from ..services.matching_service import MatchingService
from ..services.demand_service import DemandService

DEMO_CATALOG = [
    # Multi-Platform Differing Titles / Same Product detection demo
    {
        "name": "Navin Butter Cake",
        "brand": "Navin",
        "category": "Bakery & Breads",
        "quantity": "500 g",
        "gtin": "8901030889101",
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300",
        "demand_trend": "STABLE",
        "platforms": {
            "BlinkIt": {"name_override": "NAVIN BUTTER CAKE", "price": 180.0, "mrp": 200.0, "inv": 25, "avail": True, "eta": 10, "store": "DARKSTORE_BLR_01", "rating": 4.6, "rating_count": 820},
            "Zepto": {"name_override": "NAVIN BUTTER CAKE 500 GM", "price": 185.0, "mrp": 200.0, "inv": 18, "avail": True, "eta": 12, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.5, "rating_count": 540},
            "Swiggy": {"name_override": "KUMAR CAKE 500G", "price": 180.0, "mrp": 200.0, "inv": 20, "avail": True, "eta": 14, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.7, "rating_count": 910},
            "BigBasket": {"name_override": "Navin Rich Butter Cake - 500g", "price": 175.0, "mrp": 200.0, "inv": 30, "avail": True, "eta": 18, "store": "BB_DARKSTORE_EAST", "rating": 4.6, "rating_count": 430},
        }
    },
    {
        "name": "Navin Chocolate Truffle Cake",
        "brand": "Navin",
        "category": "Bakery & Breads",
        "quantity": "500 g",
        "gtin": "8901030889200",
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300",
        "demand_trend": "INCREASING",
        "platforms": {
            "BlinkIt": {"name_override": "NAVIN CHOCOLATE TRUFFLE CAKE 500G", "price": 220.0, "mrp": 250.0, "inv": 15, "avail": True, "eta": 9, "store": "DARKSTORE_BLR_01", "rating": 4.8, "rating_count": 1100},
            "Zepto": {"name_override": "Navin Truffle Chocolate Cake - 500 gm", "price": 225.0, "mrp": 250.0, "inv": 12, "avail": True, "eta": 11, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.7, "rating_count": 780},
        }
    },
    # Dairy & Breakfast
    {
        "name": "Amul Taaza Toned Milk",
        "brand": "Amul",
        "category": "Dairy & Breakfast",
        "quantity": "500 ml",
        "image_url": "https://www.amul.com/files/products/amul-taaza-500ml.png",
        "demand_trend": "INCREASING",
        "platforms": {
            "BlinkIt": {"price": 27.0, "mrp": 30.0, "inv": 24, "avail": True, "eta": 8, "store": "DARKSTORE_BLR_01", "rating": 4.8, "rating_count": 1420},
            "Zepto": {"price": 28.0, "mrp": 30.0, "inv": 16, "avail": True, "eta": 10, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.7, "rating_count": 980},
            "Swiggy": {"price": 27.5, "mrp": 30.0, "inv": 32, "avail": True, "eta": 11, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.8, "rating_count": 2100},
            "BigBasket": {"price": 26.5, "mrp": 30.0, "inv": 28, "avail": True, "eta": 15, "store": "BB_DARKSTORE_EAST", "rating": 4.6, "rating_count": 750},
            "DMart": {"price": 26.0, "mrp": 30.0, "inv": 0, "avail": False, "eta": 20, "store": "DMART_READY_BLR", "rating": 4.5, "rating_count": 520},
            "JioMart": {"price": 27.0, "mrp": 30.0, "inv": 19, "avail": True, "eta": 18, "store": "JIOMART_EXPRESS_BLR", "rating": 4.4, "rating_count": 310},
            "Minutes": {"price": 28.0, "mrp": 30.0, "inv": 14, "avail": True, "eta": 7, "store": "MINUTES_FAST_02", "rating": 4.9, "rating_count": 180},
        }
    },
    {
        "name": "Nandini Toned Fresh Milk",
        "brand": "Nandini",
        "category": "Dairy & Breakfast",
        "quantity": "500 ml",
        "image_url": "https://www.kmfnandini.coop/sites/default/files/toned-milk.png",
        "demand_trend": "INCREASING",
        "platforms": {
            "BlinkIt": {"price": 24.0, "mrp": 24.0, "inv": 35, "avail": True, "eta": 9, "store": "DARKSTORE_BLR_01", "rating": 4.9, "rating_count": 3200},
            "Zepto": {"price": 24.0, "mrp": 24.0, "inv": 29, "avail": True, "eta": 10, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.8, "rating_count": 1900},
            "Swiggy": {"price": 24.0, "mrp": 24.0, "inv": 40, "avail": True, "eta": 12, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.9, "rating_count": 4100},
            "BigBasket": {"price": 23.5, "mrp": 24.0, "inv": 22, "avail": True, "eta": 14, "store": "BB_DARKSTORE_EAST", "rating": 4.7, "rating_count": 890},
        }
    },
    {
        "name": "Epigamia Natural Greek Yogurt",
        "brand": "Epigamia",
        "category": "Dairy & Breakfast",
        "quantity": "90 g",
        "image_url": "https://www.epigamia.com/media/catalog/product/natural-greek-yogurt.png",
        "demand_trend": "HIGH_DEMAND_LOW_STOCK", # Triggers Replenishment
        "platforms": {
            "BlinkIt": {"price": 45.0, "mrp": 50.0, "inv": 4, "avail": True, "eta": 9, "store": "DARKSTORE_BLR_01", "rating": 4.8, "rating_count": 2100},
            "Zepto": {"price": 46.0, "mrp": 50.0, "inv": 3, "avail": True, "eta": 11, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.7, "rating_count": 1450},
            "Swiggy": {"price": 45.0, "mrp": 50.0, "inv": 5, "avail": True, "eta": 10, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.8, "rating_count": 1820},
        }
    },
    {
        "name": "Mother Dairy Fresh Paneer",
        "brand": "Mother Dairy",
        "category": "Dairy & Breakfast",
        "quantity": "200 g",
        "image_url": "https://www.motherdairy.com/images/paneer-classic.png",
        "demand_trend": "HIGH_DEMAND_LOW_STOCK", # Triggers Replenishment
        "platforms": {
            "BlinkIt": {"price": 95.0, "mrp": 105.0, "inv": 5, "avail": True, "eta": 8, "store": "DARKSTORE_BLR_01", "rating": 4.7, "rating_count": 1650},
            "Zepto": {"price": 94.0, "mrp": 105.0, "inv": 6, "avail": True, "eta": 10, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.8, "rating_count": 1100},
            "Swiggy": {"price": 96.0, "mrp": 105.0, "inv": 4, "avail": True, "eta": 12, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.7, "rating_count": 2300},
        }
    },
    {
        "name": "Amul Salted Butter",
        "brand": "Amul",
        "category": "Dairy & Breakfast",
        "quantity": "500 g",
        "image_url": "https://www.amul.com/files/products/amul-butter-500g.png",
        "demand_trend": "STABLE",
        "platforms": {
            "BlinkIt": {"price": 275.0, "mrp": 285.0, "inv": 18, "avail": True, "eta": 8, "store": "DARKSTORE_BLR_01", "rating": 4.9, "rating_count": 5200},
            "Zepto": {"price": 272.0, "mrp": 285.0, "inv": 13, "avail": True, "eta": 10, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.9, "rating_count": 3100},
            "Swiggy": {"price": 276.0, "mrp": 285.0, "inv": 21, "avail": True, "eta": 11, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.8, "rating_count": 6400},
            "BigBasket": {"price": 270.0, "mrp": 285.0, "inv": 25, "avail": True, "eta": 16, "store": "BB_DARKSTORE_EAST", "rating": 4.7, "rating_count": 1200},
            "DMart": {"price": 265.0, "mrp": 285.0, "inv": 15, "avail": True, "eta": 22, "store": "DMART_READY_BLR", "rating": 4.6, "rating_count": 800},
        }
    },
    {
        "name": "Nature's Herb Low-Calorie Diet Spread",
        "brand": "Nature's Herb",
        "category": "Dairy & Breakfast",
        "quantity": "200 g",
        "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300",
        "demand_trend": "SUSTAINED_DECLINE", # Triggers Replacement (Amul Butter is alternative)
        "platforms": {
            "BlinkIt": {"price": 140.0, "mrp": 180.0, "inv": 34, "avail": True, "eta": 10, "store": "DARKSTORE_BLR_01", "rating": 2.6, "rating_count": 42},
            "Zepto": {"price": 135.0, "mrp": 180.0, "inv": 28, "avail": True, "eta": 12, "store": "ZEPTO_MICRO_HUB_4", "rating": 2.5, "rating_count": 30},
        }
    },
    # Bakery & Breads
    {
        "name": "Britannia 100% Whole Wheat Bread",
        "brand": "Britannia",
        "category": "Bakery & Breads",
        "quantity": "400 g",
        "image_url": "https://m.media-amazon.com/images/I/71rSg8a+oSL.jpg",
        "demand_trend": "INCREASING",
        "platforms": {
            "BlinkIt": {"price": 50.0, "mrp": 55.0, "inv": 30, "avail": True, "eta": 8, "store": "DARKSTORE_BLR_01", "rating": 4.7, "rating_count": 4100},
            "Zepto": {"price": 52.0, "mrp": 55.0, "inv": 22, "avail": True, "eta": 10, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.6, "rating_count": 2800},
            "Swiggy": {"price": 50.0, "mrp": 55.0, "inv": 0, "avail": False, "eta": 12, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.7, "rating_count": 5200},
            "BigBasket": {"price": 48.0, "mrp": 55.0, "inv": 25, "avail": True, "eta": 15, "store": "BB_DARKSTORE_EAST", "rating": 4.5, "rating_count": 1400},
        }
    },
    {
        "name": "Modern Brown Bread Healthy Fiber",
        "brand": "Modern",
        "category": "Bakery & Breads",
        "quantity": "400 g",
        "image_url": "https://m.media-amazon.com/images/I/71rSg8a+oSL.jpg",
        "demand_trend": "STABLE",
        "platforms": {
            "BlinkIt": {"price": 45.0, "mrp": 50.0, "inv": 20, "avail": True, "eta": 9, "store": "DARKSTORE_BLR_01", "rating": 4.4, "rating_count": 1800},
            "Zepto": {"price": 45.0, "mrp": 50.0, "inv": 18, "avail": True, "eta": 11, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.3, "rating_count": 1200},
            "BigBasket": {"price": 42.0, "mrp": 50.0, "inv": 24, "avail": True, "eta": 16, "store": "BB_DARKSTORE_EAST", "rating": 4.4, "rating_count": 920},
        }
    },
    {
        "name": "OldStyle Plain Soda Cracker Biscuits",
        "brand": "OldStyle",
        "category": "Bakery & Breads",
        "quantity": "150 g",
        "image_url": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300",
        "demand_trend": "SUSTAINED_DECLINE_NO_ALT", # Triggers Discontinuation
        "platforms": {
            "BlinkIt": {"price": 25.0, "mrp": 40.0, "inv": 45, "avail": True, "eta": 10, "store": "DARKSTORE_BLR_01", "rating": 2.1, "rating_count": 18},
            "Zepto": {"price": 24.0, "mrp": 40.0, "inv": 38, "avail": True, "eta": 12, "store": "ZEPTO_MICRO_HUB_4", "rating": 2.0, "rating_count": 12},
        }
    },
    # Staples & Grains
    {
        "name": "Daawat Rozana Super Basmati Rice",
        "brand": "Daawat",
        "category": "Staples & Grains",
        "quantity": "5 kg",
        "image_url": "https://m.media-amazon.com/images/I/81x1R0u8W0L.jpg",
        "demand_trend": "STABLE",
        "platforms": {
            "BlinkIt": {"price": 385.0, "mrp": 450.0, "inv": 16, "avail": True, "eta": 12, "store": "DARKSTORE_BLR_01", "rating": 4.6, "rating_count": 3100},
            "Zepto": {"price": 390.0, "mrp": 450.0, "inv": 12, "avail": True, "eta": 14, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.5, "rating_count": 1800},
            "BigBasket": {"price": 375.0, "mrp": 450.0, "inv": 28, "avail": True, "eta": 18, "store": "BB_DARKSTORE_EAST", "rating": 4.6, "rating_count": 4200},
            "DMart": {"price": 360.0, "mrp": 450.0, "inv": 40, "avail": True, "eta": 25, "store": "DMART_READY_BLR", "rating": 4.7, "rating_count": 2100},
        }
    },
    {
        "name": "Fortune Sunlite Refined Sunflower Oil",
        "brand": "Fortune",
        "category": "Staples & Grains",
        "quantity": "1 L",
        "image_url": "https://m.media-amazon.com/images/I/71Y+z9bWJEL.jpg",
        "demand_trend": "INCREASING",
        "platforms": {
            "BlinkIt": {"price": 142.0, "mrp": 165.0, "inv": 22, "avail": True, "eta": 9, "store": "DARKSTORE_BLR_01", "rating": 4.7, "rating_count": 6200},
            "Zepto": {"price": 144.0, "mrp": 165.0, "inv": 18, "avail": True, "eta": 11, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.6, "rating_count": 3400},
            "Swiggy": {"price": 145.0, "mrp": 165.0, "inv": 25, "avail": True, "eta": 12, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.7, "rating_count": 7800},
            "BigBasket": {"price": 139.0, "mrp": 165.0, "inv": 35, "avail": True, "eta": 15, "store": "BB_DARKSTORE_EAST", "rating": 4.8, "rating_count": 5100},
        }
    },
    # Beverages
    {
        "name": "Nescafe Classic Instant Coffee Jar",
        "brand": "Nescafe",
        "category": "Beverages",
        "quantity": "100 g",
        "image_url": "https://m.media-amazon.com/images/I/71qS+F8r5AL.jpg",
        "demand_trend": "INCREASING",
        "platforms": {
            "BlinkIt": {"price": 310.0, "mrp": 340.0, "inv": 25, "avail": True, "eta": 8, "store": "DARKSTORE_BLR_01", "rating": 4.8, "rating_count": 8900},
            "Zepto": {"price": 305.0, "mrp": 340.0, "inv": 19, "avail": True, "eta": 10, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.8, "rating_count": 4500},
            "Swiggy": {"price": 315.0, "mrp": 340.0, "inv": 28, "avail": True, "eta": 11, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.7, "rating_count": 9200},
            "BigBasket": {"price": 300.0, "mrp": 340.0, "inv": 40, "avail": True, "eta": 16, "store": "BB_DARKSTORE_EAST", "rating": 4.8, "rating_count": 6100},
        }
    },
    {
        "name": "Red Bull Energy Drink",
        "brand": "Red Bull",
        "category": "Beverages",
        "quantity": "250 ml",
        "image_url": "https://m.media-amazon.com/images/I/61NqKzCjD6L.jpg",
        "demand_trend": "HIGH_DEMAND_LOW_STOCK", # Replenishment
        "platforms": {
            "BlinkIt": {"price": 120.0, "mrp": 125.0, "inv": 5, "avail": True, "eta": 8, "store": "DARKSTORE_BLR_01", "rating": 4.9, "rating_count": 6700},
            "Zepto": {"price": 122.0, "mrp": 125.0, "inv": 3, "avail": True, "eta": 9, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.8, "rating_count": 3900},
            "Swiggy": {"price": 120.0, "mrp": 125.0, "inv": 4, "avail": True, "eta": 10, "store": "SWIGGY_POD_INDIRANAGAR", "rating": 4.9, "rating_count": 8100},
        }
    },
    # Fresh Produce
    {
        "name": "Farm Fresh Red Onions",
        "brand": "Fresh Harvest",
        "category": "Fresh Produce",
        "quantity": "1 kg",
        "image_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300",
        "demand_trend": "INCREASING",
        "platforms": {
            "BlinkIt": {"price": 38.0, "mrp": 50.0, "inv": 60, "avail": True, "eta": 9, "store": "DARKSTORE_BLR_01", "rating": 4.6, "rating_count": 4200},
            "Zepto": {"price": 40.0, "mrp": 50.0, "inv": 45, "avail": True, "eta": 10, "store": "ZEPTO_MICRO_HUB_4", "rating": 4.5, "rating_count": 2900},
            "BigBasket": {"price": 36.0, "mrp": 50.0, "inv": 85, "avail": True, "eta": 14, "store": "BB_DARKSTORE_EAST", "rating": 4.7, "rating_count": 7800},
        }
    },
    # Newly Listed Item with Insufficient Data
    {
        "name": "Avocado Cold-Pressed Artisan Spread",
        "brand": "Artisan Green",
        "category": "Dairy & Breakfast",
        "quantity": "150 g",
        "image_url": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300",
        "demand_trend": "INSUFFICIENT_DATA",
        "platforms": {
            "BlinkIt": {"price": 299.0, "mrp": 350.0, "inv": 12, "avail": True, "eta": 10, "store": "DARKSTORE_BLR_01", "rating": 4.0, "rating_count": 2},
        }
    }
]

def seed_full_demo_dataset(db: Session):
    """
    Cleans and seeds the QuickSync database with a rich, realistic catalog,
    time-series price/inventory snapshots, demand analytics, customer reviews,
    orders, alerts, and baseline recommendations.
    """
    now = datetime.now(timezone.utc)

    # 1. Seed Default Users
    AuthService.seed_defaults(db)

    # 2. Seed Default Locations
    locations = [
        {"city": "Bengaluru", "area": "Indiranagar", "lat": 12.9716, "lon": 77.5946, "pin": "560001", "default": True},
        {"city": "Mumbai", "area": "Bandra West", "lat": 19.0596, "lon": 72.8295, "pin": "400050", "default": False},
        {"city": "Delhi NCR", "area": "Cyber City Gurgaon", "lat": 28.4595, "lon": 77.0266, "pin": "122002", "default": False},
        {"city": "Hyderabad", "area": "Hitec City", "lat": 17.4483, "lon": 78.3915, "pin": "500081", "default": False},
    ]

    loc_records = {}
    for loc_data in locations:
        loc = db.query(Location).filter(Location.city == loc_data["city"]).first()
        if not loc:
            loc = Location(
                city=loc_data["city"],
                area=loc_data["area"],
                latitude=loc_data["lat"],
                longitude=loc_data["lon"],
                pincode=loc_data["pin"],
                is_default=loc_data["default"],
                created_at=now
            )
            db.add(loc)
            db.commit()
            db.refresh(loc)
        loc_records[loc_data["city"]] = loc

    default_loc = loc_records["Bengaluru"]

    # 3. Seed Platforms
    platforms_list = [
        ("BlinkIt", "blinkit", "https://blinkit.com/favicon.ico"),
        ("Zepto", "zepto", "https://www.zeptonow.com/favicon.ico"),
        ("Swiggy", "swiggy_instamart", "https://www.swiggy.com/favicon.ico"),
        ("BigBasket", "bigbasket_bbnow", "https://www.bigbasket.com/favicon.ico"),
        ("DMart", "dmart_ready", "https://www.dmart.in/favicon.ico"),
        ("JioMart", "jiomart", "https://www.jiomart.com/favicon.ico"),
        ("Minutes", "minutes", "https://minutes.app/favicon.ico"),
    ]
    for pname, slug, logo in platforms_list:
        p = db.query(Platform).filter(Platform.name == pname).first()
        if not p:
            p = Platform(
                name=pname,
                slug=slug,
                logo_url=logo,
                is_active=True,
                status="LIVE",
                last_sync_at=now,
                last_latency_ms=120.0 + random.uniform(10, 40),
                last_status_code=200
            )
            db.add(p)
    db.commit()

    # Clear old transaction/demand records for a clean deterministic seed
    db.query(DailyDemandSnapshot).delete()
    db.query(CustomerFeedback).delete()
    db.query(OrderTransaction).delete()
    db.query(ProductRecommendation).delete()
    db.query(SellerDecisionLog).delete()
    db.commit()

    total_products = 0

    # 4. Seed Products, Snapshots, Demand Histories, Customer Feedback, Orders
    for item in DEMO_CATALOG:
        trend_mode = item.get("demand_trend", "STABLE")
        category = item.get("category", "General Grocery")

        for platform_name, pdata in item["platforms"].items():
            ext_id = f"SKU_{platform_name.upper()}_{uuid.uuid5(uuid.NAMESPACE_DNS, item['name']).hex[:8]}"
            prod = db.query(Product).filter(
                Product.platform == platform_name,
                Product.external_product_id == ext_id
            ).first()

            lifecycle = "ACTIVE"
            if trend_mode == "HIGH_DEMAND_LOW_STOCK":
                lifecycle = "REPLENISHMENT_RECOMMENDED"
            elif trend_mode in ["SUSTAINED_DECLINE", "SUSTAINED_DECLINE_NO_ALT"]:
                lifecycle = "REPLACEMENT_RECOMMENDED" if trend_mode == "SUSTAINED_DECLINE" else "DISCONTINUATION_RECOMMENDED"

            effective_name = pdata.get("name_override", item["name"])
            if not prod:
                prod = Product(
                    external_product_id=ext_id,
                    platform=platform_name,
                    name=effective_name,
                    brand=item["brand"],
                    category=category,
                    quantity=item["quantity"],
                    gtin=item.get("gtin"),
                    image_url=item["image_url"],
                    deeplink=f"https://{platform_name.lower()}.com/item/{ext_id}",
                    rating=pdata.get("rating", 4.5),
                    rating_count=pdata.get("rating_count", 150),
                    lifecycle_status=lifecycle,
                    seller_id="SELLER_PRIMARY_01",
                    lead_time_days=2,
                    safety_stock_days=3,
                    min_stock_threshold=15,
                    created_at=now - timedelta(days=35),
                    updated_at=now
                )
                db.add(prod)
                db.commit()
                db.refresh(prod)
            else:
                prod.name = effective_name
                prod.category = category
                prod.gtin = item.get("gtin")
                prod.lifecycle_status = lifecycle
                prod.updated_at = now
                db.commit()

            total_products += 1

            # Price Snapshot
            price = pdata["price"]
            mrp = pdata["mrp"]
            discount = round(((mrp - price) / mrp) * 100.0, 1) if mrp > price else 0.0
            req_id = f"qc_req_{uuid.uuid4().hex[:10]}"

            psnap = PriceSnapshot(
                product_id=prod.id,
                platform=platform_name,
                mrp=mrp,
                offer_price=price,
                discount_percentage=discount,
                currency="INR",
                location_id=default_loc.id,
                request_id=req_id,
                fetched_at=now
            )
            db.add(psnap)

            # Inventory Snapshot
            isnap = InventorySnapshot(
                product_id=prod.id,
                platform=platform_name,
                store_id=pdata["store"],
                inventory=pdata["inv"],
                available=pdata["avail"],
                location_id=default_loc.id,
                request_id=req_id,
                fetched_at=now
            )
            db.add(isnap)

            # Delivery ETA
            esnap = DeliveryEtaSnapshot(
                platform=platform_name,
                location_id=default_loc.id,
                store_id=pdata["store"],
                eta_minutes=pdata["eta"],
                open=pdata["avail"],
                request_id=req_id,
                fetched_at=now
            )
            db.add(esnap)

            # Daily Demand Snapshots (Past 30 days)
            if trend_mode == "INSUFFICIENT_DATA":
                # Only 1 observation
                d_snap = DailyDemandSnapshot(
                    product_id=prod.id,
                    platform=platform_name,
                    snapshot_date=now - timedelta(days=1),
                    order_count=1,
                    units_sold=1,
                    sales_value=price,
                    avg_rating=4.0,
                    review_count=1,
                    stock_end_of_day=pdata["inv"],
                    out_of_stock_hours=0.0,
                    created_at=now - timedelta(days=1)
                )
                db.add(d_snap)
            else:
                for day_idx in range(30, 0, -1):
                    snap_date = now - timedelta(days=day_idx)
                    
                    if trend_mode == "INCREASING":
                        # Upward slope: 8-12 units earlier, 18-28 units recently (+80% increase)
                        base_units = 8 if day_idx > 14 else 22
                        units = base_units + (day_idx % 4)
                        day_rating = 4.8
                    elif trend_mode == "HIGH_DEMAND_LOW_STOCK":
                        # Sustained high demand: 16-24 units/day
                        units = 18 + (day_idx % 5)
                        day_rating = 4.9
                    elif trend_mode in ["SUSTAINED_DECLINE", "SUSTAINED_DECLINE_NO_ALT"]:
                        # Downward slope: 30 units earlier, 8 units recently (-65% decrease)
                        base_units = 28 if day_idx > 14 else 7
                        units = base_units + (day_idx % 3)
                        day_rating = 2.4
                    else: # STABLE
                        units = 12 + (day_idx % 3)
                        day_rating = 4.6

                    d_snap = DailyDemandSnapshot(
                        product_id=prod.id,
                        platform=platform_name,
                        snapshot_date=snap_date,
                        order_count=max(1, units - 2),
                        units_sold=units,
                        sales_value=round(units * price, 2),
                        avg_rating=day_rating,
                        review_count=2,
                        stock_end_of_day=pdata["inv"] + (day_idx % 5),
                        out_of_stock_hours=0.0,
                        created_at=snap_date
                    )
                    db.add(d_snap)

            # Customer Feedback Reviews
            if trend_mode in ["INCREASING", "HIGH_DEMAND_LOW_STOCK", "STABLE"]:
                sample_reviews = [
                    (5.0, "POSITIVE", "Excellent product freshness and quick delivery! Daily staple for my family.", ["freshness", "fast-delivery"]),
                    (4.5, "POSITIVE", "Very consistent quality. Always arrives sealed and in great shape.", ["quality", "packaging"]),
                    (4.0, "POSITIVE", "Good value for money. Highly recommended.", ["value"])
                ]
            elif trend_mode in ["SUSTAINED_DECLINE", "SUSTAINED_DECLINE_NO_ALT"]:
                sample_reviews = [
                    (2.0, "NEGATIVE", "Taste has noticeably degraded in recent batches. Switched to alternative brand.", ["taste", "quality-decline"]),
                    (1.5, "NEGATIVE", "Poor packaging, arrived leaking and texture was off. Disappointed.", ["damaged", "packaging"]),
                    (2.5, "NEGATIVE", "Not worth the price. Better alternatives exist on the market.", ["overpriced"])
                ]
            else:
                sample_reviews = [
                    (4.0, "POSITIVE", "Just bought this newly listed item. Seems decent so far.", ["new-item"])
                ]

            for r_score, r_sent, r_text, r_tags in sample_reviews:
                cf = CustomerFeedback(
                    product_id=prod.id,
                    platform=platform_name,
                    customer_id=f"CUST_{uuid.uuid4().hex[:6].upper()}",
                    order_id=f"ORD_{uuid.uuid4().hex[:8].upper()}",
                    rating=r_score,
                    sentiment=r_sent,
                    review_text=r_text,
                    feedback_tags=r_tags,
                    created_at=now - timedelta(days=random.randint(1, 20))
                )
                db.add(cf)

            # Recent Order Transactions
            for o_idx in range(5):
                ot = OrderTransaction(
                    product_id=prod.id,
                    platform=platform_name,
                    order_id=f"ORD_{platform_name[:2].upper()}_{uuid.uuid4().hex[:8].upper()}",
                    quantity=random.choice([1, 2, 3]),
                    unit_price=price,
                    total_amount=price * random.choice([1, 2]),
                    order_status="DELIVERED",
                    location_id=default_loc.id,
                    created_at=now - timedelta(hours=random.randint(2, 72))
                )
                db.add(ot)

    # 5. Baseline System Alerts
    sample_alerts = [
        ("STOCK_CHANGE", "CRITICAL", "BlinkIt", "Epigamia Greek Yogurt is critically low in stock (4 units left vs 18 avg daily demand)", {"product": "Epigamia Greek Yogurt", "stock": 4}),
        ("PRICE_CHANGE", "WARNING", "BlinkIt", "Amul Salted Butter price dropped by -₹10 (-3.6%) on BlinkIt", {"product": "Amul Butter", "old": 285.0, "new": 275.0}),
        ("PRICE_CHANGE", "INFO", "Zepto", "Nescafe Classic Instant Coffee price dropped to ₹305 on Zepto (10.3% discount)", {"product": "Nescafe Coffee", "discount": 10.3}),
        ("OUT_OF_STOCK", "CRITICAL", "DMart", "Amul Taaza Toned Milk is OUT OF STOCK at DMART_READY_BLR darkstore", {"product": "Amul Milk", "store": "DMART_READY_BLR"}),
        ("OUT_OF_STOCK", "CRITICAL", "Swiggy", "Britannia 100% Whole Wheat Bread is OUT OF STOCK at SWIGGY_POD_INDIRANAGAR", {"product": "Britannia Bread"}),
    ]
    for atype, asev, aplat, amsg, adetails in sample_alerts:
        alt = Alert(
            type=atype,
            severity=asev,
            platform=aplat,
            message=amsg,
            details=adetails,
            status="OPEN",
            created_at=now - timedelta(minutes=(uuid.uuid4().int % 30))
        )
        db.add(alt)

    # 6. Baseline Data Quality Record
    dq = DataQualityResult(
        request_id=f"qc_dq_{uuid.uuid4().hex[:8]}",
        platform="ALL",
        total_fields_checked=total_products * 10,
        missing_fields=0,
        invalid_fields=0,
        quality_score=99.8,
        status="PASSED",
        error_details=None,
        checked_at=now
    )
    db.add(dq)

    # 7. Baseline Sync Run
    srun = SyncRun(
        status="SUCCESS",
        duration_ms=420.0,
        products_retrieved=total_products,
        valid_records=total_products,
        invalid_records=0,
        duplicate_records=2,
        api_calls=7,
        started_at=now - timedelta(minutes=2),
        completed_at=now - timedelta(minutes=2) + timedelta(seconds=1)
    )
    db.add(srun)

    # 8. Seed Baseline Seller Decision Audit Log
    dlog = SellerDecisionLog(
        product_id=db.query(Product).filter(Product.name == "Amul Taaza Toned Milk").first().id,
        recommendation_type="REPLENISHMENT",
        decision="REPLENISH",
        seller_email="demo@quicksync.app",
        data_period="14_DAYS",
        evidence_summary="Demand surged +38% over 14 days. Lead-time replenishment approved.",
        action_attempted="REPLENISHMENT_REQUESTED",
        action_result="Replenishment of 60 units approved — manual platform action required.",
        notes="Pre-weekend high fulfillment buffer.",
        timestamp=now - timedelta(days=2)
    )
    db.add(dlog)

    db.commit()

    # 9. Run Automated Product Matching Engine
    try:
        match_stats = MatchingService.run_product_matching_pipeline(db)
        print(f"Product Matching Engine complete: {match_stats.total_canonical_products} canonical products, {match_stats.high_confidence_matches} high-confidence, {match_stats.pending_review_count} pending reviews.")
    except Exception as e:
        print(f"Error running matching engine in seeder: {e}")

    # 10. Run Demand Recommendation Engine
    try:
        DemandService.get_dashboard_summary(db, period_days=14)
        print("Demand-driven product recommendations generated.")
    except Exception as e:
        print(f"Error generating demand recommendations: {e}")

    print(f"Successfully seeded {total_products} products, time-series demand records, feedback reviews, orders, and decision logs into quicksync database!")

if __name__ == "__main__":
    db = SessionLocal()
    seed_full_demo_dataset(db)
    db.close()
