from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

# Chuỗi bí mật để ký token. Đổi thành chuỗi riêng của nhóm.
SECRET_KEY = "doi-chuoi-bi-mat-nay-truoc-khi-nop-bai"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, role_name: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role_name, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    # jwt.decode kiểm tra đầy đủ chữ ký và hạn dùng, lỗi thì ném JWTError
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])