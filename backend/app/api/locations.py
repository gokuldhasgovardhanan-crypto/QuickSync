from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.models import Location, User
from ..schemas.schemas import LocationOut, LocationCreate
from .deps import get_current_user

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("", response_model=List[LocationOut])
def get_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Location).order_by(Location.is_default.desc(), Location.city).all()

@router.post("", response_model=LocationOut)
def create_location(
    req: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if req.is_default:
        # Reset other default locations
        db.query(Location).update({Location.is_default: False})
        
    loc = Location(
        city=req.city,
        area=req.area,
        latitude=req.latitude,
        longitude=req.longitude,
        pincode=req.pincode,
        is_default=req.is_default or False
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc
