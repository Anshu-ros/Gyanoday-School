from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routes import admin, chat, public
from app.db.database import Base, engine
from app.db.models import AdminUser
from app.seed import seed_initial_data

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Gyanoday School API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router)
app.include_router(admin.router)
app.include_router(chat.router)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    seed_initial_data()


@app.get("/")
def root():
    return {"message": "Gyanoday School API ready."}
