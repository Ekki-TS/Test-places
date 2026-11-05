from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class DiningTable(Base):
    __tablename__ = "dining_tables"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    table_number: Mapped[str] = mapped_column(String(20))
    capacity: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="available")
