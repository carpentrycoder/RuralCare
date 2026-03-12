from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model for request validation
class UserLogin(BaseModel):
    name: str

@app.get("/")
def home():
    return {"message": "FastAPI is running"}

@app.get("/hello")
def hello():
    return {"message": "Hello from FastAPI"}

@app.post("/login")
def login(user: UserLogin):
    if not user.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    
    try:
        db = next(get_db())
        new_user = User(name=user.name.strip())
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": "User logged in successfully",
            "user_id": new_user.id,
            "name": new_user.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users")
def get_users():
    try:
        db = next(get_db())
        users = db.query(User).order_by(User.created_at.desc()).all()
        return {
            "users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "created_at": user.created_at.isoformat()
                }
                for user in users
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))