from sqlalchemy.orm import Session

from models.user_model import User
from security import verify_password, create_access_token


def user_to_dict(user: User):
    # Không bao giờ trả password_hash ra ngoài
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.name,
        "branch_id": user.branch_id,
    }


def login(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    # Báo lỗi chung chung, không nói rõ sai email hay sai mật khẩu
    if user is None or not verify_password(password, user.password_hash):
        raise ValueError("Sai email hoặc mật khẩu")

    if not user.is_active:
        raise ValueError("Tài khoản đã bị khóa")

    token = create_access_token(user.id, user.role.name)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_to_dict(user),
    }