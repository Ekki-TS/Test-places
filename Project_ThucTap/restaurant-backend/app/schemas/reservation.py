from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReservationCreate(BaseModel):
    branch_id: int = Field(gt=0)
    guest_name: str = Field(min_length=2, max_length=100)
    guest_phone: str = Field(min_length=9, max_length=20)
    email: str | None = Field(default=None, max_length=100)
    party_size: int = Field(ge=1, le=30)
    reserved_at: datetime
    note: str | None = Field(default=None, max_length=255)

    @field_validator("guest_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Vui lòng nhập họ tên")
        return value

    @field_validator("guest_phone")
    @classmethod
    def clean_phone(cls, value: str) -> str:
        value = value.strip().replace(" ", "").replace("-", "")
        if not value.isdigit():
            raise ValueError("Số điện thoại chỉ được chứa chữ số")
        return value

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ReservationLookup(BaseModel):
    code: str = Field(min_length=4, max_length=20)
    phone: str = Field(min_length=9, max_length=20)


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    branch_id: int
    table_id: int | None
    guest_name: str
    guest_phone: str
    party_size: int
    reserved_at: datetime
    status: str
    note: str | None
    created_at: datetime


class AvailabilityOut(BaseModel):
    available: bool
    available_tables: int
    message: str
