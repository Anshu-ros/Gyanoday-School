from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.database import SessionLocal
from app.db.models import AdminUser, Teacher

settings = get_settings()


def seed_initial_data() -> None:
    db: Session = SessionLocal()
    try:
        if not db.query(AdminUser).filter(AdminUser.username == settings.admin_username).first():
            admin = AdminUser(username=settings.admin_username, password_hash=hash_password(settings.admin_password))
            db.add(admin)

        if db.query(Teacher).count() == 0:
            teachers = [
                {
                    "name": "Placeholder Teacher 1",
                    "subject": "Hindi",
                    "qualifications": "M.A. Hindi, B.Ed.",
                    "years_of_experience": 8,
                    "bio": "Dedicated teacher helping students build fluency, confidence, and a deeper appreciation for the Hindi language and literature.",
                },
                {
                    "name": "Placeholder Teacher 2",
                    "subject": "English",
                    "qualifications": "M.A. English, B.Ed.",
                    "years_of_experience": 10,
                    "bio": "Encourages communication, creative writing, and critical thinking through engaging, student-centered learning.",
                },
                {
                    "name": "Placeholder Teacher 3",
                    "subject": "Mathematics",
                    "qualifications": "M.Sc. Mathematics, B.Ed.",
                    "years_of_experience": 12,
                    "bio": "Focuses on logical reasoning and problem-solving while making abstract concepts approachable for every learner.",
                },
                {
                    "name": "Placeholder Teacher 4",
                    "subject": "Biology",
                    "qualifications": "M.Sc. Biology, B.Ed.",
                    "years_of_experience": 9,
                    "bio": "Brings science to life through practical demonstrations, inquiry-based learning, and clear explanations of living systems.",
                },
                {
                    "name": "Placeholder Teacher 5",
                    "subject": "Physics",
                    "qualifications": "M.Sc. Physics, B.Ed.",
                    "years_of_experience": 11,
                    "bio": "Helps students understand motion, energy, and scientific concepts through experiments and real-world applications.",
                },
                {
                    "name": "Placeholder Teacher 6",
                    "subject": "Chemistry",
                    "qualifications": "M.Sc. Chemistry, B.Ed.",
                    "years_of_experience": 10,
                    "bio": "Creates a supportive environment where students develop curiosity, lab skills, and confidence in the molecular sciences.",
                },
                {
                    "name": "Placeholder Teacher 7",
                    "subject": "Social Science",
                    "qualifications": "M.A. History, B.Ed.",
                    "years_of_experience": 7,
                    "bio": "Guides students to explore civics, geography, and history through discussions, projects, and community connections.",
                },
            ]
            db.add_all(Teacher(**teacher_data) for teacher_data in teachers)

        db.commit()
    finally:
        db.close()
