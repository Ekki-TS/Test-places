from sqlalchemy import Boolean, Column, Integer, String

from database import Base


# Ban toi thieu de web khach hien thi chi nhanh va tinh suc chua khi dat ban.
# Neu module 1 (Auth va nhan su, chi nhanh) co model Branch day du hon thi
# gop lai thanh MOT file duy nhat, giu ten bang "branches" va cac cot duoi day.
class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    total_seats = Column(Integer, nullable=False, default=60)
    is_active = Column(Boolean, nullable=False, default=True)