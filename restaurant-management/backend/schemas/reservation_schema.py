import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

PHONE_PATTERN = re.compile(r"^(0|\+84)\d{9,10}$")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PREFERENCES = {"window", "celebration", "vip"}


def clean_phone(phone: str) -> str:
    return re.sub(r"[\s.\-]", "", phone or "")


class ReservationCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    branch_id: int
    reservation_time: datetime
    party_size: int
    preference: Optional[str] = None
    note: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def check_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Họ tên phải từ 2 đến 100 ký tự")
        return v

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str) -> str:
        v = clean_phone(v)
        if not PHONE_PATTERN.match(v):
            raise ValueError("Số điện thoại không hợp lệ")
        return v

    @field_validator("email")
    @classmethod
    def check_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        v = v.strip()
        if len(v) > 100 or not EMAIL_PATTERN.match(v):
            raise ValueError("Email không hợp lệ")
        return v

    @field_validator("reservation_time")
    @classmethod
    def check_time(cls, v: datetime) -> datetime:
        # Giờ nhà hàng tính theo giờ địa phương, bỏ múi giờ và giây nếu có
        return v.replace(tzinfo=None, second=0, microsecond=0)

    @field_validator("party_size")
    @classmethod
    def check_party_size(cls, v: int) -> int:
        if v < 1 or v > 20:
            raise ValueError("Số khách phải từ 1 đến 20")
        return v

    @field_validator("preference")
    @classmethod
    def check_preference(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if v not in PREFERENCES:
            raise ValueError("Ưu tiên chỗ ngồi không hợp lệ")
        return v

    @field_validator("note")
    @classmethod
    def check_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 255:
            raise ValueError("Ghi chú tối đa 255 ký tự")
        return v or None


class ReservationOut(BaseModel):
    id: int
    code: str
    full_name: str
    phone: str
    email: Optional[str] = None
    branch_id: int
    branch_name: str
    branch_address: str
    table_id: Optional[int] = None
    reservation_time: datetime
    party_size: int
    preference: Optional[str] = None
    note: Optional[str] = None
    status: str
    created_at: datetime