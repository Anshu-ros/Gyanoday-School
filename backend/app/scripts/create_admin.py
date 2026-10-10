from app.core.config import get_settings
from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.db.models import AdminUser

settings = get_settings()


def create_admin_user() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.username == settings.admin_username).first()
        if existing:
            print(f"Admin user '{settings.admin_username}' already exists.")
            return

        admin = AdminUser(username=settings.admin_username, password_hash=hash_password(settings.admin_password))
        db.add(admin)
        db.commit()
        print(f"Admin user '{settings.admin_username}' created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()
