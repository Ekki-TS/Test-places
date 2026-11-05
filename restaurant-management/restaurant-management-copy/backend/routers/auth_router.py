from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models.user_model import User
from responses import success_response, error_response
from schemas.auth_schema import LoginRequest
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    try:
        data = auth_service.login(db, body.email, body.password)
        return success_response(request, "Đăng nhập thành công", data)
    except ValueError as e:
        return error_response(request, str(e), "Unauthorized", 401)
    except Exception as e:
        db.rollback()
        return error_response(request, "Lỗi máy chủ", str(e), 500)


@router.get("/me")
def me(request: Request, current_user: User = Depends(get_current_user)):
    return success_response(request, "Lấy thông tin thành công", auth_service.user_to_dict(current_user))