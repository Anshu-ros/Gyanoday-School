from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TeacherBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    subject: str = Field(..., min_length=2, max_length=80)
    qualifications: str = Field(..., min_length=3, max_length=255)
    years_of_experience: int = Field(..., ge=0, le=60)
    bio: str = Field(..., min_length=10)


class TeacherCreate(TeacherBase):
    pass


class TeacherRead(TeacherBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InquiryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    contact_details: str = Field(..., min_length=5, max_length=255)
    role: str = Field(..., pattern="^(parent|student)$")
    grade: str = Field(..., min_length=1, max_length=20)
    message: str = Field(..., min_length=10, max_length=2000)


class InquiryCreate(InquiryBase):
    pass


class InquiryRead(InquiryBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdmissionBase(BaseModel):
    applicant_name: str = Field(..., min_length=2, max_length=120)
    contact_details: str = Field(..., min_length=5, max_length=255)
    child_name: str = Field(..., min_length=2, max_length=120)
    grade: str = Field(..., min_length=1, max_length=20)
    message: str = Field(..., min_length=10, max_length=2000)


class AdmissionCreate(AdmissionBase):
    pass


class AdmissionRead(AdmissionBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|read|resolved)$")


class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    password: str = Field(..., min_length=6, max_length=128)


class AdminUserResponse(BaseModel):
    username: str

    model_config = ConfigDict(from_attributes=True)
