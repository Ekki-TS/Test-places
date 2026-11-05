from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base

# Trạng thái đặt bàn
STATUS_PENDING = "pending"        # chờ nhà hàng xác nhận
STATUS_CONFIRMED = "confirmed"    # đã xác nhận
STATUS_CANCELLED = "cancelled"    # đã hủy
STATUS_COMPLETED = "completed"    # khách đã đến / hoàn tất


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(12), nullable=False, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, index=True)
    # table_id thuộc module Menu và bàn: chỉ lưu id, chưa tạo ForeignKey.
    table_id = Column(Integer, nullable=True)
    reservation_time = Column(DateTime, nullable=False, index=True)
    party_size = Column(Integer, nullable=False)
    preference = Column(String(30), nullable=True)   # window | celebration | vip
    note = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default=STATUS_PENDING)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    customer = relationship("Customer", back_populates="reservations")
    branch = relationship("Branch")