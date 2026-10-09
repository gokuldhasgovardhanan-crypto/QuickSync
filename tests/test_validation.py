import pytest
from backend.app.connectors.validator import DataValidator

def test_validation_valid_payload():
    raw_item = {
        "external_product_id": "prod_1001",
        "name": "Amul Taaza Toned Milk",
        "brand": "Amul",
        "quantity": "500 ml",
        "price": 27.0,
        "mrp": 30.0,
        "available": True,
        "inventory": 10,
        "store_id": "DARKSTORE_BLR_01",
        "eta_minutes": 8,
        "platform": "BlinkIt"
    }
    res = DataValidator.normalize_item(raw_item, default_platform="BlinkIt")
    assert res.is_valid is True
    assert len(res.errors) == 0
    assert res.normalized_item is not None
    assert res.normalized_item.offer_price == 27.0
    assert res.normalized_item.mrp == 30.0
    assert res.normalized_item.discount_percentage == 10.0
    assert res.normalized_item.available is True
    assert res.normalized_item.inventory == 10
    assert res.normalized_item.eta_minutes == 8

def test_validation_negative_price_rejection():
    raw_item = {
        "external_product_id": "prod_1002",
        "name": "Invalid Item",
        "price": -15.0,
        "platform": "Zepto"
    }
    res = DataValidator.normalize_item(raw_item, default_platform="Zepto")
    assert res.is_valid is False
    assert any("Invalid price value" in err for err in res.errors)

def test_validation_missing_name_rejection():
    raw_item = {
        "external_product_id": "prod_1003",
        "price": 50.0,
        "platform": "Swiggy"
    }
    res = DataValidator.normalize_item(raw_item, default_platform="Swiggy")
    assert res.is_valid is False
    assert any("Missing required field: name" in err for err in res.errors)

def test_validation_missing_optional_fields_leaves_null():
    raw_item = {
        "external_product_id": "prod_1004",
        "name": "Britannia Whole Wheat Bread",
        "price": 45.0,
        "platform": "BigBasket"
    }
    res = DataValidator.normalize_item(raw_item, default_platform="BigBasket")
    assert res.is_valid is True
    assert res.normalized_item.brand is None
    assert res.normalized_item.inventory is None
    assert res.normalized_item.eta_minutes is None
    # Crucial: Never invent fake values for missing fields
    assert res.normalized_item.rating is None
