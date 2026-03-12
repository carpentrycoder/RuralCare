from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Medicine, Pharmacy, PharmacyInventory


router = APIRouter(prefix="/pharmacies", tags=["Pharmacies"])


class PharmacyIn(BaseModel):
    pharmacist_name: str
    store_name: str
    degree: str = ""
    license_number: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""
    opening_hours: str = ""
    verified: bool = False
    user_id: Optional[int] = None


class PharmacyOut(PharmacyIn):
    id: int

    class Config:
        from_attributes = True


class PharmacyAvailabilityOut(BaseModel):
    pharmacy_id: int
    store_name: str
    pharmacist_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    opening_hours: str
    verified: bool
    medicine_id: int
    medicine_name: str
    quantity_available: int


@router.get("/availability", response_model=list[PharmacyAvailabilityOut])
def get_pharmacy_availability(
    medicine_id: int = Query(...),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Pharmacy, Medicine, PharmacyInventory)
        .join(PharmacyInventory, PharmacyInventory.pharmacy_id == Pharmacy.id)
        .join(Medicine, PharmacyInventory.medicine_id == Medicine.id)
        .filter(PharmacyInventory.medicine_id == medicine_id)
        .filter(PharmacyInventory.quantity_available > 0)
        .order_by(PharmacyInventory.quantity_available.desc(), Pharmacy.store_name.asc())
        .all()
    )

    return [
        PharmacyAvailabilityOut(
            pharmacy_id=pharmacy.id,
            store_name=pharmacy.store_name,
            pharmacist_name=pharmacy.pharmacist_name,
            phone=pharmacy.phone,
            address=pharmacy.address,
            city=pharmacy.city,
            state=pharmacy.state,
            pincode=pharmacy.pincode,
            opening_hours=pharmacy.opening_hours,
            verified=pharmacy.verified,
            medicine_id=medicine.id,
            medicine_name=medicine.name,
            quantity_available=inventory.quantity_available,
        )
        for pharmacy, medicine, inventory in rows
    ]


@router.get("/", response_model=list[PharmacyOut])
def list_pharmacies(user_id: Optional[int] = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Pharmacy)
    if user_id is not None:
        query = query.filter(Pharmacy.user_id == user_id)
    return query.all()


@router.post("/", response_model=PharmacyOut, status_code=201)
def create_pharmacy(data: PharmacyIn, db: Session = Depends(get_db)):
    pharmacy = Pharmacy(**data.model_dump())
    db.add(pharmacy)
    db.commit()
    db.refresh(pharmacy)
    return pharmacy


@router.get("/{pharmacy_id}", response_model=PharmacyOut)
def get_pharmacy(pharmacy_id: int, db: Session = Depends(get_db)):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return pharmacy


@router.put("/{pharmacy_id}", response_model=PharmacyOut)
def update_pharmacy(pharmacy_id: int, data: PharmacyIn, db: Session = Depends(get_db)):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    for key, value in data.model_dump().items():
        setattr(pharmacy, key, value)
    db.commit()
    db.refresh(pharmacy)
    return pharmacy


@router.delete("/{pharmacy_id}", status_code=204)
def delete_pharmacy(pharmacy_id: int, db: Session = Depends(get_db)):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    db.delete(pharmacy)
    db.commit()