import re
import uuid
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from ..core.logging import logger, log_event
from ..models.models import (
    Product, CanonicalProduct, ProductIdentityMatch, ProductAlias,
    ProductMatchReview, PriceSnapshot, InventorySnapshot, AuditLog
)
from ..schemas.schemas import (
    CanonicalProductOut, ProductIdentityMatchOut, MatchReviewResult,
    MatchEngineStatsOut
)
from ..websocket.manager import ws_manager

class MatchingService:
    """
    Cross-Platform Product Identity & Duplicate Detection Engine.
    Groups differently-named platform records into Canonical Products based on:
    - Strong identifiers (GTIN / EAN / UPC / Barcode)
    - Deterministic Brand, Pack Size, and Name normalization
    - Multi-signal confidence scoring
    """

    @staticmethod
    def normalize_quantity_string(qty_str: Optional[str]) -> str:
        if not qty_str:
            return ""
        s = qty_str.lower().strip()
        # Clean spacing between numbers and units
        s = re.sub(r'(\d+)\s*(g|gm|gms|gram|grams)\b', r'\1g', s)
        s = re.sub(r'(\d+)\s*(kg|kgs|kilo|kilogram)\b', r'\1kg', s)
        s = re.sub(r'(\d+)\s*(ml|milli|millilitre|milliliter)\b', r'\1ml', s)
        s = re.sub(r'(\d+)\s*(l|ltr|litre|liter|litres)\b', r'\1l', s)
        s = re.sub(r'(\d+)\s*(pc|pcs|pieces|units|pack)\b', r'\1pc', s)

        # Standardize 0.5kg -> 500g, 0.5l -> 500ml, 1000g -> 1kg, 1000ml -> 1l
        if s == "0.5kg" or s == "500gm":
            return "500g"
        if s == "1000g":
            return "1kg"
        if s == "0.5l" or s == "500milli":
            return "500ml"
        if s == "1000ml":
            return "1l"
        return s

    @staticmethod
    def normalize_product_name(name: str, brand: Optional[str] = None, qty: Optional[str] = None) -> Tuple[str, str, str]:
        """
        Normalizes product names by:
        1. Stripping punctuation, excessive spaces, and noise words (e.g. 'fresh', 'pack of 1', 'online', 'special offer').
        2. Normalizing units & pack sizes.
        3. Preserving critical variant signals (e.g. salted, unsalted, chocolate, vanilla, toned, double toned).
        Returns (normalized_full_name, detected_brand, normalized_quantity).
        """
        if not name:
            return "", "", ""

        raw = name.lower()
        
        # Extract pack / quantity if embedded in title
        detected_qty = MatchingService.normalize_quantity_string(qty)
        if not detected_qty:
            qty_match = re.search(r'(\d+(?:\.\d+)?\s*(?:g|gm|kg|ml|l|ltr|pcs|pack))\b', raw)
            if qty_match:
                detected_qty = MatchingService.normalize_quantity_string(qty_match.group(1))

        # Extract Brand
        detected_brand = (brand or "").strip()
        if not detected_brand:
            common_brands = ["amul", "britannia", "nandini", "mother dairy", "epigamia", "daawat", "fortune", "nescafe", "red bull", "tata", "modern", "lay's", "doritos", "haldiram's", "oreo", "cadbury"]
            for b in common_brands:
                if b in raw:
                    detected_brand = b.title()
                    break

        # Strip punctuation but keep alphanumeric and spaces
        cleaned = re.sub(r'[^\w\s\.]', ' ', raw)
        
        # Remove promotional fluff tokens without removing flavor/variant words
        noise_tokens = ["pack of 1", "special offer", "combo pack", "pouch", "tetra pack", "box", "fresh", "best quality", "online", "premium quality"]
        for nt in noise_tokens:
            cleaned = cleaned.replace(nt, " ")

        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Normalize quantity token in the name string
        if detected_qty:
            cleaned = f"{cleaned} {detected_qty}"
            cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        return cleaned, detected_brand or "General", detected_qty

    @staticmethod
    def calculate_match_signals(prod_a: Product, prod_b_or_canonical: Any) -> Tuple[float, str, Dict[str, Any], str]:
        """
        Calculates mathematical match score between a platform Product and a Canonical Product (or other Product).
        Returns (match_score, confidence_level, matching_attributes, match_reason).
        """
        name_a_norm, brand_a, qty_a = MatchingService.normalize_product_name(prod_a.name, prod_a.brand, prod_a.quantity)
        
        if isinstance(prod_b_or_canonical, CanonicalProduct):
            name_b_norm = prod_b_or_canonical.normalized_name
            brand_b = prod_b_or_canonical.brand or ""
            qty_b = prod_b_or_canonical.normalized_quantity or ""
            gtin_b = prod_b_or_canonical.gtin
        else:
            name_b_norm, brand_b, qty_b = MatchingService.normalize_product_name(prod_b_or_canonical.name, prod_b_or_canonical.brand, prod_b_or_canonical.quantity)
            gtin_b = getattr(prod_b_or_canonical, "gtin", None)

        # 1. Strong Identifier Check (GTIN / Barcode)
        gtin_a = getattr(prod_a, "gtin", None)
        if gtin_a and gtin_b and gtin_a == gtin_b:
            return 100.0, "HIGH_CONFIDENCE", {
                "gtin_match": True,
                "brand_match": True,
                "pack_match": True,
                "name_similarity": 1.0
            }, f"Exact GTIN/Barcode match ({gtin_a})."

        # 2. Brand Check
        brand_match = False
        brand_score = 0.0
        if brand_a and brand_b:
            if brand_a.lower() == brand_b.lower() or brand_a.lower() in brand_b.lower() or brand_b.lower() in brand_a.lower():
                brand_match = True
                brand_score = 35.0

        # 3. Pack Size / Quantity Strict Check
        pack_match = False
        pack_score = 0.0
        if qty_a and qty_b:
            if qty_a == qty_b:
                pack_match = True
                pack_score = 30.0
            else:
                # Different pack size (e.g. 500g vs 1kg) MUST NOT be grouped together!
                return 15.0, "UNMATCHED", {
                    "brand_match": brand_match,
                    "pack_match": False,
                    "quantity_a": qty_a,
                    "quantity_b": qty_b,
                    "name_similarity": 0.2
                }, f"Different pack sizes ({qty_a} vs {qty_b}) cannot be canonical duplicates."
        else:
            # Neutral if quantity string is missing
            pack_score = 15.0

        # 4. Name Token & Sequence Similarity
        # Check variant contradictions (e.g., chocolate vs butter, vanilla vs chocolate, salted vs unsalted)
        variant_keywords = {"chocolate", "butter", "vanilla", "strawberry", "pineapple", "mango", "orange", "salted", "unsalted", "toned", "skimmed", "cream", "diet", "spicy"}
        tokens_a_var = set(name_a_norm.split()).intersection(variant_keywords)
        tokens_b_var = set(name_b_norm.split()).intersection(variant_keywords)
        if tokens_a_var and tokens_b_var and tokens_a_var != tokens_b_var:
            return 20.0, "UNMATCHED", {
                "brand_match": brand_match,
                "variant_conflict": f"{list(tokens_a_var)} vs {list(tokens_b_var)}"
            }, f"Product variant mismatch detected: {list(tokens_a_var)} vs {list(tokens_b_var)}."

        seq_matcher = SequenceMatcher(None, name_a_norm, name_b_norm)
        seq_ratio = seq_matcher.ratio()
        
        # Token overlap
        tokens_a = set(name_a_norm.split())
        tokens_b = set(name_b_norm.split())
        token_jaccard = len(tokens_a.intersection(tokens_b)) / max(len(tokens_a.union(tokens_b)), 1)
        
        similarity = (seq_ratio * 0.5) + (token_jaccard * 0.5)
        name_score = similarity * 35.0

        total_score = round(brand_score + pack_score + name_score, 1)

        # Confidence Level classification
        if total_score >= 85.0 and brand_match and (pack_match or not (qty_a and qty_b)):
            confidence = "HIGH_CONFIDENCE"
            reason = f"High similarity ({total_score}%) with identical brand ('{brand_a}') and matching pack volume ('{qty_a}')."
        elif total_score >= 65.0 and (brand_match or pack_match):
            confidence = "MEDIUM_CONFIDENCE"
            reason = f"Medium confidence ({total_score}%). Normalized title tokens overlap with identical attributes, human verification advised."
        elif total_score >= 40.0:
            confidence = "LOW_CONFIDENCE"
            reason = f"Low confidence ({total_score}%). Partial match on brand/category with title differences. Requires manual review."
        else:
            confidence = "UNMATCHED"
            reason = f"Insufficient matching signals ({total_score}%). Treated as distinct product."

        attrs = {
            "brand_match": brand_match,
            "pack_match": pack_match,
            "quantity_a": qty_a,
            "quantity_b": qty_b,
            "seq_ratio": round(seq_ratio, 3),
            "token_jaccard": round(token_jaccard, 3),
            "similarity": round(similarity, 3),
            "total_score": total_score
        }

        return total_score, confidence, attrs, reason

    @staticmethod
    def run_product_matching_pipeline(db: Session) -> MatchEngineStatsOut:
        """
        Executes the Product Identity & Duplicate Grouping Engine across all platform products.
        Clusters products into Canonical Products and creates ProductIdentityMatch records.
        """
        now = datetime.now(timezone.utc)
        products = db.query(Product).all()

        # Step 1: Ensure initial seed canonical products exist or build them
        canonical_products = db.query(CanonicalProduct).all()
        canonical_map: Dict[str, CanonicalProduct] = {cp.canonical_code: cp for cp in canonical_products}

        # Track existing matches
        high_cnt = 0
        med_cnt = 0
        low_cnt = 0
        pending_review = 0
        accepted_cnt = 0
        rejected_cnt = 0
        unmatched_cnt = 0

        for p in products:
            name_norm, brand, qty = MatchingService.normalize_product_name(p.name, p.brand, p.quantity)

            # Find best matching canonical product
            best_match_cp: Optional[CanonicalProduct] = None
            best_score = 0.0
            best_conf = "UNMATCHED"
            best_attrs = {}
            best_reason = ""

            for cp in canonical_products:
                score, conf, attrs, reason = MatchingService.calculate_match_signals(p, cp)
                if score > best_score:
                    best_score = score
                    best_conf = conf
                    best_attrs = attrs
                    best_reason = reason
                    best_match_cp = cp

            # If score is HIGH_CONFIDENCE (>= 85%), associate with canonical product
            if best_score >= 85.0 and best_match_cp:
                p.canonical_product_id = best_match_cp.id
                
                # Check/create match record
                match_rec = db.query(ProductIdentityMatch).filter(
                    ProductIdentityMatch.product_id == p.id,
                    ProductIdentityMatch.canonical_product_id == best_match_cp.id
                ).first()

                if not match_rec:
                    match_rec = ProductIdentityMatch(
                        canonical_product_id=best_match_cp.id,
                        product_id=p.id,
                        match_score=best_score,
                        confidence_level=best_conf,
                        match_reason=best_reason,
                        matching_attributes=best_attrs,
                        status="AUTO_MATCHED",
                        created_at=now,
                        updated_at=now
                    )
                    db.add(match_rec)
                else:
                    match_rec.match_score = best_score
                    match_rec.confidence_level = best_conf
                    match_rec.match_reason = best_reason
                    match_rec.matching_attributes = best_attrs
                    match_rec.updated_at = now

                # Add alias
                alias = db.query(ProductAlias).filter(
                    ProductAlias.canonical_product_id == best_match_cp.id,
                    ProductAlias.alias_name == p.name
                ).first()
                if not alias:
                    alias = ProductAlias(
                        canonical_product_id=best_match_cp.id,
                        alias_name=p.name,
                        platform=p.platform,
                        created_at=now
                    )
                    db.add(alias)

                high_cnt += 1

            elif best_score >= 50.0 and best_match_cp:
                # Requires human review
                match_rec = db.query(ProductIdentityMatch).filter(
                    ProductIdentityMatch.product_id == p.id,
                    ProductIdentityMatch.canonical_product_id == best_match_cp.id
                ).first()

                if not match_rec:
                    match_rec = ProductIdentityMatch(
                        canonical_product_id=best_match_cp.id,
                        product_id=p.id,
                        match_score=best_score,
                        confidence_level=best_conf,
                        match_reason=best_reason,
                        matching_attributes=best_attrs,
                        status="PENDING_REVIEW",
                        created_at=now,
                        updated_at=now
                    )
                    db.add(match_rec)
                
                if best_conf == "MEDIUM_CONFIDENCE":
                    med_cnt += 1
                else:
                    low_cnt += 1
                pending_review += 1

            else:
                # Create a new canonical product identity for this distinct product
                new_code = f"QS-PROD-{str(len(canonical_products) + 101).zfill(6)}"
                new_cp = CanonicalProduct(
                    canonical_code=new_code,
                    canonical_name=f"{brand} {p.name} {qty}".strip(),
                    brand=brand,
                    normalized_name=name_norm,
                    quantity=p.quantity,
                    normalized_quantity=qty,
                    category=p.category,
                    gtin=p.gtin,
                    image_url=p.image_url,
                    created_at=now,
                    updated_at=now
                )
                db.add(new_cp)
                db.commit()
                db.refresh(new_cp)
                canonical_products.append(new_cp)

                p.canonical_product_id = new_cp.id

                match_rec = ProductIdentityMatch(
                    canonical_product_id=new_cp.id,
                    product_id=p.id,
                    match_score=100.0,
                    confidence_level="HIGH_CONFIDENCE",
                    match_reason="Direct primary canonical assignment.",
                    matching_attributes={"direct_assignment": True},
                    status="AUTO_MATCHED",
                    created_at=now,
                    updated_at=now
                )
                db.add(match_rec)
                high_cnt += 1

        db.commit()

        # Compute total stats
        all_matches = db.query(ProductIdentityMatch).all()
        accepted_cnt = sum(1 for m in all_matches if m.status in ["ACCEPTED", "AUTO_MATCHED"])
        rejected_cnt = sum(1 for m in all_matches if m.status == "REJECTED")
        pending_review = sum(1 for m in all_matches if m.status == "PENDING_REVIEW")

        stats = MatchEngineStatsOut(
            total_platform_products=len(products),
            total_canonical_products=len(canonical_products),
            high_confidence_matches=high_cnt,
            medium_confidence_matches=med_cnt,
            low_confidence_matches=low_cnt,
            pending_review_count=pending_review,
            accepted_matches_count=accepted_cnt,
            rejected_matches_count=rejected_cnt,
            unmatched_count=unmatched_cnt,
            last_engine_run_at=now
        )
        return stats

    @staticmethod
    def get_matching_stats(db: Session) -> MatchEngineStatsOut:
        now = datetime.now(timezone.utc)
        products = db.query(Product).all()
        canonical_products = db.query(CanonicalProduct).all()
        all_matches = db.query(ProductIdentityMatch).all()

        high_cnt = sum(1 for m in all_matches if m.confidence_level == "HIGH_CONFIDENCE")
        med_cnt = sum(1 for m in all_matches if m.confidence_level in ["MEDIUM_CONFIDENCE", "REQUIRES_REVIEW"])
        low_cnt = sum(1 for m in all_matches if m.confidence_level == "LOW_CONFIDENCE")
        accepted_cnt = sum(1 for m in all_matches if m.status == "ACCEPTED")
        rejected_cnt = sum(1 for m in all_matches if m.status == "REJECTED")
        pending_review = sum(1 for m in all_matches if m.status == "PENDING_REVIEW" or m.confidence_level in ["MEDIUM_CONFIDENCE", "REQUIRES_REVIEW"])
        unmatched_cnt = sum(1 for p in products if not p.canonical_product_id)

        return MatchEngineStatsOut(
            total_platform_products=len(products),
            total_canonical_products=len(canonical_products),
            high_confidence_matches=high_cnt,
            medium_confidence_matches=med_cnt,
            low_confidence_matches=low_cnt,
            pending_review_count=pending_review,
            accepted_matches_count=accepted_cnt,
            rejected_matches_count=rejected_cnt,
            unmatched_count=unmatched_cnt,
            last_engine_run_at=now
        )

    @staticmethod
    def get_product_matches(
        db: Session,
        confidence_level: Optional[str] = None,
        status: Optional[str] = None,
        platform: Optional[str] = None,
        limit: int = 100
    ) -> List[ProductIdentityMatchOut]:
        query = db.query(ProductIdentityMatch)
        if status and status != "ALL":
            query = query.filter(ProductIdentityMatch.status == status)
        if confidence_level and confidence_level != "ALL":
            query = query.filter(ProductIdentityMatch.confidence_level == confidence_level)

        matches = query.order_by(ProductIdentityMatch.match_score.desc()).limit(limit * 2).all()
        results = []

        for m in matches:
            prod = db.query(Product).filter(Product.id == m.product_id).first()
            canon = db.query(CanonicalProduct).filter(CanonicalProduct.id == m.canonical_product_id).first()
            if not prod or not canon:
                continue

            if platform and platform != "ALL" and prod.platform != platform:
                continue

            psnap = db.query(PriceSnapshot).filter(PriceSnapshot.product_id == prod.id).order_by(PriceSnapshot.fetched_at.desc()).first()
            isnap = db.query(InventorySnapshot).filter(InventorySnapshot.product_id == prod.id).order_by(InventorySnapshot.fetched_at.desc()).first()

            results.append(ProductIdentityMatchOut(
                id=m.id,
                canonical_product_id=canon.id,
                canonical_code=canon.canonical_code,
                canonical_name=canon.canonical_name,
                canonical_brand=canon.brand,
                product_id=prod.id,
                platform=prod.platform,
                platform_product_name=prod.name,
                platform_brand=prod.brand,
                platform_quantity=prod.quantity,
                offer_price=psnap.offer_price if psnap else None,
                mrp=psnap.mrp if psnap else None,
                current_stock=isnap.inventory if isnap else None,
                image_url=prod.image_url,
                match_score=m.match_score,
                confidence_level=m.confidence_level,
                match_reason=m.match_reason,
                matching_attributes=m.matching_attributes or {},
                status=m.status,
                created_at=m.created_at,
                updated_at=m.updated_at
            ))
            if len(results) >= limit:
                break

        return results

    @staticmethod
    def get_matches_list(
        db: Session,
        status: Optional[str] = "ALL",
        confidence: Optional[str] = "ALL",
        limit: int = 100
    ) -> List[ProductIdentityMatchOut]:
        return MatchingService.get_product_matches(db=db, confidence_level=confidence, status=status, limit=limit)

    @staticmethod
    def get_canonical_products(
        db: Session,
        brand: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 100
    ) -> List[CanonicalProductOut]:
        query = db.query(CanonicalProduct)
        if brand:
            query = query.filter(CanonicalProduct.brand.ilike(f"%{brand}%"))
        if category:
            query = query.filter(CanonicalProduct.category.ilike(f"%{category}%"))
        
        canons = query.order_by(CanonicalProduct.canonical_code.asc()).limit(limit).all()
        results = []
        for c in canons:
            linked_count = db.query(Product).filter(Product.canonical_product_id == c.id).count()
            results.append(CanonicalProductOut(
                id=c.id,
                canonical_code=c.canonical_code,
                canonical_name=c.canonical_name,
                brand=c.brand,
                normalized_name=c.normalized_name,
                quantity=c.quantity,
                normalized_quantity=c.normalized_quantity,
                category=c.category,
                gtin=c.gtin,
                image_url=c.image_url,
                linked_products_count=linked_count,
                created_at=c.created_at,
                updated_at=c.updated_at
            ))
        return results

    @staticmethod
    def get_canonical_products_list(db: Session, limit: int = 100) -> List[CanonicalProductOut]:
        return MatchingService.get_canonical_products(db=db, limit=limit)

    @staticmethod
    def review_match(
        db: Session,
        match_id: str,
        decision: str,
        reviewer_id: str,
        reason: Optional[str] = None,
        target_canonical_id: Optional[str] = None
    ) -> MatchReviewResult:
        match = db.query(ProductIdentityMatch).filter(ProductIdentityMatch.id == match_id).first()
        if not match:
            raise ValueError(f"Match ID '{match_id}' not found.")

        now = datetime.now(timezone.utc)
        prod = db.query(Product).filter(Product.id == match.product_id).first()
        
        if decision.upper() == "ACCEPTED":
            match.status = "ACCEPTED"
            match.updated_at = now
            if prod:
                target_can = target_canonical_id or match.canonical_product_id
                prod.canonical_product_id = target_can
            message = f"Product match accepted. '{prod.name if prod else ''}' linked to Canonical Product."
        elif decision.upper() == "REJECTED":
            match.status = "REJECTED"
            match.updated_at = now
            if prod and prod.canonical_product_id == match.canonical_product_id:
                prod.canonical_product_id = None
            message = f"Product match rejected. '{prod.name if prod else ''}' unlinked from Canonical Product."
        else:
            raise ValueError(f"Invalid decision '{decision}'. Must be ACCEPTED or REJECTED.")

        # Record human review in audit log
        rev = ProductMatchReview(
            match_id=match.id,
            reviewer_id=reviewer_id,
            decision=decision.upper(),
            reason=reason,
            created_at=now
        )
        db.add(rev)

        audit = AuditLog(
            user_email=reviewer_id,
            action=f"PRODUCT_MATCH_REVIEW_{decision.upper()}",
            metadata_json={
                "match_id": match.id,
                "product_id": prod.id if prod else None,
                "product_name": prod.name if prod else None,
                "canonical_product_id": match.canonical_product_id,
                "decision": decision.upper(),
                "reason": reason
            },
            created_at=now
        )
        db.add(audit)
        db.commit()

        return MatchReviewResult(
            success=True,
            match_id=match.id,
            decision=decision.upper(),
            canonical_product_id=match.canonical_product_id,
            message=message,
            timestamp=now
        )

    @staticmethod
    async def review_product_match(
        match_id: str,
        decision: str,
        user_email: str,
        reason: Optional[str],
        target_canonical_id: Optional[str],
        db: Session
    ) -> MatchReviewResult:
        res = MatchingService.review_match(
            db=db,
            match_id=match_id,
            decision=decision,
            reviewer_id=user_email,
            reason=reason,
            target_canonical_id=target_canonical_id
        )
        now = datetime.now(timezone.utc)
        try:
            await ws_manager.broadcast(
                "PRODUCT_MATCH_UPDATED",
                {
                    "match_id": match_id,
                    "decision": decision.upper(),
                    "reviewer": user_email,
                    "timestamp": now.isoformat()
                }
            )
        except Exception:
            pass
        return res
