import unittest
import openpyxl
from io import BytesIO
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.models import (
    Base, User, Product, CanonicalProduct, ProductIdentityMatch,
    Location, InventorySnapshot, PriceSnapshot, DeliveryEtaSnapshot,
    ApiRequest, OrderTransaction
)
from app.services.matching_service import MatchingService
from app.services.export_service import ExportService
from app.services.regional_service import RegionalAnalyticsService
from app.schemas.schemas import ExportFilterRequest

class TestQuickSyncUpdates(unittest.TestCase):

    def setUp(self):
        # Create an in-memory SQLite database for deterministic isolation
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.now = datetime.now(timezone.utc)

        # Setup baseline test entities
        self.location = Location(
            city="Bangalore",
            area="Indiranagar",
            latitude=12.9716,
            longitude=77.5946,
            pincode="560038",
            is_default=True
        )
        self.db.add(self.location)

        # 1. Same physical item across platforms with differing names: "NAVIN BUTTER CAKE" vs "KUMAR CAKE 500G"
        self.p_blink = Product(
            external_product_id="SKU_BLINK_001",
            platform="BlinkIt",
            name="NAVIN BUTTER CAKE",
            brand="Navin",
            category="Bakery & Breads",
            quantity="500 g",
            gtin="8901030889101"
        )
        self.p_zepto = Product(
            external_product_id="SKU_ZEP_001",
            platform="Zepto",
            name="NAVIN BUTTER CAKE 500 GM",
            brand="Navin",
            category="Bakery & Breads",
            quantity="500 g",
            gtin="8901030889101"
        )
        self.p_swiggy = Product(
            external_product_id="SKU_SWIG_001",
            platform="Swiggy",
            name="KUMAR CAKE 500G",
            brand="Navin",
            category="Bakery & Breads",
            quantity="500 g"
        )
        # Different Pack Size (1kg) - MUST NOT BE MERGED with 500g
        self.p_1kg = Product(
            external_product_id="SKU_BB_002",
            platform="BigBasket",
            name="Navin Butter Cake 1kg",
            brand="Navin",
            category="Bakery & Breads",
            quantity="1 kg"
        )
        # Different Variant (Chocolate Cake) - MUST NOT BE MERGED with Butter Cake
        self.p_choc = Product(
            external_product_id="SKU_BLINK_003",
            platform="BlinkIt",
            name="Navin Chocolate Cake 500g",
            brand="Navin",
            category="Bakery & Breads",
            quantity="500 g"
        )

        self.db.add_all([self.p_blink, self.p_zepto, self.p_swiggy, self.p_1kg, self.p_choc])
        self.db.commit()

        # Add snapshots
        self.inv = InventorySnapshot(
            product_id=self.p_blink.id,
            platform="BlinkIt",
            inventory=25,
            available=True,
            location_id=self.location.id,
            request_id="REQ-TEST-001"
        )
        self.price = PriceSnapshot(
            product_id=self.p_blink.id,
            platform="BlinkIt",
            offer_price=180.0,
            mrp=200.0,
            location_id=self.location.id,
            request_id="REQ-TEST-001"
        )
        self.eta = DeliveryEtaSnapshot(
            platform="BlinkIt",
            location_id=self.location.id,
            eta_minutes=10,
            open=True,
            request_id="REQ-TEST-001"
        )
        self.req = ApiRequest(
            request_id="REQ-TEST-001",
            endpoint="/catalog/search",
            platform="BlinkIt",
            status_code=200
        )
        self.db.add_all([self.inv, self.price, self.eta, self.req])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    # ----------------------------------------------------------------
    # UPDATE 1: MULTI-BRAND EXCEL EXPORT TESTS
    # ----------------------------------------------------------------

    def test_excel_export_generation_and_structure(self):
        """Validates server-side openpyxl .xlsx generation, headers, and provenance sheet."""
        filter_req = ExportFilterRequest(
            brands=["Navin"],
            platforms=["BlinkIt", "Zepto"],
            include_identity_matches=True,
            include_sales_metrics=False
        )

        excel_buf = ExportService.generate_excel_export(
            db=self.db,
            filters=filter_req,
            user_email="analyst@quicksync.app"
        )

        self.assertIsInstance(excel_buf, BytesIO)
        excel_buf.seek(0)

        # Load workbook and inspect sheets
        wb = openpyxl.load_workbook(excel_buf)
        self.assertIn("QuickSync_Catalog_Export", wb.sheetnames)
        self.assertIn("Export_Provenance", wb.sheetnames)

        ws_data = wb["QuickSync_Catalog_Export"]
        headers = [cell.value for cell in ws_data[1]]
        
        # Verify required columns exist
        self.assertIn("Brand", headers)
        self.assertIn("Product Name", headers)
        self.assertIn("Canonical Product Name", headers)
        self.assertIn("Platform", headers)
        self.assertIn("Price (INR)", headers)
        self.assertIn("MRP (INR)", headers)
        self.assertIn("Offer Price (INR)", headers)
        self.assertIn("Inventory Stock", headers)
        self.assertIn("Availability", headers)
        self.assertIn("Sales Quantity", headers)
        self.assertIn("Data Source", headers)
        self.assertIn("Match Confidence", headers)

        # Verify zero-mock disclosure for sales quantity
        sales_col_idx = headers.index("Sales Quantity") + 1
        sales_val = ws_data.cell(row=2, column=sales_col_idx).value
        self.assertEqual(sales_val, "DATA NOT AVAILABLE FROM CURRENT SOURCE")

        # Verify Provenance metadata sheet
        ws_meta = wb["Export_Provenance"]
        self.assertIn("PROVENANCE", ws_meta["A1"].value)

    # ----------------------------------------------------------------
    # UPDATE 2: CROSS-PLATFORM DUPLICATE / SAME PRODUCT MATCHING TESTS
    # ----------------------------------------------------------------

    def test_normalization_and_same_product_matching(self):
        """Validates normalization and clustering of differently named physical products."""
        # 1. Normalization unit tests
        norm_name_1, brand_1, pack_1 = MatchingService.normalize_product_name("NAVIN BUTTER CAKE 500G")
        norm_name_2, brand_2, pack_2 = MatchingService.normalize_product_name("Navin Butter Cake - 500 g")
        norm_name_3, brand_3, pack_3 = MatchingService.normalize_product_name("BUTTER CAKE NAVIN 500 GM")

        self.assertEqual(pack_1, "500g")
        self.assertEqual(pack_2, "500g")
        self.assertEqual(pack_3, "500g")

        # 2. Run matching pipeline
        stats = MatchingService.run_product_matching_pipeline(self.db)
        self.assertGreater(stats.total_canonical_products, 0)
        self.assertGreater(stats.high_confidence_matches, 0)

        # 3. GTIN identical items must share canonical ID
        self.db.refresh(self.p_blink)
        self.db.refresh(self.p_zepto)
        self.assertIsNotNone(self.p_blink.canonical_product_id)
        self.assertEqual(self.p_blink.canonical_product_id, self.p_zepto.canonical_product_id)

    def test_different_pack_size_and_variant_preservation(self):
        """Ensures 500g and 1kg, and Vanilla vs Chocolate are NOT falsely merged."""
        MatchingService.run_product_matching_pipeline(self.db)

        self.db.refresh(self.p_blink)
        self.db.refresh(self.p_1kg)
        self.db.refresh(self.p_choc)

        # 500g vs 1kg must have distinct canonical identities
        self.assertNotEqual(self.p_blink.canonical_product_id, self.p_1kg.canonical_product_id)

        # Butter Cake vs Chocolate Cake must have distinct canonical identities
        self.assertNotEqual(self.p_blink.canonical_product_id, self.p_choc.canonical_product_id)

    def test_human_review_workflow(self):
        """Tests admin match acceptance and rejection persistence."""
        MatchingService.run_product_matching_pipeline(self.db)
        
        match = self.db.query(ProductIdentityMatch).first()
        self.assertIsNotNone(match)

        # Human Review Accept
        res = MatchingService.review_match(
            db=self.db,
            match_id=match.id,
            decision="ACCEPTED",
            reviewer_id="admin@quicksync.app",
            reason="Confirmed same product after manual physical inspection."
        )
        self.assertTrue(res.success)
        self.assertEqual(res.decision, "ACCEPTED")

    # ----------------------------------------------------------------
    # UPDATE 3: INDIA REGIONAL HEAT MAP & 7-PLATFORM COMPARISON TESTS
    # ----------------------------------------------------------------

    def test_regional_analytics_and_pictogram_generation(self):
        """Validates dynamic regional intensity and 7-platform comparison calculation."""
        map_out = RegionalAnalyticsService.get_india_regional_map(
            db=self.db,
            metric="products_count"
        )

        self.assertEqual(map_out.total_monitored_regions, 1)
        region = map_out.regions[0]
        self.assertEqual(region.city, "Bangalore")
        self.assertIn(region.activity_level, ["HIGH ACTIVITY", "MEDIUM ACTIVITY", "LOW ACTIVITY"])
        
        # Verify 7 platforms are included
        platform_names = [p.platform for p in region.platform_comparison]
        self.assertIn("BlinkIt", platform_names)
        self.assertIn("Zepto", platform_names)
        self.assertIn("Swiggy", platform_names)
        self.assertIn("BigBasket", platform_names)
        self.assertIn("DMart", platform_names)
        self.assertIn("JioMart", platform_names)
        self.assertIn("Minutes", platform_names)

        # Check intensity score bounds (1 to 5)
        for pc in region.platform_comparison:
            self.assertGreaterEqual(pc.intensity_score, 0)
            self.assertLessEqual(pc.intensity_score, 5)

        # Verify zero-mock sales disclosure
        self.assertEqual(region.sales_data_status, "SALES DATA SOURCE NOT CONFIGURED")

    def test_data_traceability_audit(self):
        """Validates [VIEW SOURCE] provenance transparency details."""
        trace = RegionalAnalyticsService.get_data_traceability(
            db=self.db,
            region_city="Bangalore"
        )
        self.assertEqual(trace["region"], "Bangalore")
        self.assertEqual(trace["request_id"], "REQ-TEST-001")
        self.assertTrue(trace["verified_real_data"])
        self.assertIn("PostgreSQL", trace["data_source"])

if __name__ == "__main__":
    unittest.main()
