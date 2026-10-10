from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import Admission, AdminUser, Inquiry, Teacher
from app.db.schemas import AdminLoginRequest, AdminUserResponse, AdmissionRead, InquiryRead, StatusUpdate, TeacherCreate, TeacherRead, TokenResponse

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/admin")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def admin_login(request: Request, payload: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.username == payload.username).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
    return {"access_token": create_access_token(admin.username), "token_type": "bearer"}


@router.get("/me", response_model=AdminUserResponse)
def admin_me(current_admin: AdminUser = Depends(get_current_admin)):
    return current_admin


@router.get("/inquiries", response_model=list[InquiryRead])
def list_inquiries(
    status: str | None = None,
    sort: str = "created_at_desc",
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    query = db.query(Inquiry)
    if status:
        query = query.filter(Inquiry.status == status)

    if sort == "created_at_asc":
        query = query.order_by(Inquiry.created_at.asc())
    else:
        query = query.order_by(Inquiry.created_at.desc())
    return query.all()


@router.patch("/inquiries/{inquiry_id}", response_model=InquiryRead)
def update_inquiry_status(
    inquiry_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    inquiry.status = payload.status
    db.commit()
    db.refresh(inquiry)
    return inquiry


@router.get("/admissions", response_model=list[AdmissionRead])
def list_admissions(
    status: str | None = None,
    sort: str = "created_at_desc",
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    query = db.query(Admission)
    if status:
        query = query.filter(Admission.status == status)

    if sort == "created_at_asc":
        query = query.order_by(Admission.created_at.asc())
    else:
        query = query.order_by(Admission.created_at.desc())
    return query.all()


@router.patch("/admissions/{admission_id}", response_model=AdmissionRead)
def update_admission_status(
    admission_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    admission = db.query(Admission).filter(Admission.id == admission_id).first()
    if admission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission inquiry not found")
    admission.status = payload.status
    db.commit()
    db.refresh(admission)
    return admission


@router.get("/teachers", response_model=list[TeacherRead])
def list_admin_teachers(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    return db.query(Teacher).order_by(Teacher.subject.asc()).all()


@router.post("/teachers", response_model=TeacherRead, status_code=status.HTTP_201_CREATED)
def create_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    teacher = Teacher(**payload.model_dump())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher
