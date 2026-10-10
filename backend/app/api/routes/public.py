from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import get_settings
from app.core.security import create_csrf_token, verify_csrf_token
from app.db.models import Admission, Inquiry, Teacher
from app.db.schemas import AdmissionCreate, InquiryCreate, TeacherRead

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api")


@router.get("/health")
def healthcheck():
    return {"status": "ok", "app": settings.app_name}


@router.get("/csrf-token")
def get_csrf_token() -> dict[str, str]:
    token = create_csrf_token()
    return {"csrfToken": token}


@router.get("/teachers", response_model=list[TeacherRead])
def list_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).order_by(Teacher.subject).all()


@router.post("/inquiries", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_inquiry(
    request: Request,
    payload: InquiryCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    verify_csrf_token(request.headers.get("x-csrf-token"))
    inquiry = Inquiry(
        name=payload.name.strip(),
        contact_details=payload.contact_details.strip(),
        role=payload.role.strip().lower(),
        grade=payload.grade.strip(),
        message=payload.message.strip(),
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    response.status_code = status.HTTP_201_CREATED
    return {"message": "Inquiry submitted successfully.", "id": inquiry.id}


@router.post("/admissions", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_admission(
    request: Request,
    payload: AdmissionCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    verify_csrf_token(request.headers.get("x-csrf-token"))
    admission = Admission(
        applicant_name=payload.applicant_name.strip(),
        contact_details=payload.contact_details.strip(),
        child_name=payload.child_name.strip(),
        grade=payload.grade.strip(),
        message=payload.message.strip(),
    )
    db.add(admission)
    db.commit()
    db.refresh(admission)
    response.status_code = status.HTTP_201_CREATED
    return {"message": "Admission inquiry submitted successfully.", "id": admission.id}
