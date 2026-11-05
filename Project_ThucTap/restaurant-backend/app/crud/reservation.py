from datetime import datetime, timedelta
from secrets import token_hex

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.branch import Branch
from app.models.customer import Customer
from app.models.dining_table import DiningTable
from app.models.reservation import Reservation
from app.schemas.reservation import ReservationCreate


ACTIVE_STATUSES = ("pending", "confirmed", "seated")
BOOKING_DURATION = timedelta(hours=2)


def get_active_branches(db: Session) -> list[Branch]:
    return list(db.scalars(
        select(Branch).where(Branch.is_active.is_(True)).order_by(Branch.name)
    ))


def get_available_tables(
    db: Session, branch_id: int, reserved_at: datetime, party_size: int
) -> list[DiningTable]:
    start = reserved_at - BOOKING_DURATION
    end = reserved_at + BOOKING_DURATION

    conflicts = select(Reservation.id).where(
        Reservation.table_id == DiningTable.id,
        Reservation.status.in_(ACTIVE_STATUSES),
        Reservation.reserved_at > start,
        Reservation.reserved_at < end,
    ).exists()

    query = (
        select(DiningTable)
        .where(
            DiningTable.branch_id == branch_id,
            DiningTable.status == "available",
            DiningTable.capacity >= party_size,
            ~conflicts,
        )
        .order_by(DiningTable.capacity, DiningTable.id)
    )
    return list(db.scalars(query))


def create_reservation(db: Session, data: ReservationCreate) -> Reservation:
    branch = db.scalar(
        select(Branch)
        .where(Branch.id == data.branch_id, Branch.is_active.is_(True))
        .with_for_update()
    )
    if branch is None:
        raise ValueError("Chi nhánh không tồn tại hoặc đã ngừng hoạt động")

    if data.reserved_at <= datetime.now():
        raise ValueError("Thời gian đặt bàn phải ở tương lai")

    if not (branch.open_time <= data.reserved_at.time() < branch.close_time):
        raise ValueError("Thời gian đặt bàn nằm ngoài giờ hoạt động của chi nhánh")

    tables = get_available_tables(db, data.branch_id, data.reserved_at, data.party_size)
    if not tables:
        raise ValueError("Không còn bàn phù hợp vào thời gian này. Vui lòng chọn giờ khác.")

    customer = db.scalar(
        select(Customer).where(Customer.phone == data.guest_phone)
    )
    if customer is None:
        customer = Customer(
            full_name=data.guest_name,
            phone=data.guest_phone,
            email=data.email,
        )
        db.add(customer)
        db.flush()
    else:
        customer.full_name = data.guest_name
        if data.email:
            customer.email = data.email

    reservation = Reservation(
        code=f"RS{token_hex(4).upper()}",
        branch_id=data.branch_id,
        table_id=tables[0].id,
        customer_id=customer.id,
        guest_name=data.guest_name,
        guest_phone=data.guest_phone,
        party_size=data.party_size,
        reserved_at=data.reserved_at,
        status="pending",
        note=data.note,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


def lookup_reservation(db: Session, code: str, phone: str) -> Reservation | None:
    return db.scalar(
        select(Reservation).where(
            Reservation.code == code.strip().upper(),
            Reservation.guest_phone == phone.strip(),
        )
    )


def cancel_reservation(db: Session, reservation: Reservation) -> Reservation:
    if reservation.status not in ("pending", "confirmed"):
        raise ValueError("Chỉ có thể hủy đặt bàn đang chờ hoặc đã xác nhận")
    if reservation.reserved_at <= datetime.now():
        raise ValueError("Không thể hủy đặt bàn đã đến giờ phục vụ")
    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)
    return reservation
