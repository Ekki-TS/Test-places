from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        Index("idx_reservations_branch_time", "branch_id", "reserved_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    table_id: Mapped[int | None] = mapped_column(ForeignKey("dining_tables.id"), nullable=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    guest_name: Mapped[str] = mapped_column(String(100))
    guest_phone: Mapped[str] = mapped_column(String(20))
    party_size: Mapped[int] = mapped_column(Integer)
    reserved_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
