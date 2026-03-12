from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient, SymptomRecord

router = APIRouter(prefix="/patients", tags=["Patients"])


def current_local_timestamp() -> datetime:
    return datetime.now().astimezone()


def parse_recorded_at(recorded_at: Optional[str]) -> datetime:
    if not recorded_at:
        return current_local_timestamp()
    normalized = recorded_at.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return current_local_timestamp()
    return parsed if parsed.tzinfo else parsed.astimezone()


def serialize_symptom_record(symptom: SymptomRecord) -> dict[str, Any]:
    return {
        "id": symptom.id,
        "symptom_name": symptom.symptom_name,
        "duration": symptom.duration,
        "recorded_at": symptom.recorded_at.isoformat(),
    }


def migrate_legacy_symptoms(patient: Patient, db: Session) -> None:
    legacy_symptoms = patient.symptoms or []
    if not legacy_symptoms:
        return

    for symptom in legacy_symptoms:
        db.add(
            SymptomRecord(
                patient_id=patient.id,
                symptom_name=symptom.get("symptom_name", "Unknown"),
                duration=symptom.get("duration", "Unknown"),
                recorded_at=parse_recorded_at(symptom.get("recorded_at")),
            )
        )

    patient.symptoms = []
    db.commit()
    db.refresh(patient)


def list_symptoms(patient_id: int, db: Session) -> list[dict[str, Any]]:
    records = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.patient_id == patient_id)
        .order_by(SymptomRecord.recorded_at.desc(), SymptomRecord.id.desc())
        .all()
    )
    return [serialize_symptom_record(record) for record in records]


def patient_to_response(patient: Patient, db: Session) -> dict[str, Any]:
    return {
        "id": patient.id,
        "name": patient.name,
        "user_id": patient.user_id,
        "age": patient.age,
        "gender": patient.gender,
        "phone": patient.phone,
        "blood_group": patient.blood_group,
        "symptoms": list_symptoms(patient.id, db),
        "health_metrics": patient.health_metrics or {},
        "health_records": patient.health_records or [],
        "prescriptions": patient.prescriptions or [],
    }


class PatientIn(BaseModel):
    name: str
    user_id: Optional[int] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    symptoms: Optional[list[Any]] = []
    health_metrics: Optional[dict[str, Any]] = {}
    health_records: Optional[list[Any]] = []
    prescriptions: Optional[list[Any]] = []


class PatientOut(PatientIn):
    id: int

    class Config:
        from_attributes = True


class SymptomAdd(BaseModel):
    symptom_name: str
    duration: str
    recorded_at: Optional[str] = None


class SymptomBatchAdd(BaseModel):
    symptom_names: list[str]
    duration: str


@router.get("/", response_model=list[PatientOut])
def list_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    for patient in patients:
        migrate_legacy_symptoms(patient, db)
    return [patient_to_response(patient, db) for patient in patients]


@router.post("/", response_model=PatientOut, status_code=201)
def create_patient(data: PatientIn, db: Session = Depends(get_db)):
    payload = data.model_dump()
    symptoms = payload.pop("symptoms", []) or []
    patient = Patient(**payload)
    db.add(patient)
    db.commit()
    db.refresh(patient)

    for symptom in symptoms:
        db.add(
            SymptomRecord(
                patient_id=patient.id,
                symptom_name=symptom.get("symptom_name", "Unknown"),
                duration=symptom.get("duration", "Unknown"),
                recorded_at=parse_recorded_at(symptom.get("recorded_at")),
            )
        )
    if symptoms:
        db.commit()

    db.refresh(patient)
    return patient_to_response(patient, db)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    migrate_legacy_symptoms(patient, db)
    return patient_to_response(patient, db)


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: int, data: PatientIn, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    payload = data.model_dump()
    payload.pop("symptoms", None)
    for key, value in payload.items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)
    migrate_legacy_symptoms(patient, db)
    return patient_to_response(patient, db)


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.query(SymptomRecord).filter(SymptomRecord.patient_id == patient.id).delete(synchronize_session=False)
    db.delete(patient)
    db.commit()


@router.get("/by-user/{user_id}", response_model=PatientOut)
def get_patient_by_user(user_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.user_id == user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found for this user")
    migrate_legacy_symptoms(patient, db)
    return patient_to_response(patient, db)


@router.post("/{patient_id}/symptoms")
def add_symptom(patient_id: int, symptom: SymptomAdd, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    migrate_legacy_symptoms(patient, db)
    new_symptom = SymptomRecord(
        patient_id=patient.id,
        symptom_name=symptom.symptom_name,
        duration=symptom.duration,
        recorded_at=parse_recorded_at(symptom.recorded_at),
    )
    db.add(new_symptom)
    db.commit()
    db.refresh(new_symptom)

    return {
        "message": "Symptom added",
        "patient_id": patient_id,
        "symptom": serialize_symptom_record(new_symptom),
    }


@router.post("/{patient_id}/symptoms/batch")
def add_symptoms_batch(patient_id: int, payload: SymptomBatchAdd, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    symptom_names = [name.strip() for name in payload.symptom_names if name.strip()]
    if not symptom_names:
        raise HTTPException(status_code=400, detail="No symptoms provided")

    migrate_legacy_symptoms(patient, db)
    new_symptoms = [
        SymptomRecord(
            patient_id=patient.id,
            symptom_name=name,
            duration=payload.duration,
            recorded_at=current_local_timestamp(),
        )
        for name in symptom_names
    ]
    db.add_all(new_symptoms)
    db.commit()
    for symptom in new_symptoms:
        db.refresh(symptom)

    return {
        "message": "Symptoms added",
        "patient_id": patient_id,
        "symptoms": [serialize_symptom_record(symptom) for symptom in new_symptoms],
    }


@router.delete("/{patient_id}/symptoms/{symptom_name}")
def remove_symptom(
    patient_id: int,
    symptom_name: str,
    symptom_id: Optional[str] = None,
    recorded_at: Optional[str] = None,
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    migrate_legacy_symptoms(patient, db)

    query = db.query(SymptomRecord).filter(SymptomRecord.patient_id == patient.id)
    if symptom_id:
        query = query.filter(SymptomRecord.id == int(symptom_id))
    elif recorded_at:
        query = query.filter(
            SymptomRecord.symptom_name == symptom_name,
            SymptomRecord.recorded_at == parse_recorded_at(recorded_at),
        )
    else:
        query = query.filter(SymptomRecord.symptom_name == symptom_name)

    deleted_count = query.delete(synchronize_session=False)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Symptom not found")

    db.commit()
    return {"message": "Symptom removed", "patient_id": patient_id}
