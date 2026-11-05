from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, unique=True, index=True)
    email = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    reservations = relationship("Reservation", back_populates="customer")